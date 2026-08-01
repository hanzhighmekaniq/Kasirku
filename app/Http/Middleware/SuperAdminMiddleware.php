<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Batasi aksi yang hanya boleh dilakukan Super Admin.
 *
 * Dipasang di atas middleware `developer`, jadi pemanggilnya sudah pasti
 * developer. Yang dicek di sini murni levelnya: support agent ditolak untuk
 * aksi destruktif (hapus toko/user) dan perubahan konfigurasi platform
 * (plan, fitur, jenis usaha, template bisnis, payment gateway, role).
 */
class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $user->isSuperAdmin()) {
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Aksi ini hanya untuk Super Admin.',
                ], 403);
            }

            abort(403, 'Aksi ini hanya untuk Super Admin. Akun kamu terdaftar sebagai Support.');
        }

        return $next($request);
    }
}
