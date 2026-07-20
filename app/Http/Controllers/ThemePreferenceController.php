<?php

namespace App\Http\Controllers;

use App\Models\ThemePreset;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ThemePreferenceController extends Controller
{
    /**
     * Simpan pilihan tema user ke database (dipanggil ThemeProvider via
     * fetch di background — bukan Inertia visit, supaya tidak reload).
     *
     * templateId sekarang divalidasi terhadap slug preset sistem di DB
     * (bukan whitelist hardcoded) — supaya template baru dari seeder
     * otomatis valid tanpa perlu ubah kode ini.
     *
     * Format baru: customTokens berisi {light: ThemeTokens, dark: ThemeTokens}
     * dengan 36 key per mode (shadcn/ui convention).
     *
     * Format lama (custom: {primary, secondary, accent}) masih diterima
     * untuk backward compatibility — akan disimpan apa adanya dan ThemeProvider
     * di frontend yang handle konversi.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'templateId' => [
                'required',
                'string',
                Rule::in(['custom', ...ThemePreset::system()->pluck('slug')->filter()->all()]),
            ],
            'mode' => ['required', 'string', 'in:light,dark,system'],
            // Format baru: full token object
            'customTokens' => ['nullable', 'array'],
            'customTokens.light' => ['required_with:customTokens', 'array'],
            'customTokens.dark' => ['required_with:customTokens', 'array'],
            // Format lama: 3 warna dasar (backward compat)
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
