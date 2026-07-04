<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\PermissionRegistrar;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        if (auth()->check()) {
            $user = auth()->user();
            if ($user->isDeveloper()) {
                return redirect()->route("developer.dashboard");
            }
            $firstStore = $user->stores()->first();
            if ($firstStore && !session("current_store_id")) {
                session(["current_store_id" => $firstStore->id]);
            }
            return redirect()->route("admin.dashboard");
        }

        return Inertia::render("Auth/Login", [
            "canResetPassword" => Route::has("password.request"),
            "status" => session("status"),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = $request->user();

        // ── Developer → dashboard khusus, tidak perlu store context ──
        if ($user->isDeveloper()) {
            return redirect()->route("developer.dashboard");
        }

        // ── Set store aktif pertama di session ──
        $stores = $user->stores()->get();
        $storeCount = $stores->count();

        if ($storeCount === 0) {
            return redirect()
                ->route("admin.dashboard")
                ->with(
                    "error",
                    "Akun kamu belum terhubung ke toko mana pun. Hubungi developer.",
                );
        }

        $firstStore = $stores->first();
        $request->session()->put("current_store_id", $firstStore->id);

        // Set Spatie team context ke store pertama
        app(PermissionRegistrar::class)->setPermissionsTeamId($firstStore->id);

        // ── Kasir: set branch dari employee record langsung ──
        if ($user->hasRole("kasir")) {
            $branchId = $user->employee?->branch_id;
            if ($branchId) {
                $request->session()->put("branch_id", $branchId);
                $request->session()->put("current_branch_id", $branchId);
            }
            return redirect()->intended(
                route("admin.dashboard", absolute: false),
            );
        }

        // ── Owner/Admin dengan banyak toko → pilih toko dulu ──
        if ($storeCount > 1) {
            return redirect()->route("admin.store.select");
        }

        // ── 1 toko, cek jumlah cabang aktif ──
        if ($storeCount === 1) {
            $branchCount = $firstStore
                ->branches()
                ->where("is_active", true)
                ->count();

            if ($branchCount > 1) {
                return redirect()->route("admin.branch.select");
            }
        }

        // ── 1 toko, 0-1 cabang → langsung dashboard ──
        return redirect()->intended(route("admin.dashboard", absolute: false));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard("web")->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect("/");
    }
}
