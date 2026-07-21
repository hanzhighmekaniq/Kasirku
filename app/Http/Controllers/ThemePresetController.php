<?php

namespace App\Http\Controllers;

use App\Models\ThemePreset;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ThemePresetController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'primary' => ['required', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
            'secondary' => ['required', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
            'accent' => ['required', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
            'is_dark' => ['sometimes', 'boolean'],
        ]);

        /** @var User $user */
        $user = Auth::user();

        // Generate token set minimal (36 keys) dari 3 warna dasar — dipakai
        // untuk quick custom preset lewat form 3-warna (bukan editor 36
        // token lengkap). Light & dark sengaja identik di sini karena
        // endpoint ini legacy/quick-create, bukan full customization.
        $tokens = $this->buildQuickTokens($validated['primary'], $validated['secondary'], $validated['accent']);

        $preset = $user->themePresets()->create([
            'name' => $validated['name'],
            'is_system' => false,
            'tokens' => [
                'light' => $tokens,
                'dark' => $tokens,
            ],
        ]);

        return response()->json(['success' => true, 'preset' => $preset]);
    }

    /**
     * Generate 36-key token set minimal dari 3 warna dasar (primary,
     * secondary, accent). Dipakai quick custom preset — bukan editor
     * penuh 36 token seperti di Admin\ThemeController.
     *
     * @return array<string, string>
     */
    private function buildQuickTokens(string $primary, string $secondary, string $accent): array
    {
        return [
            'background' => '#F8FAFC', 'foreground' => '#0F172A',
            'card' => '#FFFFFF', 'cardForeground' => '#0F172A',
            'popover' => '#FFFFFF', 'popoverForeground' => '#0F172A',
            'primary' => $primary, 'primaryForeground' => '#FFFFFF',
            'secondary' => $secondary, 'secondaryForeground' => '#0F172A',
            'muted' => '#F1F5F9', 'mutedForeground' => '#64748B',
            'accent' => $accent, 'accentForeground' => '#FFFFFF',
            'destructive' => '#DC2626', 'destructiveForeground' => '#FFFFFF',
            'border' => '#E2E8F0', 'input' => '#E2E8F0', 'ring' => $primary,
            'chart1' => $primary, 'chart2' => $accent, 'chart3' => '#16A34A', 'chart4' => '#F59E0B', 'chart5' => '#8B5CF6',
            'radius' => '0.5rem',
            'sidebar' => '#FFFFFF', 'sidebarForeground' => '#0F172A',
            'success' => '#16A34A', 'successForeground' => '#FFFFFF',
            'warning' => '#F59E0B', 'warningForeground' => '#FFFFFF',
            'info' => '#0284C7', 'infoForeground' => '#FFFFFF',
        ];
    }

    public function destroy(ThemePreset $preset)
    {
        // Preset sistem (built-in) tidak bisa dihapus, termasuk oleh owner.
        abort_if($preset->is_system, 403, 'Tema sistem tidak bisa dihapus.');

        /** @var User $user */
        $user = Auth::user();

        abort_if($preset->user_id !== $user->id, 403);

        $preset->delete();

        return response()->json(['success' => true]);
    }
}
