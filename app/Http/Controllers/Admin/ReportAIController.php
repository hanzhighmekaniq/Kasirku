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
use App\Models\User;

class ReportAIController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            "question" => "required|string|max:500",
        ]);

        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            abort(401, "Unauthenticated.");
        }

        $storeId = session("current_store_id") ?? $user->stores()->first()?->id;

        $from = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $to = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $branchIds = null;

        if (!$user->can("sale.void")) {
            $branchIds = [$user->branch_id];
        } elseif ($request->filled("branch_ids")) {
            $branchIds = (array) $request->input("branch_ids");
        }

        // lanjutkan kode...
    }

    private function callDeepSeek(array $context, string $question): string
    {
        $apiKey = config("services.deepseek.api_key");
        $baseUrl = config("services.deepseek.base_url");

        if (!$apiKey) {
            return "AI belum dikonfigurasi. Hubungi administrator untuk mengatur DEEPSEEK_API_KEY di file .env";
        }

        $systemPrompt =
            "Kamu adalah asisten analis laporan keuangan untuk aplikasi SIM-KASIR (sistem kasir toko kopi/cafe). " .
            "Jawab pertanyaan user berdasarkan data yang diberikan. " .
            "Gunakan Bahasa Indonesia yang santai, jelas, dan sertakan angka-angka penting. " .
            "Jika data tidak mencukupi, jawab sejujurnya. " .
            "Jangan menyebutkan 'berdasarkan data' berulang-ulang. " .
            "Format uang gunakan Rp dengan pemisah titik (contoh: Rp 1.500.000). " .
            "Boleh menyertakan emoji secukupnya untuk mempercantik jawaban.";

        $userPrompt =
            "Data periode {$context["periode"]}:\n" .
            json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) .
            "\n\nPertanyaan: {$question}";

        try {
            $client = new \GuzzleHttp\Client([
                "timeout" => 30,
                "connect_timeout" => 10,
            ]);

            $res = $client->post("{$baseUrl}/chat/completions", [
                "headers" => [
                    "Authorization" => "Bearer {$apiKey}",
                    "Content-Type" => "application/json",
                ],
                "json" => [
                    "model" => "deepseek-chat",
                    "messages" => [
                        ["role" => "system", "content" => $systemPrompt],
                        ["role" => "user", "content" => $userPrompt],
                    ],
                    "temperature" => 0.3,
                    "max_tokens" => 800,
                ],
            ]);

            $body = json_decode($res->getBody(), true);
            return $body["choices"][0]["message"]["content"] ??
                "Maaf, tidak ada jawaban dari AI.";
        } catch (\Exception $e) {
            Log::warning("DeepSeek API error: " . $e->getMessage());
            return "Maaf, sedang ada gangguan koneksi ke AI. Coba lagi nanti ya.";
        }
    }
}
