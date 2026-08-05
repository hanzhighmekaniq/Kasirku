<?php

namespace App\Imports;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Validators\Failure;
use Throwable;

class ProductsImport implements SkipsOnError, SkipsOnFailure, ToCollection, WithHeadingRow
{
    protected int $storeId;

    protected array $errors = [];

    protected int $created = 0;

    protected int $updated = 0;

    protected int $skipped = 0;

    public function __construct(int $storeId)
    {
        $this->storeId = $storeId;
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $i => $row) {
            $rowNum = $i + 2; // +2 because row 1 is heading, arrays are 0-indexed

            // Sanitize CSV injection characters
            $row = $this->sanitizeRow($row);

            // Skip example rows
            $name = trim($row['nama_produk'] ?? '');
            if (empty($name) || str_starts_with($name, '[CONTOH]')) {
                $this->skipped++;

                continue;
            }

            $sku = trim($row['sku'] ?? '');
            if (empty($sku)) {
                $this->errors[] = "Baris {$rowNum}: SKU wajib diisi.";

                continue;
            }

            $sellPrice = (float) ($row['harga_jual'] ?? 0);
            if ($sellPrice <= 0) {
                $this->errors[] = "Baris {$rowNum}: Harga jual harus lebih dari 0.";

                continue;
            }

            // Find or create category
            $categoryId = null;
            $categoryName = trim($row['kategori'] ?? '');
            if ($categoryName) {
                $category = Category::firstOrCreate(
                    ['store_id' => $this->storeId, 'name' => $categoryName],
                    ['code' => strtoupper(substr($categoryName, 0, 10))],
                );
                $categoryId = $category->id;
            }

            $status = strtolower(trim($row['status_aktif_nonaktif'] ?? 'aktif'));
            $isActive = $status !== 'nonaktif';

            $data = [
                'name' => $name,
                'category_id' => $categoryId,
                'average_cost' => (float) ($row['harga_beli'] ?? 0),
                'sell_price' => $sellPrice,
                'stock_minimum' => (int) ($row['stok_minimum'] ?? 0),
                'barcode' => trim($row['barcode'] ?? '') ?: null,
                'is_active' => $isActive,
            ];

            $existing = Product::where('store_id', $this->storeId)
                ->where('sku', $sku)
                ->first();

            if ($existing) {
                $existing->update($data);
                $this->updated++;
            } else {
                $data['store_id'] = $this->storeId;
                $data['sku'] = $sku;
                $data['track_stock'] = true;
                Product::create($data);
                $this->created++;
            }
        }
    }

    public function onError(Throwable $e): void
    {
        $this->errors[] = 'Error: '.$e->getMessage();
    }

    public function onFailure(Failure ...$failures): void
    {
        foreach ($failures as $failure) {
            $this->errors[] = 'Baris '.$failure->row().': '.implode(', ', $failure->errors());
        }
    }

    public function getResults(): array
    {
        return [
            'created' => $this->created,
            'updated' => $this->updated,
            'skipped' => $this->skipped,
            'errors' => $this->errors,
        ];
    }

    /**
     * Sanitize baris dari CSV injection characters.
     * Prefix cell yang dimulai dengan =, +, -, @, \t, \r dengan single quote.
     */
    private function sanitizeRow(array $row): array
    {
        $dangerous = ['=', '+', '-', '@', "\t", "\r"];

        foreach ($row as $key => $value) {
            if (is_string($value)) {
                $trimmed = ltrim($value);
                if ($trimmed !== '' && in_array($trimmed[0], $dangerous, true)) {
                    $row[$key] = "'".$value;
                }
            }
        }

        return $row;
    }
}
