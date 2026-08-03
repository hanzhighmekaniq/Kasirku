<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman sambutan untuk user yang sudah login tapi belum punya toko.
 *
 * User bisa melihat info akun, mengakses profile, dan memulai onboarding
 * untuk membuat toko pertama. Semua route /app/* tetap terlarang sampai
 * onboarding selesai.
 */
class WelcomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Welcome');
    }
}
