<?php

namespace App\Imports;

use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Validators\Failure;
use Throwable;

class CustomerImport implements SkipsOnError, SkipsOnFailure, ToCollection, WithHeadingRow
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
            $rowNum = $i + 2;

            $name = trim($row['nama'] ?? '');
            if (empty($name) || str_starts_with($name, '[CONTOH]')) {
                $this->skipped++;

                continue;
            }

            $code = trim($row['kode'] ?? '');
            if (empty($code)) {
                $this->errors[] = "Baris {$rowNum}: Kode wajib diisi.";

                continue;
            }

            $phone = trim($row['telepon'] ?? '');
            $email = trim($row['email'] ?? '');
            $address = trim($row['alamat'] ?? '');
            $notes = trim($row['catatan'] ?? '');

            $birthDate = null;
            if (! empty($row['tanggal_lahir'])) {
                $birthDate = Carbon::parse($row['tanggal_lahir'])->format('Y-m-d');
            }

            $gender = null;
            $genderRaw = strtolower(trim($row['gender_l_p'] ?? ''));
            if ($genderRaw === 'l') {
                $gender = 'male';
            } elseif ($genderRaw === 'p') {
                $gender = 'female';
            }

            $creditLimit = (float) ($row['limit_kredit'] ?? 0);

            $status = strtolower(trim($row['status_aktif_nonaktif'] ?? 'aktif'));
            $isActive = $status !== 'nonaktif';

            $data = [
                'name' => $name,
                'phone' => $phone ?: null,
                'email' => $email ?: null,
                'address' => $address ?: null,
                'birth_date' => $birthDate,
                'gender' => $gender,
                'credit_limit' => $creditLimit,
                'notes' => $notes ?: null,
                'is_active' => $isActive,
            ];

            $existing = Customer::where('store_id', $this->storeId)
                ->where('code', $code)
                ->first();

            if ($existing) {
                $existing->update($data);
                $this->updated++;
            } else {
                $data['store_id'] = $this->storeId;
                $data['code'] = $code;
                Customer::create($data);
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
}
