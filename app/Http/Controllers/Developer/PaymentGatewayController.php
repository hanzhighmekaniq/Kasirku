<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\PlatformPaymentGateway;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class PaymentGatewayController extends Controller
{
    /**
     * Payment gateway platform — satu akun per provider, dipakai oleh
     * seluruh store. Semua pembayaran PG masuk ke rekening developer,
     * lalu di-credit ke wallet store masing-masing.
     */
    public function index()
    {
        $configured = PlatformPaymentGateway::all()->keyBy('provider');

        $providers = collect(PlatformPaymentGateway::availableProviders())
            ->map(function ($meta, $key) use ($configured) {
                $c = $configured->get($key);

                return [
                    'provider' => $key,
                    'label' => $meta['label'],
                    'methods' => $meta['methods'],
                    'fields' => $meta['fields'],
                    'configured' => (bool) $c,
                    'id' => $c?->id,
                    'is_active' => $c?->is_active ?? false,
                    'environment' => $c?->environment ?? 'sandbox',
                    'merchant_id' => $c?->merchant_id,
                    'enabled_methods' => $c?->enabled_methods ?? [],
                    'has_server_key' => ! empty($c?->server_key),
                    'has_client_key' => ! empty($c?->client_key),
                ];
            })
            ->values();

        return Inertia::render('Developer/PaymentGateway/Index', [
            'providers' => $providers,
            'planOrderMode' => PlatformPaymentGateway::getPlanOrderMode(),
            'payoutMode' => PlatformPaymentGateway::getPayoutMode(),
        ]);
    }

    /**
     * Create or update a provider's platform config (upsert by provider).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:'.implode(',', PaymentGatewayFactory::availableProviders()),
            'is_active' => 'boolean',
            'environment' => 'required|in:sandbox,production',
            'server_key' => 'nullable|string|max:500',
            'client_key' => 'nullable|string|max:500',
            'merchant_id' => 'nullable|string|max:100',
            'enabled_methods' => 'nullable|array',
            'enabled_methods.*' => 'string',
        ]);

        $config = PlatformPaymentGateway::firstOrNew([
            'provider' => $validated['provider'],
        ]);

        $config->is_active = $validated['is_active'] ?? false;
        $config->environment = $validated['environment'];
        $config->merchant_id = $validated['merchant_id'] ?? null;
        $config->enabled_methods = $validated['enabled_methods'] ?? [];

        // Hanya update key jika dikirim (bukan placeholder)
        if (! empty($validated['server_key']) && $validated['server_key'] !== '••••••••') {
            $config->server_key = $validated['server_key'];
        }
        if (! empty($validated['client_key']) && $validated['client_key'] !== '••••••••') {
            $config->client_key = $validated['client_key'];
        }

        $config->save();

        PaymentGatewayFactory::flushCache($validated['provider']);

        return redirect()
            ->route('developer.payment-gateway.index')
            ->with('success', "Konfigurasi {$validated['provider']} berhasil disimpan.");
    }

    public function update(Request $request, PlatformPaymentGateway $paymentGateway)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'environment' => 'required|in:sandbox,production',
            'server_key' => 'nullable|string|max:500',
            'client_key' => 'nullable|string|max:500',
            'merchant_id' => 'nullable|string|max:100',
            'enabled_methods' => 'nullable|array',
            'enabled_methods.*' => 'string',
        ]);

        $paymentGateway->is_active = $validated['is_active'] ?? false;
        $paymentGateway->environment = $validated['environment'];
        $paymentGateway->merchant_id = $validated['merchant_id'] ?? null;
        $paymentGateway->enabled_methods = $validated['enabled_methods'] ?? [];

        if (! empty($validated['server_key']) && $validated['server_key'] !== '••••••••') {
            $paymentGateway->server_key = $validated['server_key'];
        }
        if (! empty($validated['client_key']) && $validated['client_key'] !== '••••••••') {
            $paymentGateway->client_key = $validated['client_key'];
        }

        $paymentGateway->save();

        PaymentGatewayFactory::flushCache($paymentGateway->provider);

        return redirect()
            ->route('developer.payment-gateway.index')
            ->with('success', "Konfigurasi {$paymentGateway->provider} berhasil diperbarui.");
    }

    public function destroy(PlatformPaymentGateway $paymentGateway)
    {
        $provider = $paymentGateway->provider;
        $paymentGateway->delete();

        PaymentGatewayFactory::flushCache($provider);

        return redirect()
            ->route('developer.payment-gateway.index')
            ->with('success', "Konfigurasi {$provider} berhasil dihapus.");
    }

    public function toggle(PlatformPaymentGateway $paymentGateway)
    {
        $paymentGateway->update(['is_active' => ! $paymentGateway->is_active]);

        PaymentGatewayFactory::flushCache($paymentGateway->provider);

        return back()->with('success', "Status {$paymentGateway->provider} diubah.");
    }

    public function toggleEnv(PlatformPaymentGateway $paymentGateway)
    {
        $newEnv = $paymentGateway->environment === 'production' ? 'sandbox' : 'production';
        $paymentGateway->update(['environment' => $newEnv]);

        PaymentGatewayFactory::flushCache($paymentGateway->provider);

        return back()->with('success', "{$paymentGateway->provider} beralih ke ".($newEnv === 'production' ? 'Production' : 'Sandbox').'.');
    }

    /**
     * Toggle mode pembayaran plan order (manual vs auto/PG).
     *
     * Setting global ini menentukan apakah user yang upgrade plan
     * diarahkan ke Payment Gateway atau ditampilkan instruksi
     * transfer manual.
     */
    public function togglePlanOrderMode()
    {
        $current = PlatformPaymentGateway::getPlanOrderMode();
        $newMode = $current === 'auto' ? 'manual' : 'auto';

        // Simpan ke baris pertama yang ada, atau buat baru jika belum ada
        $gateway = PlatformPaymentGateway::first();
        if ($gateway) {
            $gateway->update(['plan_order_mode' => $newMode]);
            // Flush cache gateway config
            Cache::forget("platform_pg_config:{$gateway->provider}");
        } else {
            PlatformPaymentGateway::create([
                'provider' => 'midtrans',
                'plan_order_mode' => $newMode,
            ]);
        }

        $label = $newMode === 'manual' ? 'Manual (Transfer Bank)' : 'Otomatis (Payment Gateway)';

        return back()->with('success', "Mode pembayaran plan order diubah ke {$label}.");
    }

    public function togglePayoutMode()
    {
        $current = PlatformPaymentGateway::getPayoutMode();
        $newMode = $current === 'manual' ? 'auto' : 'manual';

        $gateway = PlatformPaymentGateway::first();
        if ($gateway) {
            $gateway->update(['payout_mode' => $newMode]);
            Cache::forget("platform_pg_config:{$gateway->provider}");
        } else {
            PlatformPaymentGateway::create([
                'provider' => 'midtrans',
                'payout_mode' => $newMode,
            ]);
        }

        $label = $newMode === 'manual' ? 'Manual (Transfer Sendiri)' : 'Otomatis (Auto Payout)';

        return back()->with('success', "Mode payout diubah ke {$label}.");
    }
}
