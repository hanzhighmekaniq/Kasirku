<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ConvertImagesToWebp extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'images:convert-webp
                            {--quality=80 : Kualitas WebP 0–100}
                            {--dry-run : Tampilkan rencana tanpa mengubah file}
                            {--keep-original : Jangan hapus file asli setelah konversi}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Konversi semua gambar jpg/jpeg/png di storage ke WebP dan perbarui path di database';

    /**
     * Kolom gambar per tabel yang menyimpan path relatif disk public.
     *
     * @var array<string, string>
     */
    private const IMAGE_COLUMNS = [
        'products' => 'image',
        'payment_methods' => 'image',
        'categories' => 'image',
        'stores' => 'logo',
    ];

    private const CONVERTIBLE_EXTENSIONS = ['jpg', 'jpeg', 'png'];

    public function handle(): int
    {
        if (! function_exists('imagewebp')) {
            $this->error('Ekstensi GD dengan dukungan WebP tidak tersedia. Aktifkan ext-gd terlebih dahulu.');

            return self::FAILURE;
        }

        $quality = (int) $this->option('quality');
        $dryRun = (bool) $this->option('dry-run');
        $keepOriginal = (bool) $this->option('keep-original');

        if ($quality < 0 || $quality > 100) {
            $this->error('Kualitas harus berada di antara 0 dan 100.');

            return self::FAILURE;
        }

        if ($dryRun) {
            $this->warn('Mode dry-run — tidak ada file atau data yang diubah.');
        }

        $converted = 0;
        $skipped = 0;
        $failed = 0;

        foreach (self::IMAGE_COLUMNS as $table => $column) {
            if (! DB::getSchemaBuilder()->hasTable($table)) {
                continue;
            }

            $rows = DB::table($table)
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->get(['id', $column]);

            if ($rows->isEmpty()) {
                continue;
            }

            $this->newLine();
            $this->line("<fg=cyan>{$table}.{$column}</> — {$rows->count()} baris");

            foreach ($rows as $row) {
                $path = $row->{$column};
                $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

                if (! in_array($extension, self::CONVERTIBLE_EXTENSIONS, true)) {
                    $skipped++;

                    continue;
                }

                if (! Storage::disk('public')->exists($path)) {
                    $this->line("  <fg=yellow>lewat</> {$path} (file tidak ditemukan)");
                    $skipped++;

                    continue;
                }

                $webpPath = preg_replace('/\.[^.]+$/', '.webp', $path);

                if ($dryRun) {
                    $this->line("  <fg=blue>rencana</> {$path} → {$webpPath}");
                    $converted++;

                    continue;
                }

                try {
                    $this->convertFile($path, $webpPath, $quality);

                    DB::table($table)
                        ->where('id', $row->id)
                        ->update([$column => $webpPath]);

                    if (! $keepOriginal) {
                        Storage::disk('public')->delete($path);
                    }

                    $this->line("  <fg=green>selesai</> {$path} → {$webpPath}");
                    $converted++;
                } catch (\Throwable $e) {
                    $this->line("  <fg=red>gagal</> {$path} — {$e->getMessage()}");
                    $failed++;
                }
            }
        }

        $this->newLine();
        $this->info("Selesai. Dikonversi: {$converted}, dilewat: {$skipped}, gagal: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Konversi satu file di disk public ke WebP.
     */
    private function convertFile(string $sourcePath, string $targetPath, int $quality): void
    {
        $disk = Storage::disk('public');
        $sourceAbsolute = $disk->path($sourcePath);
        $targetAbsolute = $disk->path($targetPath);

        $info = getimagesize($sourceAbsolute);

        if ($info === false) {
            throw new \RuntimeException('File bukan gambar yang valid');
        }

        $image = match ($info[2]) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($sourceAbsolute),
            IMAGETYPE_PNG => imagecreatefrompng($sourceAbsolute),
            default => throw new \RuntimeException('Tipe gambar tidak didukung'),
        };

        if ($image === false) {
            throw new \RuntimeException('Gagal membaca gambar');
        }

        if ($info[2] === IMAGETYPE_PNG) {
            imagepalettetotruecolor($image);
            imagealphablending($image, true);
            imagesavealpha($image, true);
        }

        $ok = imagewebp($image, $targetAbsolute, $quality);
        imagedestroy($image);

        if (! $ok) {
            throw new \RuntimeException('Gagal menulis file WebP');
        }
    }
}
