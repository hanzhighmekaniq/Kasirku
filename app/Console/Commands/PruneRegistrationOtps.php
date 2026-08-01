<?php

namespace App\Console\Commands;

use App\Models\RegistrationOtp;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Bersihkan kode OTP registrasi yang sudah lewat masa berlaku.
 *
 * Baris OTP menahan data form registrasi yang tidak pernah diselesaikan.
 * Tanpa pembersihan berkala, tabel ini akan menumpuk sampah dari
 * percobaan registrasi yang ditinggalkan. Diberi jeda 24 jam setelah
 * kedaluwarsa supaya masih bisa ditelusuri kalau ada laporan masalah.
 */
class PruneRegistrationOtps extends Command
{
    protected $signature = 'registration-otp:prune';

    protected $description = 'Hapus kode OTP registrasi yang kedaluwarsa lebih dari 24 jam';

    public function handle(): int
    {
        $count = RegistrationOtp::where('expires_at', '<', now()->subDay())->delete();

        $this->info("Done: {$count} kode OTP kedaluwarsa dihapus.");
        Log::channel('daily')->info("[registration-otp:prune] Dihapus={$count}");

        return self::SUCCESS;
    }
}
