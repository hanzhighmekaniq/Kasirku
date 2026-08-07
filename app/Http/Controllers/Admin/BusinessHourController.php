<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessHour;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BusinessHourController extends Controller
{
    public function index()
    {
        $storeId = session('current_store_id');

        $hours = BusinessHour::where('store_id', $storeId)
            ->orderBy('day_of_week')
            ->get();

        // Default jika belum ada data
        if ($hours->isEmpty()) {
            $hours = collect(range(0, 6))->map(fn ($day) => (object) [
                'day_of_week' => $day,
                'open_time' => '08:00',
                'close_time' => '21:00',
                'is_closed' => false,
            ]);
        }

        return Inertia::render('Admin/BusinessHours/Index', [
            'hours' => $hours,
        ]);
    }

    public function update(Request $request)
    {
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'hours' => 'required|array|min:7|max:7',
            'hours.*.day_of_week' => 'required|integer|min:0|max:6',
            'hours.*.open_time' => 'nullable|string',
            'hours.*.close_time' => 'nullable|string',
            'hours.*.is_closed' => 'boolean',
        ]);

        DB::beginTransaction();

        try {
            foreach ($validated['hours'] as $hour) {
                BusinessHour::updateOrCreate(
                    [
                        'store_id' => $storeId,
                        'day_of_week' => $hour['day_of_week'],
                    ],
                    [
                        'open_time' => $hour['is_closed'] ? null : $hour['open_time'],
                        'close_time' => $hour['is_closed'] ? null : $hour['close_time'],
                        'is_closed' => $hour['is_closed'] ?? false,
                    ],
                );
            }

            DB::commit();

            return back()->with('success', 'Jam operasional berhasil disimpan.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Gagal menyimpan: '.$e->getMessage()]);
        }
    }

    /**
     * Cek apakah toko buka saat ini.
     */
    public function checkOpen()
    {
        $storeId = session('current_store_id');
        $now = now();
        $dayOfWeek = (int) $now->format('N') - 1; // 0=Senin
        $currentTime = $now->format('H:i:s');

        $hours = BusinessHour::where('store_id', $storeId)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (! $hours || $hours->is_closed) {
            return response()->json(['is_open' => false, 'message' => 'Toko tutup hari ini.']);
        }

        if ($hours->isOpenAt($currentTime)) {
            return response()->json([
                'is_open' => true,
                'message' => 'Toko buka sampai '.$hours->close_time,
            ]);
        }

        return response()->json([
            'is_open' => false,
            'message' => 'Toko tutup. Buka jam '.$hours->open_time,
        ]);
    }
}
