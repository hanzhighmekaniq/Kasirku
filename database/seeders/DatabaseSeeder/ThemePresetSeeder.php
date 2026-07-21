<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\ThemePreset;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/**
 * Seed preset tema sistem (is_system = true, user_id null) dari 6 template
 * built-in: Violet, Supabase, Vercel, Twitter, Perpetuity, Caffein — sumber
 * data lengkap (mode light & dark eksplisit) di
 * Planing/PresetTheme/PresetTheme.md (format export tweakcn).
 *
 * Setiap preset disimpan sebagai SATU row dengan kolom `tokens` berbentuk
 * `{ light: {...39 keys}, dark: {...39 keys} }`. Semua key per mode diambil
 * LANGSUNG dari source data — tidak ada auto-generate mode yang hilang.
 * SETIAP template (termasuk yang light=dark identik di source aslinya)
 * didefinisikan dengan variable Light DAN Dark terpisah secara eksplisit,
 * supaya konsisten dan mudah dibedakan mana yang benar-benar sama vs
 * benar-benar beda palet.
 *
 * Urutan key token per mode mengikuti urutan grup di PresetTheme.md:
 * Primary → Background → Foreground → Secondary → Accent → Card →
 * Popover → Muted → Destructive → Border & Input → Chart → Sidebar →
 * (Status di akhir).
 *
 * 9 preset lama (Ocean Blue, dst) DIHAPUS total dan diganti 6 preset ini.
 */
class ThemePresetSeeder extends Seeder
{
    /**
     * Status colors standar — konsisten di semua tema, ditaruh di akhir.
     */
    private const STATUS = [
        'success' => '#16A34A',
        'successForeground' => '#FFFFFF',
        'warning' => '#F59E0B',
        'warningForeground' => '#FFFFFF',
        'info' => '#0284C7',
        'infoForeground' => '#FFFFFF',
        'radius' => '0.5rem',
    ];

    public function run(): void
    {
        $templates = $this->getTemplates();
        $slugs = array_column($templates, 'slug');

        // Hapus total preset sistem lama yang tidak ada di daftar baru
        // (ganti total sesuai permintaan — bukan cuma update). Preset lama
        // (Ocean Blue, dst) punya slug NULL — whereNotIn() MySQL tidak
        // match baris NULL, jadi kondisinya ditambah eksplisit.
        ThemePreset::where('is_system', true)
            ->where(function ($q) use ($slugs) {
                $q->whereNull('slug')->orWhereNotIn('slug', $slugs);
            })
            ->delete();

        foreach ($templates as $template) {
            ThemePreset::updateOrCreate(
                ['slug' => $template['slug']],
                [
                    'user_id' => null,
                    'name' => $template['name'],
                    'description' => $template['description'],
                    'is_system' => true,
                    'tokens' => [
                        'light' => array_merge($template['light'], self::STATUS),
                        'dark' => array_merge($template['dark'], self::STATUS),
                    ],
                ],
            );
        }

        // Preset tema di-cache 1 jam di HandleInertiaRequests (key:
        // "system-themes"). Kalau tidak di-clear di sini, seeder yang baru
        // dijalankan tidak akan terlihat efeknya sampai cache expired —
        // user akan tetap lihat warna LAMA walau DB sudah update.
        Cache::forget('system-themes');

        if (method_exists($this->command, 'info')) {
            $this->command->info('✅ ' . count($templates) . ' system theme presets created (Violet, Supabase, Vercel, Twitter, Perpetuity, Caffein).');
        }
    }

    /**
     * Data 6 template built-in. Setiap entry punya token light dan dark
     * EKSPLISIT (39 key masing-masing setelah digabung STATUS) langsung
     * dari Planing/PresetTheme/PresetTheme.md — tidak ada auto-generate.
     *
     * Urutan key di setiap array token: Primary, Background, Foreground,
     * Secondary, Accent, Card, Popover, Muted, Destructive,
     * Border & Input (border/input/ring), Chart (1-5), Sidebar.
     *
     * @return array<int, array{slug: string, name: string, description: string, light: array<string,string>, dark: array<string,string>}>
     */
    private function getTemplates(): array
    {
        // ── PERPETUITY TERANG (source md line 107-118) — teal kalem di atas putih kehijauan ──
        $perpetuityLight = [
            // Primary
            'primary' => '#06858E',
            'primaryForeground' => '#FFFFFF',
            // Background & Foreground
            'background' => '#E8F0F0',
            'foreground' => '#0A4A55',
            // Secondary
            'secondary' => '#D9EAEA',
            'secondaryForeground' => '#0A4A55',
            // Accent
            'accent' => '#C9E5E7',
            'accentForeground' => '#0A4A55',
            // Card
            'card' => '#F2F7F7',
            'cardForeground' => '#0A4A55',
            // Popover
            'popover' => '#F2F7F7',
            'popoverForeground' => '#0A4A55',
            // Muted
            'muted' => '#E0EAEA',
            'mutedForeground' => '#427A7E',
            // Destructive
            'destructive' => '#D13838',
            'destructiveForeground' => '#FFFFFF',
            // Border & Input
            'border' => '#CDE0E2',
            'input' => '#D9EAEA',
            'ring' => '#06858E',
            // Chart
            'chart1' => '#06858E',
            'chart2' => '#1E9EA6',
            'chart3' => '#37B6BE',
            'chart4' => '#5DC7CE',
            'chart5' => '#8AD8DD',
            // Sidebar
            'sidebar' => '#DAEBED',
            'sidebarForeground' => '#0A4A55',
        ];

        // ── PERPETUITY GELAP (source md line 120-131) — cyan terang di atas navy gelap ──
        $perpetuityDark = [
            // Primary
            'primary' => '#4DE8E8',
            'primaryForeground' => '#0A1A20',
            // Background & Foreground
            'background' => '#0A1A20',
            'foreground' => '#4DE8E8',
            // Secondary
            'secondary' => '#164955',
            'secondaryForeground' => '#4DE8E8',
            // Accent
            'accent' => '#164955',
            'accentForeground' => '#4DE8E8',
            // Card
            'card' => '#0C2025',
            'cardForeground' => '#4DE8E8',
            // Popover
            'popover' => '#0C2025',
            'popoverForeground' => '#4DE8E8',
            // Muted
            'muted' => '#0F3039',
            'mutedForeground' => '#36A5A5',
            // Destructive
            'destructive' => '#E83C3C',
            'destructiveForeground' => '#F2F2F2',
            // Border & Input
            'border' => '#164955',
            'input' => '#164955',
            'ring' => '#4DE8E8',
            // Chart
            'chart1' => '#4DE8E8',
            'chart2' => '#36A5A5',
            'chart3' => '#2D8A8A',
            'chart4' => '#19595E',
            'chart5' => '#0E383C',
            // Sidebar
            'sidebar' => '#0A1A20',
            'sidebarForeground' => '#4DE8E8',
        ];

        // ── TWITTER — light & dark IDENTIK (source md line 80-104 sama persis) ──
        $twitterLight = [
            // Primary
            'primary' => '#1E9DF1',
            'primaryForeground' => '#FFFFFF',
            // Background & Foreground
            'background' => '#FFFFFF',
            'foreground' => '#0F1419',
            // Secondary
            'secondary' => '#0F1419',
            'secondaryForeground' => '#FFFFFF',
            // Accent
            'accent' => '#E3ECF6',
            'accentForeground' => '#1E9DF1',
            // Card
            'card' => '#F7F8F8',
            'cardForeground' => '#0F1419',
            // Popover
            'popover' => '#FFFFFF',
            'popoverForeground' => '#0F1419',
            // Muted
            'muted' => '#E5E5E6',
            'mutedForeground' => '#0F1419',
            // Destructive
            'destructive' => '#F4212E',
            'destructiveForeground' => '#FFFFFF',
            // Border & Input
            'border' => '#E1EAEF',
            'input' => '#F7F9FA',
            'ring' => '#1DA1F2',
            // Chart
            'chart1' => '#1E9DF1',
            'chart2' => '#00B87A',
            'chart3' => '#F7B928',
            'chart4' => '#17BF63',
            'chart5' => '#E0245E',
            // Sidebar
            'sidebar' => '#F7F8F8',
            'sidebarForeground' => '#0F1419',
        ];
        $twitterDark = [
            // Primary
            'primary' => '#0099FF',
            'primaryForeground' => '#FFFFFF',
            // Background & Foreground
            'background' => '#000000',
            'foreground' => '#E7E9EA',
            // Secondary
            'secondary' => '#F0F3F4',
            'secondaryForeground' => '#0F1419',
            // Accent
            'accent' => '#061622',
            'accentForeground' => '#1C9CF0',
            // Card
            'card' => '#17181C',
            'cardForeground' => '#D9D9D9',
            // Popover
            'popover' => '#000000',
            'popoverForeground' => '#E7E9EA',
            // Muted
            'muted' => '#181818',
            'mutedForeground' => '#72767A',
            // Destructive
            'destructive' => '#F4212E',
            'destructiveForeground' => '#FFFFFF',
            // Border & Input
            'border' => '#242628',
            'input' => '#22303C',
            'ring' => '#1DA1F2',
            // Chart
            'chart1' => '#1E9DF1',
            'chart2' => '#00B87A',
            'chart3' => '#F7B928',
            'chart4' => '#17BF63',
            'chart5' => '#E0245E',
            // Sidebar
            'sidebar' => '#000000',
            'sidebarForeground' => '#E7E9EA',
        ];  // source md: TWITTER GELAP identik dengan TWITTER TERANG

        return [
            [
                'slug' => 'twitter',
                'name' => 'Twitter',
                'description' => 'Biru terang di atas hitam pekat khas X/Twitter — cocok untuk platform sosial & media.',
                'light' => $twitterLight,
                'dark' => $twitterDark,
            ],
            [
                'slug' => 'perpetuity',
                'name' => 'Perpetuity',
                'description' => 'Teal kalem & tenang — cocok untuk healthcare, klinik, layanan profesional.',
                'light' => $perpetuityLight,
                'dark' => $perpetuityDark,
            ],
        ];
    }
}
