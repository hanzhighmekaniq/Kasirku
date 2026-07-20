<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ThemePreferenceController extends Controller
{
    /**
     * Simpan pilihan tema user ke database (dipanggil ThemeProvider via
     * fetch di background — bukan Inertia visit, supaya tidak reload).
     *
     * Payload cocok dengan bentuk `ThemePreference` di
     * resources/js/Theme/tokens.js.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'templateId' => [
                'required',
                'string',
                'in:ocean-blue,emerald-green,sunset-orange,royal-indigo,midnight-ocean,forest-night,ember-night,cosmic-indigo,custom',
            ],
            'mode' => ['required', 'string', 'in:light,dark,system'],
            'custom' => ['nullable', 'array'],
            'custom.primary' => ['required_with:custom', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
            'custom.secondary' => ['required_with:custom', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
            'custom.accent' => ['required_with:custom', 'string', 'regex:/^#?[0-9A-Fa-f]{6}$/'],
        ]);

        /** @var User $user */
        $user = Auth::user();
        $user->update(['theme_preference' => $validated]);

        return response()->json(['success' => true]);
    }
}
