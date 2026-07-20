<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ThemePreset;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CRUD tema (theme preset) — personal per-akun, bukan konfigurasi toko.
 * Preset dengan is_system = true adalah tema built-in bawaan aplikasi dan
 * tidak bisa diubah/dihapus oleh user (owner sekalipun).
 */
class ThemeController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::user();

        // System templates di-handle oleh frontend (JS) — backend cukup
        // mengirim tema custom milik user dari database.
        $userThemes = ThemePreset::query()
            ->forUser($user->id)
            ->orderByDesc('updated_at')
            ->get();

        return Inertia::render('Admin/Themes/Index', [
            'userThemes' => $userThemes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Themes/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);

        /** @var User $user */
        $user = Auth::user();

        $data = [
            ...$validated,
            'is_dark' => $request->boolean('is_dark'),
            'user_id' => $user->id,
            'is_system' => false,
        ];

        // Simpan full token JSON jika dikirim
        if ($request->has('light_tokens')) {
            $data['light_tokens'] = $request->input('light_tokens');
        }
        if ($request->has('dark_tokens')) {
            $data['dark_tokens'] = $request->input('dark_tokens');
        }

        ThemePreset::create($data);

        return redirect()
            ->route('admin.themes.index')
            ->with('success', "Tema \"{$validated['name']}\" berhasil ditambahkan.");
    }

    public function edit(ThemePreset $theme): RedirectResponse|Response
    {
        if ($theme->is_system) {
            return redirect()
                ->route('admin.themes.index')
                ->withErrors(['theme' => 'Tema sistem tidak bisa diubah.']);
        }

        $this->authorizeOwnership($theme);

        return Inertia::render('Admin/Themes/Edit', [
            'theme' => $theme,
        ]);
    }

    public function update(Request $request, ThemePreset $theme): RedirectResponse
    {
        if ($theme->is_system) {
            return back()->withErrors(['theme' => 'Tema sistem tidak bisa diubah.']);
        }

        $this->authorizeOwnership($theme);

        $validated = $this->validated($request);

        $data = [
            ...$validated,
            'is_dark' => $request->boolean('is_dark'),
        ];

        if ($request->has('light_tokens')) {
            $data['light_tokens'] = $request->input('light_tokens');
        }
        if ($request->has('dark_tokens')) {
            $data['dark_tokens'] = $request->input('dark_tokens');
        }

        $theme->update($data);

        return redirect()
            ->route('admin.themes.index')
            ->with('success', "Tema \"{$theme->name}\" berhasil diperbarui.");
    }

    public function destroy(ThemePreset $theme): RedirectResponse
    {
        if ($theme->is_system) {
            return back()->withErrors(['theme' => 'Tema sistem tidak bisa dihapus.']);
        }

        $this->authorizeOwnership($theme);

        $themeName = $theme->name;
        $theme->delete();

        return redirect()
            ->route('admin.themes.index')
            ->with('success', "Tema \"{$themeName}\" berhasil dihapus.");
    }

    private function authorizeOwnership(ThemePreset $theme): void
    {
        /** @var User $user */
        $user = Auth::user();

        abort_if($theme->user_id !== $user->id, 403);
    }

    /**
     * @return array{name: string, description: ?string, primary: string, secondary: string, accent: string, is_dark: bool}
     */
    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:255'],
            'primary' => ['required', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
            'secondary' => ['required', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
            'accent' => ['required', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
            'is_dark' => ['nullable', 'boolean'],
        ]);

        // Normalisasi description kosong jadi null (bukan empty string).
        $validated['description'] = $validated['description'] ?: null;

        // is_dark tidak dipakai dari sini — di-set explicit via
        // $request->boolean('is_dark') di store()/update() supaya konsisten
        // walau checkbox unchecked tidak mengirim field sama sekali.
        unset($validated['is_dark']);

        return $validated;
    }
}
