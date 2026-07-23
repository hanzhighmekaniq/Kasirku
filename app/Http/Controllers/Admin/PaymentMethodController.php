<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePaymentMethodRequest;
use App\Http\Requests\Admin\UpdatePaymentMethodRequest;
use App\Models\PaymentMethod;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    /** Ambil store_id dari session. */
    private function getStoreId(): int
    {
        return session('current_store_id') ?? Store::first()->id;
    }

    public function index()
    {
        $storeId = $this->getStoreId();

        $paymentMethods = PaymentMethod::forStore($storeId)
            ->withCount(['salePayments', 'purchasePayments'])
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        // Payment gateway kini dikelola platform-level oleh developer —
        // store tidak lagi setup credentials PG sendiri di sini.
        return Inertia::render('Admin/PaymentMethods/Index', [
            'paymentMethods' => $paymentMethods,
            'types' => PaymentMethod::types(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/PaymentMethods/Create', [
            'types' => PaymentMethod::types(),
        ]);
    }

    public function store(StorePaymentMethodRequest $request)
    {
        $data = $request->validated();
        $data['store_id'] = session('current_store_id');

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store(
                'payment-methods',
                'public',
            );
        }

        PaymentMethod::create($data);

        return redirect()
            ->route('admin.payment-methods.index')
            ->with('success', 'Metode pembayaran berhasil ditambahkan.');
    }

    public function edit(PaymentMethod $paymentMethod)
    {
        return Inertia::render('Admin/PaymentMethods/Edit', [
            'paymentMethod' => $paymentMethod,
            'types' => PaymentMethod::types(),
        ]);
    }

    public function update(
        UpdatePaymentMethodRequest $request,
        PaymentMethod $paymentMethod,
    ) {
        $data = $request->validated();

        // Tunai & Hutang wajib — tipe tidak bisa diubah
        $lockedTypes = ['cash', 'debt'];
        if (in_array($paymentMethod->type, $lockedTypes, true)
            && isset($data['type'])
            && $data['type'] !== $paymentMethod->type
        ) {
            $data['type'] = $paymentMethod->type;
        }

        if ($request->boolean('remove_image')) {
            if ($paymentMethod->image) {
                Storage::disk('public')->delete($paymentMethod->image);
            }
            $data['image'] = null;
        } elseif ($request->hasFile('image')) {
            if ($paymentMethod->image) {
                Storage::disk('public')->delete($paymentMethod->image);
            }
            $data['image'] = $request->file('image')->store(
                'payment-methods',
                'public',
            );
        } else {
            unset($data['image']);
        }
        unset($data['remove_image']);

        $paymentMethod->update($data);

        return redirect()
            ->route('admin.payment-methods.index')
            ->with('success', 'Metode pembayaran berhasil diperbarui.');
    }

    public function destroy(PaymentMethod $paymentMethod)
    {
        // Tunai & Hutang wajib — tidak bisa dihapus
        $lockedTypes = ['cash', 'debt'];
        if (in_array($paymentMethod->type, $lockedTypes, true)) {
            $label = $paymentMethod->type === 'cash' ? 'Tunai' : 'Hutang/Kasbon';

            return back()->with(
                'error',
                "{$label} adalah metode wajib dan tidak bisa dihapus. Nonaktifkan saja.",
            );
        }

        // Cegah hapus jika sudah dipakai di transaksi
        $usedInSales = $paymentMethod->salePayments()->exists();
        $usedInPurchases = $paymentMethod->purchasePayments()->exists();

        if ($usedInSales || $usedInPurchases) {
            return back()->with(
                'error',
                'Metode pembayaran ini tidak bisa dihapus karena sudah digunakan dalam transaksi. Nonaktifkan saja.',
            );
        }

        if ($paymentMethod->image) {
            Storage::disk('public')->delete($paymentMethod->image);
        }

        $paymentMethod->delete();

        return redirect()
            ->route('admin.payment-methods.index')
            ->with('success', 'Metode pembayaran berhasil dihapus.');
    }

    /**
     * Toggle active status (PATCH) — used from index table toggle.
     */
    public function toggleActive(PaymentMethod $paymentMethod)
    {
        $paymentMethod->update(['is_active' => ! $paymentMethod->is_active]);

        return back()->with(
            'success',
            $paymentMethod->is_active
                ? "{$paymentMethod->name} diaktifkan."
                : "{$paymentMethod->name} dinonaktifkan.",
        );
    }

    /** Update sort_order via AJAX dari index table. */
    public function updateSort(Request $request, PaymentMethod $paymentMethod)
    {
        $validated = $request->validate([
            'sort_order' => 'required|integer|min:0',
        ]);

        $paymentMethod->update(['sort_order' => $validated['sort_order']]);

        return response()->json(['success' => true]);
    }
}
