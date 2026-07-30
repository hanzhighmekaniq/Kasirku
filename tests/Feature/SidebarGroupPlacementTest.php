<?php

/*
|--------------------------------------------------------------------------
| Penempatan item di grup sidebar
|--------------------------------------------------------------------------
|
| Dua pemindahan yang mudah tergeser balik saat navConfig.js diedit:
|   - Log Aktivitas tinggal di grup LAPORAN (dulu di PENGATURAN).
|   - Metode Pembayaran (dulu bernama "Keuangan") tinggal di grup PENGATURAN
|     alias `system` (dulu di LAPORAN).
|
| Grup-grup di navConfig.js dibangun berurutan dalam blok terpisah, jadi
| penempatan bisa diverifikasi dari posisi definisi item relatif terhadap
| `groups.push({ key: ... })` masing-masing grup — tanpa perlu React.
|
*/

/** Isi mentah navConfig.js. */
function navConfigSource(): string
{
    return file_get_contents(resource_path('js/Config/navConfig.js'));
}

/** Posisi karakter dari `groups.push({ key: "<key>" ... })` sebuah grup. */
function groupPushPosition(string $source, string $groupKey): int
{
    $needle = 'groups.push({';
    $offset = 0;

    while (($pos = strpos($source, $needle, $offset)) !== false) {
        $block = substr($source, $pos, 400);

        if (preg_match('/key:\s*"'.preg_quote($groupKey, '/').'"/', $block) === 1) {
            return $pos;
        }

        $offset = $pos + strlen($needle);
    }

    throw new RuntimeException("Grup `{$groupKey}` tidak ditemukan di navConfig.js.");
}

/** Posisi karakter definisi item dengan key tertentu. */
function itemKeyPosition(string $source, string $itemKey): int
{
    $pos = strpos($source, 'key: "'.$itemKey.'"');

    if ($pos === false) {
        throw new RuntimeException("Item `{$itemKey}` tidak ditemukan di navConfig.js.");
    }

    return $pos;
}

/**
 * Item dianggap milik sebuah grup kalau definisinya berada sebelum
 * `groups.push()` grup itu, dan setelah `groups.push()` grup sebelumnya.
 */
function itemBelongsToGroup(string $source, string $itemKey, string $groupKey): bool
{
    $itemPos = itemKeyPosition($source, $itemKey);
    $groupPos = groupPushPosition($source, $groupKey);

    if ($itemPos > $groupPos) {
        return false;
    }

    // Tidak boleh ada groups.push() lain di antara item dan grupnya.
    $between = substr($source, $itemPos, $groupPos - $itemPos);

    return ! str_contains($between, 'groups.push({');
}

test('log aktivitas ada di grup laporan', function () {
    $source = navConfigSource();

    expect(itemBelongsToGroup($source, 'activity-logs', 'finance'))->toBeTrue(
        'Item `activity-logs` harus didefinisikan di blok grup Laporan '
        .'(groups.push key: "finance"), bukan di grup lain.',
    );
});

test('metode pembayaran ada di grup pengaturan', function () {
    $source = navConfigSource();

    expect(itemBelongsToGroup($source, 'payment-methods', 'system'))->toBeTrue(
        'Item `payment-methods` harus didefinisikan di blok grup Pengaturan '
        .'(groups.push key: "system").',
    );
});

test('tidak ada lagi item sidebar bernama Keuangan', function () {
    expect(navConfigSource())->not->toContain('name: "Keuangan"');
});

test('label item mengikuti nama barunya', function () {
    $source = navConfigSource();

    expect($source)->toContain('name: "Metode Pembayaran"');
    expect($source)->toContain('name: "Log Aktivitas"');
});
