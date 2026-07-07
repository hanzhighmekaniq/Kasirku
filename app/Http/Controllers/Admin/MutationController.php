<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
class MutationController extends Controller
{
    /**
     * Receive replayed mutations from the client queue.
     *
     * Body: { mutations: [{ id, type, url, method, body }] }
     *
     * Supported types:
     *   - 'sale': replays KasirController@store logic
     */
    public function sync(Request $request)
    {
        $request->validate([
            "mutations" => "required|array|min:1",
            "mutations.*.id" => "required|string",
            "mutations.*.type" => "required|string|in:sale",
            "mutations.*.body" => "required|array",
        ]);

        $results = [];

        foreach ($request->mutations as $mutation) {
            $id = $mutation["id"];
            $type = $mutation["type"];
            $body = $mutation["body"];

            try {
                $result = match ($type) {
                    "sale" => $this->replaySale($body),
                };

                $results[] = [
                    "id" => $id,
                    "type" => $type,
                    "status" => "completed",
                    "sale_id" => $result["sale_id"],
                    "sale_no" => $result["sale_no"],
                    "error" => null,
                ];
            } catch (\Throwable $e) {
                Log::warning(
                    "[MutationQueue] Failed mutation {$id} ({$type}): {$e->getMessage()}",
                );

                $results[] = [
                    "id" => $id,
                    "type" => $type,
                    "status" => "failed",
                    "error" => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            "success" => true,
            "results" => $results,
        ]);
    }

    /**
     * Replay a sale mutation by forwarding to KasirController.
     */
    protected function replaySale(array $body): array
    {
        // Build a new request with the stored payload
        $saleRequest = Request::create("/app/kasir/store", "POST", $body);
        $saleRequest->headers->set("Accept", "application/json");
        $saleRequest->headers->set("X-Requested-With", "XMLHttpRequest");

        // Restore authenticated user from the current session
        $saleRequest->setUserResolver(fn() => Auth::user());

        $controller = app(KasirController::class);
        $controller->store($saleRequest);

        // KasirController sends a JSON response with sale data.
        // We access the sale via the global request's session (it was created inside DB::transaction).
        // Instead of parsing the response, re-query the last sale created by this user.
        $sale = \App\Models\Sale::where("user_id", Auth::id())
            ->orderByDesc("id")
            ->first();

        return [
            "sale_id" => $sale?->id,
            "sale_no" => $sale?->sale_no,
        ];
    }
}
