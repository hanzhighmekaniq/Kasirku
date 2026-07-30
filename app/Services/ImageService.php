<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    /**
     * Convert uploaded image to WebP and store it.
     *
     * @param  string  $folder  Folder di dalam disk public (misal: 'products', 'stores')
     * @param  int  $quality  Kualitas WebP 0–100
     * @return string Path relatif dari disk public (misal: products/abc123.webp)
     */
    public function upload(UploadedFile $file, string $folder, int $quality = 80): string
    {
        $image = $this->createGdImage($file);

        $filename = Str::uuid().'.webp';
        $relativePath = $folder.'/'.$filename;
        $absolutePath = Storage::disk('public')->path($relativePath);

        Storage::disk('public')->makeDirectory($folder);

        imagewebp($image, $absolutePath, $quality);
        imagedestroy($image);

        return $relativePath;
    }

    /**
     * Hapus file dari disk public jika path tidak null.
     */
    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Buat GD image resource dari UploadedFile.
     * Mendukung jpg/jpeg, png, dan webp.
     */
    private function createGdImage(UploadedFile $file): \GdImage
    {
        $mime = $file->getMimeType();
        $path = $file->getRealPath();

        $image = match (true) {
            in_array($mime, ['image/jpeg', 'image/jpg'], true) => imagecreatefromjpeg($path),
            $mime === 'image/png' => imagecreatefrompng($path),
            $mime === 'image/webp' => imagecreatefromwebp($path),
            default => throw new \InvalidArgumentException("Format gambar tidak didukung: {$mime}"),
        };

        if ($image === false) {
            throw new \RuntimeException("Gagal membaca file gambar: {$file->getClientOriginalName()}");
        }

        // Preserve alpha channel untuk PNG
        if ($mime === 'image/png') {
            imagepalettetotruecolor($image);
            imagealphablending($image, true);
            imagesavealpha($image, true);
        }

        return $image;
    }
}
