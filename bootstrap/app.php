<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Auth;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . "/../routes/web.php",
        commands: __DIR__ . "/../routes/console.php",
        health: "/up",
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: "*");
        $middleware->web(
            append: [
                \App\Http\Middleware\HandleInertiaRequests::class,
                \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            ],
        );

        // Alias for middleware
        $middleware->alias([
            "single-session" => \App\Http\Middleware\EnsureSingleSession::class,
            "store" => \App\Http\Middleware\StoreMiddleware::class,
            "branch" => \App\Http\Middleware\BranchMiddleware::class,
            "role" => \App\Http\Middleware\RoleMiddleware::class,
            "developer" => \App\Http\Middleware\DeveloperMiddleware::class,
            "permission" => \App\Http\Middleware\PermissionMiddleware::class,
            "active_shift" => \App\Http\Middleware\EnsureActiveShift::class,
            "ensure.shift" => \App\Http\Middleware\EnsureActiveShift::class,
            "feature" => \App\Http\Middleware\CheckFeatureAccess::class,
            "feature-detail" =>
                \App\Http\Middleware\CheckFeatureDetailAccess::class,
        ]);

        // CSRF exception for payment gateway webhooks + offline transaction sync
        $middleware->validateCsrfTokens(
            except: ["webhooks/*", "admin/kasir/store"],
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // ── Spatie UnauthorizedException: tampilkan halaman error yang jelas ──
        $exceptions->renderable(function (
            \Spatie\Permission\Exceptions\UnauthorizedException $e,
            $request,
        ) {
            if ($request->header("X-Inertia")) {
                return \Inertia\Inertia::render("Blocked/PermissionDenied", [
                    "permission" => $e->getMessage(),
                    "error" => "Anda tidak memiliki izin: " . $e->getMessage(),
                ])
                    ->toResponse($request)
                    ->setStatusCode(403);
            }
            abort(403, $e->getMessage());
        });

        // ── 403: tampilkan error, jangan redirect silent ──
        $exceptions->renderable(function (
            \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e,
            $request,
        ) {
            if ($request->header("X-Inertia")) {
                return \Inertia\Inertia::render("Blocked/PermissionDenied", [
                    "permission" => $request->route()?->getName() ?? "unknown",
                    "error" =>
                        $e->getMessage() ?:
                        "Anda tidak memiliki akses ke halaman ini.",
                ])
                    ->toResponse($request)
                    ->setStatusCode(403);
            }
            if (Auth::check()) {
                return redirect()
                    ->route("admin.dashboard")
                    ->with(
                        "error",
                        "Akses ditolak: " .
                            ($e->getMessage() ?: "Anda tidak memiliki izin."),
                    );
            }
            return redirect()->route("login");
        });

        // ── 404: tampilkan pesan, jangan redirect silent ──
        $exceptions->renderable(function (
            \Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e,
            $request,
        ) {
            if ($request->header("X-Inertia")) {
                return \Inertia\Inertia::render("Blocked/NotFound", [
                    "error" => "Halaman tidak ditemukan.",
                ])
                    ->toResponse($request)
                    ->setStatusCode(404);
            }
            if (Auth::check()) {
                return redirect()
                    ->route("admin.dashboard")
                    ->with("error", "Halaman tidak ditemukan.");
            }
            return redirect()->route("login");
        });

        // ── 500+ umum — redirect ke dashboard dengan error message ──
        $exceptions->renderable(function (\Throwable $e, $request) {
            // HTTP exception sudah di-handle di atas
            if (
                $e instanceof
                \Symfony\Component\HttpKernel\Exception\HttpException
            ) {
                return null; // biarkan handler default yang jalan
            }

            // Cek apakah ini request Inertia
            if ($request->header("X-Inertia")) {
                if (Auth::check()) {
                    return redirect()
                        ->route("admin.dashboard")
                        ->with(
                            "error",
                            "Terjadi kesalahan sistem. Silakan coba lagi. Error: " .
                                $e->getMessage(),
                        );
                }
                return redirect()->route("login");
            }

            // Non-Inertia: biarkan error view default
            return null;
        });
    })
    ->create();
