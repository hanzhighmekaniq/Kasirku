<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\Plan;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;

/**
 * DevSeeder — HANYA sistem + 1 akun developer.
 * Tanpa toko, tanpa branch, tanpa owner.
 *
 * Cara pakai:
 *   php artisan db:seed --class=DevSeeder
 */
class DevSeeder extends Seeder
{
    private const PASSWORD = 'password';

    private const PERMISSIONS = [
        'supplier.view','supplier.create','supplier.edit','supplier.delete',
        'dashboard.view',
        'sale.create','sale.view','sale.void','sale.discount','sale.return',
        'product.view','product.create','product.edit','product.delete','product.import',
        'stock.view','stock.adjustment','stock.opname','stock.transfer','stock.waste',
        'purchase.view','purchase.create','purchase.edit','purchase.delete','purchase.return',
        'customer.view','customer.create','customer.edit','customer.delete','customer.deposit',
        'employee.view','employee.create','employee.edit','employee.delete',
        'report.sales','report.purchase','report.stock','report.expense','report.shift','report.commission',
        'shift.open','shift.close','shift.view','shift.manage',
        'expense.view','expense.create','expense.edit','expense.delete',
        'promotion.view','promotion.create','promotion.edit','promotion.delete',
        'table.view','table.manage','kitchen.view','kitchen.update',
        'queue.view','queue.manage','booking.view','booking.create','booking.edit','booking.cancel',
        'membership.view','membership.create','membership.edit',
        'commission.view','commission.approve',
        'setting.view','setting.edit','setting.payment_method','setting.payment_gateway','setting.module',
    ];

    public function run(): void
    {
        $this->info('🚀 DevSeeder — sistem + 1 akun developer');

        $this->seedStoreTypes();
        $this->seedPlans();
        $this->seedFeatures();
        $this->seedPermissions();
        $this->seedDeveloper();

        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('✅ SELESAI');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('🔑 dev@gmail.com / '.self::PASSWORD.'  (Developer)');
        $this->info('');
        $this->info('📊 Dibuat:');
        $this->info('   8 tipe toko  |  3 plan  |  21 fitur  |  59 permission  |  1 developer');
        $this->info('');
        $this->info('💡 Untuk data demo (toko, owner, cabang, dll):');
        $this->info('   php artisan db:seed');
        $this->info('');
    }

    private function info(string $m): void
    {
        if (method_exists($this->command, 'info')) $this->command->info($m);
    }

    // ── Store Types ────────────────────────────────────────────────────

    private function seedStoreTypes(): void
    {
        $types = [
            ['code'=>'retail',      'label'=>'Retail',      'icon'=>'🏪','pb'=>'retail',      'sort'=>1, 'desc'=>'Toko, minimarket, grosir, apotek',
                'ot'=>[['v'=>'takeaway','l'=>'Ambil'],['v'=>'delivery','l'=>'Antar'],['v'=>'wholesale','l'=>'Grosir']]],
            ['code'=>'fnb',         'label'=>'F&B',         'icon'=>'☕','pb'=>'fnb',          'sort'=>2, 'desc'=>'Restoran, cafe, bakery, warteg',
                'ot'=>[['v'=>'dine_in','l'=>'Dine-in'],['v'=>'takeaway','l'=>'Takeaway'],['v'=>'delivery','l'=>'Delivery']]],
            ['code'=>'service',     'label'=>'Service',     'icon'=>'✂️','pb'=>'service',      'sort'=>3, 'desc'=>'Salon, barbershop, bengkel, spa',
                'ot'=>[['v'=>'walk_in','l'=>'Langsung'],['v'=>'booking','l'=>'Booking'],['v'=>'pickup_delivery','l'=>'Jemput & Antar']]],
            ['code'=>'rental',      'label'=>'Rental',      'icon'=>'🔑','pb'=>'rental',       'sort'=>4, 'desc'=>'Sewa alat, kendaraan, kamera',
                'ot'=>[['v'=>'per_hour','l'=>'Per Jam'],['v'=>'per_day','l'=>'Per Hari'],['v'=>'per_week','l'=>'Per Minggu']]],
            ['code'=>'ticket',      'label'=>'Ticket',      'icon'=>'🎟️','pb'=>'ticket',       'sort'=>5, 'desc'=>'Bioskop, futsal, event, konser',
                'ot'=>[['v'=>'online','l'=>'Booking Online'],['v'=>'walk_in','l'=>'Walk-in'],['v'=>'group','l'=>'Group']]],
            ['code'=>'hospitality', 'label'=>'Hospitality', 'icon'=>'🏨','pb'=>'hospitality',  'sort'=>6, 'desc'=>'Hotel, villa, kost, guest house',
                'ot'=>[['v'=>'check_in','l'=>'Check-in'],['v'=>'reservation','l'=>'Reservasi'],['v'=>'short_stay','l'=>'Short Stay']]],
            ['code'=>'parking',     'label'=>'Parking',     'icon'=>'🅿️','pb'=>'parking',      'sort'=>7, 'desc'=>'Parkir kendaraan',
                'ot'=>[['v'=>'entry','l'=>'Masuk'],['v'=>'flat','l'=>'Flat'],['v'=>'per_hour','l'=>'Per Jam']]],
            ['code'=>'session',     'label'=>'Session',     'icon'=>'🎮','pb'=>'session',      'sort'=>8, 'desc'=>'Warnet, rental PS, karaoke, billiard',
                'ot'=>[['v'=>'per_hour','l'=>'Per Jam'],['v'=>'per_minute','l'=>'Per Menit'],['v'=>'flat','l'=>'Flat']]],
        ];
        foreach ($types as $t) {
            StoreType::updateOrCreate(['code'=>$t['code']], [
                'label'=>$t['label'], 'icon'=>$t['icon'], 'description'=>$t['desc'],
                'order_types'=>json_encode($t['ot']), 'pos_behavior'=>$t['pb'], 'sort_order'=>$t['sort'],
            ]);
        }
        $this->info('📦 8 tipe toko');
    }

    // ── Plans ──────────────────────────────────────────────────────────

    private function seedPlans(): void
    {
        Plan::updateOrCreate(['code'=>'free'],  ['label'=>'Free',  'description'=>'Gratis untuk pemula.','max_users'=>1,  'max_branches'=>1,  'price'=>0,      'trial_days'=>0,  'sort_order'=>1]);
        Plan::updateOrCreate(['code'=>'basic'], ['label'=>'Basic', 'description'=>'Bisnis berkembang.',  'max_users'=>5,  'max_branches'=>3,  'price'=>199000,  'trial_days'=>14, 'sort_order'=>2]);
        Plan::updateOrCreate(['code'=>'pro'],   ['label'=>'Pro',   'description'=>'Premium, all unlock.','max_users'=>999,'max_branches'=>999,'price'=>499000, 'trial_days'=>7,  'sort_order'=>3]);
        $this->info('💳 3 plan');
    }

    // ── Features ────────────────────────────────────────────────────────

    private function seedFeatures(): void
    {
        $features = [
            ['code'=>'basic_pos',       'label'=>'POS / Kasir',        'cat'=>'pos',       'sort'=>1,  'types'=>['retail','fnb','service','rental','ticket','hospitality']],
            ['code'=>'cashier_shift',   'label'=>'Shift Kasir',        'cat'=>'pos',       'sort'=>2,  'types'=>['retail','fnb','service','rental','ticket','hospitality']],
            ['code'=>'stock',           'label'=>'Manajemen Stok',     'cat'=>'inventory', 'sort'=>3,  'types'=>['retail','fnb','rental']],
            ['code'=>'purchase',        'label'=>'Pembelian',          'cat'=>'inventory', 'sort'=>4,  'types'=>['retail','fnb','rental']],
            ['code'=>'batch',           'label'=>'Batch & Expired',    'cat'=>'inventory', 'sort'=>5,  'types'=>['retail','fnb']],
            ['code'=>'expiry',          'label'=>'Kadaluarsa',         'cat'=>'inventory', 'sort'=>6,  'types'=>['retail','fnb']],
            ['code'=>'promo',           'label'=>'Promosi',            'cat'=>'pos',       'sort'=>7,  'types'=>['retail','fnb','service','ticket']],
            ['code'=>'sale_return',     'label'=>'Retur Penjualan',    'cat'=>'pos',       'sort'=>8,  'types'=>['retail','fnb']],
            ['code'=>'recipe',          'label'=>'Resep Produk',       'cat'=>'inventory', 'sort'=>9,  'types'=>['fnb']],
            ['code'=>'modifier',        'label'=>'Modifier',           'cat'=>'inventory', 'sort'=>10, 'types'=>['fnb']],
            ['code'=>'table',           'label'=>'Meja Cafe',          'cat'=>'pos',       'sort'=>11, 'types'=>['fnb','hospitality']],
            ['code'=>'kitchen',         'label'=>'Kitchen Display',    'cat'=>'pos',       'sort'=>12, 'types'=>['fnb']],
            ['code'=>'waste',           'label'=>'Waste',              'cat'=>'inventory', 'sort'=>13, 'types'=>['fnb']],
            ['code'=>'queue',           'label'=>'Antrian',            'cat'=>'crm',       'sort'=>14, 'types'=>['service']],
            ['code'=>'booking',         'label'=>'Booking',            'cat'=>'crm',       'sort'=>15, 'types'=>['fnb','service','rental','ticket','hospitality']],
            ['code'=>'commission',      'label'=>'Komisi',             'cat'=>'crm',       'sort'=>16, 'types'=>['service']],
            ['code'=>'membership',      'label'=>'Membership',         'cat'=>'crm',       'sort'=>17, 'types'=>['service','hospitality']],
            ['code'=>'deposit',         'label'=>'Deposit',            'cat'=>'finance',   'sort'=>18, 'types'=>['service','rental','hospitality']],
            ['code'=>'report',          'label'=>'Laporan',            'cat'=>'finance',   'sort'=>19, 'types'=>['retail','fnb','service','rental','ticket','hospitality']],
            ['code'=>'payment_gateway', 'label'=>'Payment Gateway',    'cat'=>'finance',   'sort'=>20, 'types'=>['retail','fnb','service','rental','ticket','hospitality']],
            ['code'=>'stock_opname',    'label'=>'Stock Opname',       'cat'=>'inventory', 'sort'=>21, 'types'=>['retail','fnb']],
        ];
        foreach ($features as $f) {
            Feature::updateOrCreate(['code'=>$f['code']], [
                'label'=>$f['label'], 'category'=>$f['cat'], 'sort_order'=>$f['sort'],
                'applicable_types'=>$f['types'],
            ]);
        }
        // Attach ke plans
        $free  = Plan::where('code','free')->first();
        $basic = Plan::where('code','basic')->first();
        $pro   = Plan::where('code','pro')->first();
        if ($free)  $free->planFeatures()->sync(Feature::whereIn('code',['basic_pos','stock','purchase','promo'])->pluck('id'));
        if ($basic) $basic->planFeatures()->sync(Feature::pluck('id'));
        if ($pro)   $pro->planFeatures()->sync(Feature::pluck('id'));
        $this->info('🔧 21 fitur + attached ke plans');
    }

    // ── Permissions ─────────────────────────────────────────────────────

    private function seedPermissions(): void
    {
        foreach (self::PERMISSIONS as $p) {
            Permission::firstOrCreate(['name'=>$p, 'guard_name'=>'web']);
        }
        $this->info('🔑 '.count(self::PERMISSIONS).' permission');
    }

    // ── Developer ────────────────────────────────────────────────────────

    private function seedDeveloper(): void
    {
        User::updateOrCreate(['email'=>'dev@gmail.com'], [
            'name'=>'Dev Admin',
            'password'=>Hash::make(self::PASSWORD),
            'is_developer'=>true,
        ]);
        $this->info('👤 dev@gmail.com / '.self::PASSWORD);
    }
}
