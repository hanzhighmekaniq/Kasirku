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

        $preset = $user->themePresets()->create([
            ...$validated,
            'is_system' => false,
        ]);

        return response()->json(['success' => true, 'preset' => $preset]);
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
