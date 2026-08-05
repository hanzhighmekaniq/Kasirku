<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blokir request mutasi (POST/PUT/PATCH/DELETE) jika email belum diverifikasi.
 *
 * Hanya berlaku untuk user non-developer yang belum punya email_verified_at.
 * GET/HEAD/OPTIONS tetap diizinkan supaya user masih bisa navigasi.
 */
class EnsureEmailVerifiedForMutations
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user
            && ! $user->isDeveloper()
            && ! $user->hasVerifiedEmail()
            && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])
        ) {
            // Paksa full-page redirect ke halaman verifikasi (bukan JSON biasa)
            return Inertia::location(route('verification.notice'));
        }

        return $next($request);
    }
}
