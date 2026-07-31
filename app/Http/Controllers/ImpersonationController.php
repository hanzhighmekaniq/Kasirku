<?php

namespace App\Http\Controllers;

use App\Models\DeveloperActionLog;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\PermissionRegistrar;

/**
 * "Login sebagai" — developer meminjam sesi seorang owner/karyawan toko
 * untuk keperluan support/debug, tanpa perlu tahu password mereka.
 *
 * Berbeda dari login normal: session_token TIDAK diganti (lihat exception
 * di EnsureSingleSession), supaya sesi asli si owner di device lain tidak
 * ikut logout. Developer asli disimpan di session('impersonator_id') dan
 * dikembalikan lewat stop().
 */
class ImpersonationController extends Controller
{
    /** Developer meminjam sesi salah satu user (non-developer) di sebuah toko. */
    public function start(Request $request, Store $store, User $user): RedirectResponse
    {
        abort_if($user->isDeveloper(), 403, 'Tidak bisa impersonate akun developer.');
        abort_unless($store->users()->where('users.id', $user->id)->exists(), 404);

        /** @var User $developer */
        $developer = Auth::user();

        // Catat log SEBELUM Auth::login() beralih — auth()->id() di dalam
        // record() harus tetap menunjuk ke developer, bukan user yang
        // di-impersonate.
        DeveloperActionLog::record('store.impersonate', $store, null, [
            'impersonated_user_id' => $user->id,
            'impersonated_user_name' => $user->name,
        ]);

        $request->session()->put('impersonator_id', $developer->id);
        $request->session()->put('impersonator_name', $developer->name);

        Auth::login($user);
        $request->session()->put('current_store_id', $store->id);
        $request->session()->forget('current_branch_id');

        app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);

        return redirect()->route('admin.dashboard')->with(
            'success',
            "Sedang login sebagai {$user->name} — toko \"{$store->name}\".",
        );
    }

    /** Kembali ke akun developer asli. */
    public function stop(Request $request): RedirectResponse
    {
        $impersonatorId = $request->session()->get('impersonator_id');

        if (! $impersonatorId) {
            return redirect()->route('admin.dashboard');
        }

        $developer = User::find($impersonatorId);

        $request->session()->forget(['impersonator_id', 'impersonator_name', 'current_store_id', 'current_branch_id']);

        if ($developer) {
            Auth::login($developer);
        } else {
            Auth::logout();
        }

        return redirect()->route('developer.dashboard')->with('success', 'Kembali ke akun developer.');
    }
}
