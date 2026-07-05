<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

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
            "store" => \App\Http\Middleware\StoreMiddleware::class,
            "branch" => \App\Http\Middleware\BranchMiddleware::class,
            "role" => \App\Http\Middleware\RoleMiddleware::class,
            "developer" => \App\Http\Middleware\DeveloperMiddleware::class,
            "permission" =>
                \Spatie\Permission\Middleware\PermissionMiddleware::class,
            "active_shift" => \App\Http\Middleware\EnsureActiveShift::class,
            "ensure.shift" => \App\Http\Middleware\EnsureActiveShift::class,
            "feature" => \App\Http\Middleware\CheckFeatureAccess::class,
        ]);

        // CSRF exception for payment gateway webhooks + offline transaction sync
        $middleware->validateCsrfTokens(
            except: ["webhooks/*", "admin/kasir/store"],
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // 403 — Auto-redirect ke halaman yang bisa diakses
        $exceptions->renderable(function (
            \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e,
            $request,
        ) {
            if (auth()->check()) {
                return redirect()->route("admin.dashboard");
            }
            return redirect()->route("login");
        });

        // 404 — Auto-redirect ke halaman yang bisa diakses
        $exceptions->renderable(function (
            \Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e,
            $request,
        ) {
            if (auth()->check()) {
                return redirect()->route("admin.dashboard");
            }
            return redirect()->route("login");
        });

        // 500+ umum — JANGAN putih, redirect ke dashboard dengan error message
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
                // Inertia request: return 500 dengan flash error
                if (auth()->check()) {
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
