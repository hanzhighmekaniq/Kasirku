<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware khusus developer — cek kolom is_developer di tabel users.
 * Tidak bergantung pada Spatie teams context.
 */
class DeveloperMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->isDeveloper()) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            abort(403, 'Akses khusus developer.');
        }

        return $next($request);
    }
}
