<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class EnsureSingleSession
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Developer boleh multi-device
        if ($user->isDeveloper()) {
            return $next($request);
        }

        // User baru login (ada session_token di DB) — cek kecocokan
        if ($user->session_token) {
            $sessionToken = $request->session()->get("session_token");

            if ($sessionToken !== $user->session_token) {
                Auth::guard("web")->logout();

                // Flash dulu SEBELUM invalidate agar pesan tidak hilang
                $request
                    ->session()
                    ->flash(
                        "error",
                        "Akun ini login di perangkat lain. Silakan login ulang.",
                    );
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route("login");
            }
        }
        return $next($request);
    }
}
