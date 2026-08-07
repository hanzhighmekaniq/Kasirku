<?php

namespace App\Exports\Reports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Collection $data;

    protected array $columns;

    protected string $title;

    protected int $row = 0;

    /**
     * @param  array<int, array{key: string, label: string, format?: string}>  $columns
     */
    public function __construct(Collection $data, array $columns, string $title = 'Laporan')
    {
        $this->data = $data;
        $this->columns = $columns;
        $this->title = $title;
    }

    public function headings(): array
    {
        return array_map(fn ($col) => $col['label'], $this->columns);
    }

    public function map($row): array
    {
        $this->row++;

        return array_map(function ($col) use ($row) {
            $value = data_get($row, $col['key']);

            return match ($col['format'] ?? null) {
                'currency' => (float) $value,
                'integer' => (int) $value,
                'date' => $value ? Carbon::parse($value)->format('d/m/Y') : '',
                'datetime' => $value ? Carbon::parse($value)->format('d/m/Y H:i') : '',
                'boolean' => $value ? 'Ya' : 'Tidak',
                default => $value ?? '',
            };
        }, $this->columns);
    }

    public function styles(Worksheet $sheet): array
    {
        $colCount = count($this->columns);
        $lastCol = Coordinate::stringFromColumnIndex($colCount);

        $widths = array_map(fn ($col) => max(strlen($col['label']) + 4, 14), $this->columns);
        foreach ($this->columns as $i => $col) {
            $letter = Coordinate::stringFromColumnIndex($i + 1);
            $sheet->getColumnDimension($letter)->setWidth($widths[$i]);
        }

        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12],
            ],
        ];
    }

    public function title(): string
    {
        return $this->title;
    }

    public function collection(): Collection
    {
        return $this->data;
    }
}
