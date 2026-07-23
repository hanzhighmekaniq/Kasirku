<?php

namespace App\Services\PaymentGateway\Exceptions;

/**
 * Thrown when the payment gateway itself fails with an internal error
 * (HTTP 5xx). Per Midtrans docs, this is temporary and the caller should
 * NOT assume the transaction failed — the charge may have actually been
 * created on the provider's side. The transaction must be reconciled via
 * the Status API before deciding whether to retry.
 */
class PaymentServerException extends \RuntimeException
{
    public function __construct(
        public readonly int $httpStatus,
        public readonly ?array $responseBody = null,
        string $message = '',
    ) {
        parent::__construct($message !== '' ? $message : "Payment gateway internal error (HTTP {$httpStatus}).");
    }
}
