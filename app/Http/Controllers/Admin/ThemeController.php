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

        ThemePreset::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'user_id' => $user->id,
            'is_system' => false,
            'tokens' => [
                'light' => $request->input('light_tokens', []),
                'dark' => $request->input('dark_tokens', []),
            ],
        ]);

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

        $theme->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'tokens' => [
                'light' => $request->input('light_tokens', $theme->light_tokens),
                'dark' => $request->input('dark_tokens', $theme->dark_tokens),
            ],
        ]);

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
     * @return array{name: string, description: ?string}
     */
    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:255'],
            'light_tokens' => ['required', 'array'],
            'light_tokens.primary' => ['required', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
            'dark_tokens' => ['required', 'array'],
            'dark_tokens.primary' => ['required', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
        ]);

        // Normalisasi description kosong jadi null (bukan empty string).
        $validated['description'] = $validated['description'] ?: null;

        return [
            'name' => $validated['name'],
            'description' => $validated['description'],
        ];
    }
}
