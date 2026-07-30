<?php

use App\Services\ImageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

/**
 * Buat file gambar asli (bukan UploadedFile::fake()->image() yang tanpa GD
 * bisa menghasilkan file kosong) lalu bungkus jadi UploadedFile.
 */
function makeUploadedImage(string $type, string $name): UploadedFile
{
    $image = imagecreatetruecolor(40, 30);
    imagefill($image, 0, 0, imagecolorallocate($image, 10, 120, 200));

    $tmp = tempnam(sys_get_temp_dir(), 'img').'.'.$type;

    match ($type) {
        'jpg' => imagejpeg($image, $tmp),
        'png' => imagepng($image, $tmp),
    };
    imagedestroy($image);

    $mime = $type === 'jpg' ? 'image/jpeg' : 'image/png';

    return new UploadedFile($tmp, $name, $mime, null, true);
}

test('upload jpg disimpan sebagai webp', function () {
    $path = app(ImageService::class)->upload(makeUploadedImage('jpg', 'foto.jpg'), 'products');

    expect($path)->toEndWith('.webp');
    expect($path)->toStartWith('products/');
    Storage::disk('public')->assertExists($path);

    $bytes = Storage::disk('public')->get($path);
    expect(substr($bytes, 0, 4))->toBe('RIFF');
    expect(substr($bytes, 8, 4))->toBe('WEBP');
});

test('upload png disimpan sebagai webp', function () {
    $path = app(ImageService::class)->upload(makeUploadedImage('png', 'logo.png'), 'stores');

    expect($path)->toEndWith('.webp');
    expect($path)->toStartWith('stores/');
    Storage::disk('public')->assertExists($path);
});

test('tidak ada file selain webp yang tersimpan di storage', function () {
    $service = app(ImageService::class);
    $service->upload(makeUploadedImage('jpg', 'a.jpg'), 'products');
    $service->upload(makeUploadedImage('png', 'b.png'), 'products');

    $files = Storage::disk('public')->allFiles();

    expect($files)->toHaveCount(2);
    foreach ($files as $file) {
        expect(pathinfo($file, PATHINFO_EXTENSION))->toBe('webp');
    }
});

test('nama file di-randomize sehingga upload berulang tidak saling menimpa', function () {
    $service = app(ImageService::class);
    $first = $service->upload(makeUploadedImage('jpg', 'sama.jpg'), 'products');
    $second = $service->upload(makeUploadedImage('jpg', 'sama.jpg'), 'products');

    expect($first)->not->toBe($second);
    Storage::disk('public')->assertExists($first);
    Storage::disk('public')->assertExists($second);
});

test('format tidak didukung ditolak', function () {
    $file = UploadedFile::fake()->create('dokumen.pdf', 10, 'application/pdf');

    app(ImageService::class)->upload($file, 'products');
})->throws(InvalidArgumentException::class);

test('delete menghapus file dan aman untuk path null', function () {
    $service = app(ImageService::class);
    $path = $service->upload(makeUploadedImage('png', 'x.png'), 'products');

    $service->delete($path);
    Storage::disk('public')->assertMissing($path);

    $service->delete(null);
    expect(Storage::disk('public')->allFiles())->toBeEmpty();
});
