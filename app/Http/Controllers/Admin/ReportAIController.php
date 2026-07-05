<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Branch;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportAIController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            'question' => 'required|string|max:500',
        ]);

        $user = Auth::user();
        $storeId = session('current_store_id') ?? $user?->stores()->first()?->id;

        $from = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();
        $to = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $branchIds = null;
        if (!$user->can('sale.void')) {
            $branchIds = [$user->branch_id];
        } elseif ($request->filled('branch_ids')) {
            $branchIds = (array) $request->input('branch_ids');
        }

        $scopeQuery = function ($q) use ($storeId, $branchIds) {
            $q->where('store_id', $storeId);
            if ($branchIds) {
                $q->whereIn('branch_id', $branchIds);
            }
        };

        // ── Gather context data ────────────────────────────────
        $totalSales = Sale::where('status', 'completed')
            ->whereBetween('sale_date', [$from, $to])->where($scopeQuery)
            ->sum('grand_total');

        $salesCount = Sale::where('status', 'completed')
            ->whereBetween('sale_date', [$from, $to])->where($scopeQuery)
            ->count();

        $avgTransaction = $salesCount > 0 ? round($totalSales / $salesCount, 2) : 0;

        $totalPurchases = Purchase::where('status', 'completed')
            ->whereBetween('purchase_date', [$from, $to])->where($scopeQuery)
            ->sum('grand_total');

        $totalExpenses = Expense::whereBetween('expense_date', [$from, $to])
            ->where($scopeQuery)->sum('amount');

        // Top 5 products
        $topProducts = SaleItem::whereHas('sale', fn($q) =>
            $q->where('status', 'completed')->where('store_id', $storeId)
              ->whereBetween('sale_date', [$from, $to])
              ->when($branchIds, fn($sq) => $sq->whereIn('branch_id', $branchIds))
        )
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(sale_items.quantity) as qty'), DB::raw('SUM(sale_items.subtotal) as revenue'))
            ->groupBy('products.name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        // Top 5 customers
        $topCustomers = Sale::where('status', 'completed')
            ->whereBetween('sale_date', [$from, $to])->where($scopeQuery)
            ->whereNotNull('customer_id')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->select('customers.name', DB::raw('COUNT(*) as tx_count'), DB::raw('SUM(sales.grand_total) as total'))
            ->groupBy('customers.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // Branch names
        $branchNames = Branch::where('store_id', $storeId)
            ->where('is_active', true)->pluck('name')->implode(', ');

        // ── Build context ──────────────────────────────────────
        $context = [
            'periode' => $from->format('d M Y') . ' - ' . $to->format('d M Y'),
            'cabang' => $branchNames ?: 'Semua cabang',
            'total_penjualan' => (float) $totalSales,
            'jumlah_transaksi' => $salesCount,
            'rata_rata_transaksi' => $avgTransaction,
            'total_pembelian' => (float) $totalPurchases,
            'total_biaya' => (float) $totalExpenses,
            'produk_teratas' => $topProducts->map(fn($p) => [
                'nama' => $p->name,
                'terjual' => (int) $p->qty,
                'pendapatan' => (float) $p->revenue,
            ]),
            'pelanggan_teratas' => $topCustomers->map(fn($c) => [
                'nama' => $c->name,
                'transaksi' => (int) $c->tx_count,
                'total_belanja' => (float) $c->total,
            ]),
        ];

        // ── Call DeepSeek ──────────────────────────────────────
        $response = $this->callDeepSeek($context, $request->question);

        return response()->json([
            'answer' => $response,
            'context_period' => $context['periode'],
        ]);
    }

    private function callDeepSeek(array $context, string $question): string
    {
        $apiKey = config('services.deepseek.api_key');
        $baseUrl = config('services.deepseek.base_url');

        if (!$apiKey) {
            return 'AI belum dikonfigurasi. Hubungi administrator untuk mengatur DEEPSEEK_API_KEY di file .env';
        }

        $systemPrompt = "Kamu adalah asisten analis laporan keuangan untuk aplikasi SIM-KASIR (sistem kasir toko kopi/cafe). "
            . "Jawab pertanyaan user berdasarkan data yang diberikan. "
            . "Gunakan Bahasa Indonesia yang santai, jelas, dan sertakan angka-angka penting. "
            . "Jika data tidak mencukupi, jawab sejujurnya. "
            . "Jangan menyebutkan 'berdasarkan data' berulang-ulang. "
            . "Format uang gunakan Rp dengan pemisah titik (contoh: Rp 1.500.000). "
            . "Boleh menyertakan emoji secukupnya untuk mempercantik jawaban.";

        $userPrompt = "Data periode {$context['periode']}:\n"
            . json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            . "\n\nPertanyaan: {$question}";

        try {
            $client = new \GuzzleHttp\Client([
                'timeout' => 30,
                'connect_timeout' => 10,
            ]);

            $res = $client->post("{$baseUrl}/chat/completions", [
                'headers' => [
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'deepseek-chat',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 800,
                ],
            ]);

            $body = json_decode($res->getBody(), true);
            return $body['choices'][0]['message']['content'] ?? 'Maaf, tidak ada jawaban dari AI.';
        } catch (\Exception $e) {
            Log::warning('DeepSeek API error: ' . $e->getMessage());
            return 'Maaf, sedang ada gangguan koneksi ke AI. Coba lagi nanti ya.';
        }
    }
}
