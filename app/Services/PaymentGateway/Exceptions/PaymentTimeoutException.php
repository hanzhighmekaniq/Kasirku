<?php

namespace App\Services\PaymentGateway\Exceptions;

/**
 * Thrown when the request to the payment gateway timed out or the
 * connection failed before any HTTP response was received. Just like a
 * 5xx response, the outcome is ambiguous — the charge may have gone
 * through on the provider's side. Must be reconciled via the Status API
 * before deciding whether to retry.
 */
class PaymentTimeoutException extends \RuntimeException
{
    public function __construct(string $message = 'Payment gateway request timed out.')
    {
        parent::__construct($message);
    }
}
