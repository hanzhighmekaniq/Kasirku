<?php

namespace App\Helpers;

class BarcodeHelper
{
    /**
     * Generate a simple EAN-13 compatible barcode number
     * Format: 2 (in-house prefix) + 12 digits = 13 digits total
     *
     * @return string 13-digit barcode number
     */
    public static function generate(): string
    {
        // Starting with '2' indicates in-house/private use (EAN-13 standard)
        // Generate remaining 12 digits randomly
        $randomPart = str_pad(mt_rand(0, 999999999999), 12, '0', STR_PAD_LEFT);

        return '2' . $randomPart;
    }

    /**
     * Generate barcode for product variant
     * Format: 2 (prefix) + product_id (6 digits) + variant_sequence (4 digits) + random (1 digit)
     *
     * @param int $productId
     * @return string 13-digit barcode number
     */
    public static function generateForVariant(int $productId): string
    {
        // Product ID: 6 digits (supports up to 999,999 products)
        $productPart = str_pad($productId, 6, '0', STR_PAD_LEFT);

        // Variant sequence: 4 digits (supports up to 9,999 variants per product)
        $variantPart = str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);

        // Random digit to ensure uniqueness
        $randomDigit = mt_rand(0, 9);

        return '2' . $productPart . $variantPart . $randomDigit;
    }

    /**
     * Calculate EAN-13 checksum digit (optional, for validation)
     *
     * @param string $barcode 12-digit barcode (without checksum)
     * @return string 13-digit barcode with checksum
     */
    public static function withChecksum(string $barcode): string
    {
        if (strlen($barcode) === 13) {
            return $barcode; // Already has checksum
        }

        if (strlen($barcode) !== 12) {
            // Pad to 12 digits if shorter
            $barcode = str_pad($barcode, 12, '0', STR_PAD_LEFT);
        }

        $digits = str_split($barcode);
        $sum = 0;

        // EAN-13 checksum algorithm: multiply odd positions by 1, even by 3
        for ($i = 0; $i < 12; $i++) {
            $digit = (int) $digits[$i];
            $sum += ($i % 2 === 0) ? $digit * 1 : $digit * 3;
        }

        $checksum = (10 - ($sum % 10)) % 10;

        return $barcode . $checksum;
    }
}
