<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class PlatformPaymentGateway extends Model
{
    protected $fillable = [
        'provider', 'is_active', 'environment',
        'server_key', 'client_key', 'merchant_id',
        'enabled_methods', 'config_json',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'enabled_methods' => 'array',
        'config_json' => 'array',
    ];

    /** Keys yang dienkripsi sebelum disimpan */
    protected $hidden = ['server_key', 'client_key'];

    // ── Encrypt / Decrypt helpers ─────────────────

    public function setServerKeyAttribute(?string $value): void
    {
        $this->attributes['server_key'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getServerKeyAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    public function setClientKeyAttribute(?string $value): void
    {
        $this->attributes['client_key'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getClientKeyAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    // ── Helpers ───────────────────────────────────

    /**
     * @return array<string, array{label: string, methods: string[], fields: string[]}>
     */
    public static function availableProviders(): array
    {
        return [
            'midtrans' => [
                'label' => 'Midtrans',
                'methods' => ['qris', 'gopay', 'shopeepay', 'dana', 'ovo', 'bca_va', 'mandiri_va', 'bri_va', 'bni_va', 'permata_va'],
                'fields' => ['server_key', 'client_key', 'merchant_id'],
            ],
            'xendit' => [
                'label' => 'Xendit',
                'methods' => ['qris', 'bca_va', 'mandiri_va', 'bri_va', 'bni_va', 'gopay', 'ovo', 'dana'],
                'fields' => ['server_key'],
            ],
            'doku' => [
                'label' => 'DOKU',
                'methods' => ['qris', 'bca_va', 'mandiri_va', 'bri_va', 'bni_va', 'permata_va'],
                'fields' => ['client_key', 'server_key'],
            ],
            'duitku' => [
                'label' => 'Duitku',
                'methods' => ['qris', 'bca_va', 'mandiri_va', 'bri_va', 'bni_va', 'gopay', 'ovo', 'shopeepay'],
                'fields' => ['server_key', 'merchant_id'],
            ],
        ];
    }
}
