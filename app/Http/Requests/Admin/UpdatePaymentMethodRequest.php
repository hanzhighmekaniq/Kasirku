<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route("payment_method")->id;

        return [
            "code" => [
                "required",
                "string",
                "max:50",
                Rule::unique("payment_methods", "code")
                    ->where(
                        fn($q) => $q->where(
                            "store_id",
                            session("current_store_id"),
                        ),
                    )
                    ->ignore($id),
            ],
            "name" => ["required", "string", "max:255"],
            "type" => [
                "required",
                "string",
                Rule::in(["cash", "digital", "card", "credit"]),
            ],
            "provider" => ["nullable", "string", "max:100"],
            "is_active" => ["boolean"],
        ];
    }

    public function messages(): array
    {
        return [
            "code.required" => "Kode wajib diisi.",
            "code.unique" => "Kode ini sudah digunakan.",
            "name.required" => "Nama wajib diisi.",
            "type.required" => "Tipe wajib dipilih.",
            "type.in" => "Tipe tidak valid.",
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            "code" => strtoupper($this->code ?? ""),
            "is_active" => $this->boolean("is_active", true),
        ]);
    }
}
