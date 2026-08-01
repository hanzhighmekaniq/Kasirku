<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    // Tahap 1: validasi form + captcha → kirim kode OTP ke email.
    // Akun & toko BELUM dibuat di tahap ini.
    Route::post('register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:5,1');

    // Tahap 2: verifikasi kode → baru User + Store dibuat.
    Route::post('register/verify', [RegisteredUserController::class, 'verifyOtp'])
        ->middleware('throttle:5,1')
        ->name('register.verify');

    Route::post('register/resend', [RegisteredUserController::class, 'resendOtp'])
        ->middleware('throttle:3,1')
        ->name('register.resend');

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    // Dibatasi + captcha: tanpa ini bot bisa spam kirim email reset ke
    // alamat siapa pun, membakar kuota SMTP dan meneror pemilik email.
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:3,1')
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
