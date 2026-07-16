<?php

use App\Http\Middleware\BranchMiddleware;
use App\Http\Middleware\CheckFeatureAccess;
use App\Http\Middleware\CheckFeatureDetailAccess;
use App\Http\Middleware\DeveloperMiddleware;
use App\Http\Middleware\EnsureActiveShift;
use App\Http\Middleware\EnsureSingleSession;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PermissionMiddleware;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\StoreMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');
        $middleware->web(
            append: [
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,
            ],
        );

        // Alias for middleware
        $middleware->alias([
            'single-session' => EnsureSingleSession::class,
            'store' => StoreMiddleware::class,
            'branch' => BranchMiddleware::class,
            'role' => RoleMiddleware::class,
            'developer' => DeveloperMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'active_shift' => EnsureActiveShift::class,
            'ensure.shift' => EnsureActiveShift::class,
            'feature' => CheckFeatureAccess::class,
            'feature-detail' => CheckFeatureDetailAccess::class,
        ]);

        // CSRF exception for payment gateway webhooks + offline transaction sync
        $middleware->validateCsrfTokens(
            except: ['webhooks/*', 'app/kasir/store', 'app/customers/*/pay-debt'],
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // ── Spatie UnauthorizedException: tampilkan halaman error yang jelas ──
        $exceptions->renderable(function (
            UnauthorizedException $e,
            $request,
        ) {
            if ($request->header('X-Inertia')) {
                return Inertia::render('Blocked/PermissionDenied', [
                    'permission' => $e->getMessage(),
                    'error' => 'Anda tidak memiliki izin: '.$e->getMessage(),
                ])
                    ->toResponse($request)
                    ->setStatusCode(403);
            }
            abort(403, $e->getMessage());
        });

        // ── 403: tampilkan error, jangan redirect silent ──
        $exceptions->renderable(function (
            AccessDeniedHttpException $e,
            $request,
        ) {
            if ($request->header('X-Inertia')) {
                return Inertia::render('Blocked/PermissionDenied', [
                    'permission' => $request->route()?->getName() ?? 'unknown',
                    'error' => $e->getMessage() ?:
                        'Anda tidak memiliki akses ke halaman ini.',
                ])
                    ->toResponse($request)
                    ->setStatusCode(403);
            }
            if (Auth::check()) {
                return redirect()
                    ->route('admin.dashboard')
                    ->with(
                        'error',
                        'Akses ditolak: '.
                            ($e->getMessage() ?: 'Anda tidak memiliki izin.'),
                    );
            }

            return redirect()->route('login');
        });

        // ── 404: tampilkan pesan, jangan redirect silent ──
        $exceptions->renderable(function (
            NotFoundHttpException $e,
            $request,
        ) {
            if ($request->header('X-Inertia')) {
                return Inertia::render('Blocked/NotFound', [
                    'error' => 'Halaman tidak ditemukan.',
                ])
                    ->toResponse($request)
                    ->setStatusCode(404);
            }
            if (Auth::check()) {
                return redirect()
                    ->route('admin.dashboard')
                    ->with('error', 'Halaman tidak ditemukan.');
            }

            return redirect()->route('login');
        });

        // ── 500+ umum — redirect ke dashboard dengan error message ──
        $exceptions->renderable(function (Throwable $e, $request) {
            // HTTP exception sudah di-handle di atas
            if (
                $e instanceof HttpException
            ) {
                return null; // biarkan handler default yang jalan
            }

            // Cek apakah ini request Inertia
            if ($request->header('X-Inertia')) {
                if (Auth::check()) {
                    return redirect()
                        ->route('admin.dashboard')
                        ->with(
                            'error',
                            'Terjadi kesalahan sistem. Silakan coba lagi. Error: '.
                                $e->getMessage(),
                        );
                }

                return redirect()->route('login');
            }

            // Non-Inertia: biarkan error view default
            return null;
        });
    })
    ->create();
