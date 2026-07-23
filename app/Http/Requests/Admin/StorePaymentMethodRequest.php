<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:50',
                'uppercase',
                Rule::unique('payment_methods', 'code')->where(
                    fn ($q) => $q->where(
                        'store_id',
                        session('current_store_id'),
                    ),
                ),
            ],
            'name' => ['required', 'string', 'max:255'],
            'type' => [
                'required',
                'string',
                Rule::in(['cash', 'digital', 'card', 'credit']),
            ],
            'provider' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode metode pembayaran wajib diisi.',
            'code.unique' => 'Kode ini sudah digunakan.',
            'code.uppercase' => 'Kode harus huruf kapital.',
            'name.required' => 'Nama metode pembayaran wajib diisi.',
            'type.required' => 'Tipe wajib dipilih.',
            'type.in' => 'Tipe tidak valid.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => strtoupper($this->code ?? ''),
            'is_active' => $this->boolean('is_active', true),
        ]);
    }
}
