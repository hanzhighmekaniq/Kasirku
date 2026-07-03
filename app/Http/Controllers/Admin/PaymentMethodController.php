<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePaymentMethodRequest;
use App\Http\Requests\Admin\UpdatePaymentMethodRequest;
use App\Models\PaymentMethod;
use App\Models\StorePaymentGateway;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    /** Ambil store_id dari session. */
    private function getStoreId(): int
    {
        return session("current_store_id") ?? \App\Models\Store::first()->id;
    }

    public function index()
    {
        $storeId = $this->getStoreId();

        $paymentMethods = PaymentMethod::forStore($storeId)
            ->withCount(["salePayments", "purchasePayments"])
            ->orderBy("type")
            ->orderBy("name")
            ->get();

        // PG configs for this store
        $pgRaw = StorePaymentGateway::where("store_id", $storeId)->get();
        $pgConfigs = [];
        foreach ($pgRaw as $c) {
            $pgConfigs[$c->provider] = [
                "id" => $c->id,
                "provider" => $c->provider,
                "is_active" => $c->is_active,
                "environment" => $c->environment,
                "merchant_id" => $c->merchant_id,
                "enabled_methods" => $c->enabled_methods ?? [],
                "has_server_key" => !empty($c->server_key),
                "has_client_key" => !empty($c->client_key),
            ];
        }

        return Inertia::render("Admin/PaymentMethods/Index", [
            "paymentMethods" => $paymentMethods,
            "types" => PaymentMethod::types(),
            "pgConfigs" => $pgConfigs,
            "pgProviders" => array_keys(
                StorePaymentGateway::availableProviders(),
            ),
        ]);
    }

    public function create()
    {
        return Inertia::render("Admin/PaymentMethods/Create", [
            "types" => PaymentMethod::types(),
        ]);
    }

    public function store(StorePaymentMethodRequest $request)
    {
        $data = $request->validated();
        $data["store_id"] = session("current_store_id");
        PaymentMethod::create($data);

        return redirect()
            ->route("admin.payment-methods.index")
            ->with("success", "Metode pembayaran berhasil ditambahkan.");
    }

    public function edit(PaymentMethod $paymentMethod)
    {
        return Inertia::render("Admin/PaymentMethods/Edit", [
            "paymentMethod" => $paymentMethod,
            "types" => PaymentMethod::types(),
        ]);
    }

    public function update(
        UpdatePaymentMethodRequest $request,
        PaymentMethod $paymentMethod,
    ) {
        $paymentMethod->update($request->validated());

        return redirect()
            ->route("admin.payment-methods.index")
            ->with("success", "Metode pembayaran berhasil diperbarui.");
    }

    public function destroy(PaymentMethod $paymentMethod)
    {
        // Cegah hapus jika sudah dipakai di transaksi
        $usedInSales = $paymentMethod->salePayments()->exists();
        $usedInPurchases = $paymentMethod->purchasePayments()->exists();

        if ($usedInSales || $usedInPurchases) {
            return back()->with(
                "error",
                "Metode pembayaran ini tidak bisa dihapus karena sudah digunakan dalam transaksi. Nonaktifkan saja.",
            );
        }

        $paymentMethod->delete();

        return redirect()
            ->route("admin.payment-methods.index")
            ->with("success", "Metode pembayaran berhasil dihapus.");
    }

    /**
     * Toggle active status (PATCH) — used from index table toggle.
     */
    public function toggleActive(PaymentMethod $paymentMethod)
    {
        $paymentMethod->update(["is_active" => !$paymentMethod->is_active]);

        return back()->with(
            "success",
            $paymentMethod->is_active
                ? "{$paymentMethod->name} diaktifkan."
                : "{$paymentMethod->name} dinonaktifkan.",
        );
    }

    /**
     * Save payment gateway config for a provider.
     */
    public function savePgSettings(Request $request, string $provider)
    {
        $storeId = $this->getStoreId();

        $validated = $request->validate([
            "is_active" => "boolean",
            "environment" => "required|in:sandbox,production",
            "server_key" => "nullable|string|max:500",
            "client_key" => "nullable|string|max:500",
            "merchant_id" => "nullable|string|max:100",
            "enabled_methods" => "nullable|array",
            "enabled_methods.*" => "string",
        ]);

        $config = StorePaymentGateway::firstOrNew([
            "store_id" => $storeId,
            "provider" => $provider,
        ]);

        $config->is_active = $validated["is_active"] ?? false;
        $config->environment = $validated["environment"];
        $config->merchant_id = $validated["merchant_id"] ?? null;
        $config->enabled_methods = $validated["enabled_methods"] ?? [];

        // Hanya update key jika dikirim (bukan placeholder)
        if (
            !empty($validated["server_key"]) &&
            $validated["server_key"] !== "••••••••"
        ) {
            $config->server_key = $validated["server_key"];
        }
        if (
            !empty($validated["client_key"]) &&
            $validated["client_key"] !== "••••••••"
        ) {
            $config->client_key = $validated["client_key"];
        }

        $config->save();
        PaymentGatewayFactory::flushCache($storeId, $provider);

        return back()->with(
            "success",
            "Konfigurasi {$provider} berhasil disimpan.",
        );
    }

    /** Update sort_order via AJAX dari index table. */
    public function updateSort(Request $request, PaymentMethod $paymentMethod)
    {
        $validated = $request->validate([
            "sort_order" => "required|integer|min:0",
        ]);

        $paymentMethod->update(["sort_order" => $validated["sort_order"]]);

        return response()->json(["success" => true]);
    }
}
