<?php

namespace App\Services\PaymentGateway\Exceptions;

/**
 * Thrown when the payment gateway rejects a request due to a client-side
 * problem (bad params, invalid auth, business rule violation — HTTP 4xx).
 * These are definitive failures — retrying with the same payload will not
 * help, so the transaction should be marked `failed` immediately.
 */
class PaymentClientException extends \RuntimeException
{
    public function __construct(
        public readonly int $httpStatus,
        public readonly ?array $responseBody = null,
        string $message = '',
    ) {
        parent::__construct($message !== '' ? $message : "Payment gateway rejected the request (HTTP {$httpStatus}).");
    }
}
