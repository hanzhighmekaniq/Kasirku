<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductsExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected int $storeId;

    protected bool $includeExamples;

    protected ?string $branchCode;

    protected int $row = 0;

    public function __construct(int $storeId, bool $includeExamples = true, ?string $branchCode = null)
    {
        $this->storeId = $storeId;
        $this->includeExamples = $includeExamples;
        $this->branchCode = $branchCode;
    }

    public function headings(): array
    {
        return [
            'SKU*',
            'Nama Produk*',
            'Kategori',
            'Harga Beli',
            'Harga Jual*',
            'Stok Minimum',
            'Barcode',
            'Status (aktif/nonaktif)',
        ];
    }

    public function map($product): array
    {
        $this->row++;

        return [
            $product->sku,
            $product->name,
            $product->category?->name ?? '',
            $product->average_cost,
            $product->sell_price,
            $product->stock_minimum,
            $product->barcode ?? '',
            $product->is_active ? 'aktif' : 'nonaktif',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getColumnDimension('A')->setWidth(15);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(15);
        $sheet->getColumnDimension('E')->setWidth(15);
        $sheet->getColumnDimension('F')->setWidth(15);
        $sheet->getColumnDimension('G')->setWidth(20);
        $sheet->getColumnDimension('H')->setWidth(18);

        return [
            1 => ['font' => ['bold' => true, 'size' => 12]],
        ];
    }

    public function collection(): Collection
    {
        $products = Product::where('store_id', $this->storeId)
            ->with('category:id,name')
            ->orderBy('name')
            ->get();

        if ($this->includeExamples) {
            $examples = collect([
                (object) [
                    'sku' => 'CONTOH-001',
                    'name' => '[CONTOH] Produk Sample',
                    'category' => (object) ['name' => 'Kategori Sample'],
                    'average_cost' => 10000,
                    'sell_price' => 15000,
                    'stock_minimum' => 5,
                    'barcode' => '8991234567890',
                    'is_active' => true,
                ],
                (object) [
                    'sku' => 'CONTOH-002',
                    'name' => '[CONTOH] Hapus baris ini sebelum import',
                    'category' => (object) ['name' => 'Makanan'],
                    'average_cost' => 5000,
                    'sell_price' => 8000,
                    'stock_minimum' => 10,
                    'barcode' => '',
                    'is_active' => true,
                ],
            ]);

            return $examples->merge($products);
        }

        return $products;
    }
}
