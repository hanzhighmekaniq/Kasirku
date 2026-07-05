<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Bersihkan feature code lama yang sudah digantikan:
 *  - cashier_shift → shift
 *  - batch         → batch_expired
 *  - expiry        → (tidak perlu, sudah ada di batch_expired)
 *  - deposit       → fitur bisnis internal, tidak di sidebar (keep tapi tidak di plan_feature)
 */
return new class extends Migration {
    // Feature lama yang dihapus total
    private const REMOVE = ['cashier_shift', 'batch', 'expiry'];

    public function up(): void
    {
        // Hapus dari pivot plan_feature dulu (FK constraint)
        $featureIds = DB::table('features')
            ->whereIn('code', self::REMOVE)
            ->pluck('id');

        if ($featureIds->isNotEmpty()) {
            DB::table('plan_feature')
                ->whereIn('feature_id', $featureIds)
                ->delete();

            // Hapus dari tabel features
            DB::table('features')
                ->whereIn('code', self::REMOVE)
                ->delete();
        }
    }

    public function down(): void
    {
        // Tidak perlu rollback — data lama sudah di-replace seeder baru
    }
};
