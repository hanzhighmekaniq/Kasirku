<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
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

        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $storeId = session('current_store_id') ?? $user->stores()->first()?->id;

        $from = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $to = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $branchIds = null;

        if (! $user->can('sale.void')) {
            $branchIds = [$user->branch_id];
        } elseif ($request->filled('branch_ids')) {
            $branchIds = (array) $request->input('branch_ids');
        }

        // ── Build context data ─────────────────────────────
        $saleScope = fn ($q) => $q->where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('sale_date', [$from, $to])
            ->when($branchIds, fn ($q) => $q->whereIn('branch_id', $branchIds));

        $totalSales = (float) Sale::where($saleScope)->sum('grand_total');
        $totalTransactions = Sale::where($saleScope)->count();
        $avgTransaction = $totalTransactions > 0 ? $totalSales / $totalTransactions : 0;

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->when($branchIds, fn ($q) => $q->whereIn('sales.branch_id', $branchIds))
            ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_qty'), DB::raw('SUM(sale_items.subtotal) as total_revenue'))
            ->groupBy('products.name')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->toArray();

        $dailySales = Sale::where($saleScope)
            ->select(DB::raw('DATE(sale_date) as date'), DB::raw('SUM(grand_total) as total'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();

        $totalExpenses = (float) Expense::where('store_id', $storeId)
            ->whereBetween('expense_date', [$from, $to])
            ->sum('amount');

        $totalPurchases = (float) Purchase::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('purchase_date', [$from, $to])
            ->sum('grand_total');

        $paymentBreakdown = DB::table('sale_payments')
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->join('payment_methods', 'sale_payments.payment_method_id', '=', 'payment_methods.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->when($branchIds, fn ($q) => $q->whereIn('sales.branch_id', $branchIds))
            ->select('payment_methods.name as method', DB::raw('SUM(sale_payments.amount) as total'))
            ->groupBy('payment_methods.name')
            ->orderByDesc('total')
            ->get()
            ->toArray();

        $context = [
            'periode' => $from->format('d M Y').' s/d '.$to->format('d M Y'),
            'ringkasan' => [
                'total_penjualan' => $totalSales,
                'total_transaksi' => $totalTransactions,
                'rata_rata_transaksi' => round($avgTransaction),
                'total_pembelian' => $totalPurchases,
                'total_pengeluaran' => $totalExpenses,
                'laba_kotor' => $totalSales - $totalPurchases,
                'laba_bersih' => $totalSales - $totalPurchases - $totalExpenses,
            ],
            'produk_terlaris' => $topProducts,
            'penjualan_harian' => $dailySales,
            'metode_pembayaran' => $paymentBreakdown,
        ];

        $answer = $this->callDeepSeek($context, $request->input('question'));

        return response()->json([
            'answer' => $answer,
            'context_period' => $context['periode'],
        ]);
    }

    private function callDeepSeek(array $context, string $question): string
    {
        $apiKey = config('services.deepseek.api_key');
        $baseUrl = config('services.deepseek.base_url');

        if (! $apiKey) {
            return 'AI belum dikonfigurasi. Hubungi administrator untuk mengatur DEEPSEEK_API_KEY di file .env';
        }

        $systemPrompt =
            'Kamu adalah asisten analis laporan keuangan untuk aplikasi SIM-KASIR (sistem kasir toko kopi/cafe). '.
            'Jawab pertanyaan user berdasarkan data yang diberikan. '.
            'Gunakan Bahasa Indonesia yang santai, jelas, dan sertakan angka-angka penting. '.
            'Jika data tidak mencukupi, jawab sejujurnya. '.
            "Jangan menyebutkan 'berdasarkan data' berulang-ulang. ".
            'Format uang gunakan Rp dengan pemisah titik (contoh: Rp 1.500.000). '.
            'Boleh menyertakan emoji secukupnya untuk mempercantik jawaban.';

        $userPrompt =
            "Data periode {$context['periode']}:\n".
            json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).
            "\n\nPertanyaan: {$question}";

        try {
            $client = new Client([
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

            return $body['choices'][0]['message']['content'] ??
                'Maaf, tidak ada jawaban dari AI.';
        } catch (\Exception $e) {
            Log::warning('DeepSeek API error: '.$e->getMessage());

            return 'Maaf, sedang ada gangguan koneksi ke AI. Coba lagi nanti ya.';
        }
    }
}
