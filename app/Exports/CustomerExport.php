<?php

namespace App\Exports;

use App\Models\Customer;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CustomerExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected int $storeId;

    protected bool $includeExamples;

    protected int $row = 0;

    public function __construct(int $storeId, bool $includeExamples = true)
    {
        $this->storeId = $storeId;
        $this->includeExamples = $includeExamples;
    }

    public function headings(): array
    {
        return [
            'Kode*',
            'Nama*',
            'Telepon',
            'Email',
            'Alamat',
            'Tanggal Lahir',
            'Gender (L/P)',
            'Limit Kredit',
            'Catatan',
            'Status (aktif/nonaktif)',
        ];
    }

    public function map($customer): array
    {
        $this->row++;

        return [
            $customer->code,
            $customer->name,
            $customer->phone ?? '',
            $customer->email ?? '',
            $customer->address ?? '',
            $customer->birth_date?->format('Y-m-d') ?? '',
            $customer->gender === 'male' ? 'L' : ($customer->gender === 'female' ? 'P' : ''),
            $customer->credit_limit,
            $customer->notes ?? '',
            $customer->is_active ? 'aktif' : 'nonaktif',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getColumnDimension('A')->setWidth(15);
        $sheet->getColumnDimension('B')->setWidth(25);
        $sheet->getColumnDimension('C')->setWidth(18);
        $sheet->getColumnDimension('D')->setWidth(25);
        $sheet->getColumnDimension('E')->setWidth(30);
        $sheet->getColumnDimension('F')->setWidth(15);
        $sheet->getColumnDimension('G')->setWidth(10);
        $sheet->getColumnDimension('H')->setWidth(15);
        $sheet->getColumnDimension('I')->setWidth(25);
        $sheet->getColumnDimension('J')->setWidth(15);

        return [
            1 => ['font' => ['bold' => true, 'size' => 12]],
        ];
    }

    public function collection(): Collection
    {
        $customers = Customer::where('store_id', $this->storeId)
            ->orderBy('name')
            ->get();

        if ($this->includeExamples) {
            $examples = collect([
                (object) [
                    'code' => 'CONTOH-001',
                    'name' => '[CONTOH] Budi Santoso',
                    'phone' => '081234567890',
                    'email' => 'budi@example.com',
                    'address' => 'Jl. Sudirman No. 1, Jakarta',
                    'birth_date' => null,
                    'gender' => 'male',
                    'credit_limit' => 500000,
                    'notes' => 'Pelanggan tetap',
                    'is_active' => true,
                ],
                (object) [
                    'code' => 'CONTOH-002',
                    'name' => '[CONTOH] Hapus baris ini sebelum import',
                    'phone' => '',
                    'email' => '',
                    'address' => '',
                    'birth_date' => null,
                    'gender' => null,
                    'credit_limit' => 0,
                    'notes' => '',
                    'is_active' => true,
                ],
            ]);

            return $examples->merge($customers);
        }

        return $customers;
    }
}
