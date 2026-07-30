<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SidebarPreferenceController extends Controller
{
    /**
     * Simpan layout sidebar custom user ke database (dipanggil useSidebarOrder
     * via fetch di background — bukan Inertia visit, supaya tidak reload).
     *
     * Bentuknya cuma divalidasi secara struktural (array of string), tidak
     * terhadap daftar groupKey/itemKey yang valid — daftar itu dibangun di
     * frontend (navConfig.js) dan berbeda per tipe toko + plan. Kunci asing
     * yang tidak lagi cocok sudah ditangani applyCustomLayout() di frontend:
     * item dengan placement ke grup yang tidak ada otomatis pulang ke grup
     * asalnya.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'groups' => ['nullable', 'array'],
            'groups.*' => ['string'],
            'items' => ['nullable', 'array'],
            'items.*' => ['array'],
            'items.*.*' => ['string'],
            'placement' => ['nullable', 'array'],
            'placement.*' => ['string'],
            // Nama custom per grup. Kosongkan (hapus key-nya) untuk kembali
            // ke nama bawaan — ditangani di frontend, bukan di sini.
            'groupLabels' => ['nullable', 'array'],
            'groupLabels.*' => ['string', 'max:50'],
        ]);

        /** @var User $user */
        $user = Auth::user();
        $user->update(['sidebar_preference' => $validated]);

        return response()->json(['success' => true]);
    }
}
