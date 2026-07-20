<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\ThemePreset;
use Illuminate\Database\Seeder;

/**
 * Seed preset tema sistem (is_system = true, user_id null) dari 6 template
 * baru: Violet, Supabase, Vercel, Twitter, Perpetuity, Caffein — sumber data
 * di Planing/PresetTheme/PresetTheme.md (format export tweakcn).
 *
 * Setiap template di source cuma punya SATU mode warna (dark atau light).
 * Mode yang tidak ada di-generate otomatis dengan strategi "netral":
 * surface tokens (background/card/popover/secondary/muted/border/input/
 * sidebar-*) diganti palet netral standar sesuai mode target, sementara
 * token identitas brand (primary/accent/destructive/ring/chart1-5/
 * sidebarPrimary/sidebarRing) dipertahankan sama seperti mode sumber
 * supaya identitas warna tema tetap konsisten di light & dark.
 *
 * 9 preset lama (Ocean Blue, dst) DIHAPUS total dan diganti 6 preset ini.
 */
class ThemePresetSeeder extends Seeder
{
    /** Status colors standar — konsisten di semua tema. */
    private const STATUS = [
        'success' => '#16A34A',
        'successForeground' => '#FFFFFF',
        'warning' => '#F59E0B',
        'warningForeground' => '#FFFFFF',
        'info' => '#0284C7',
        'infoForeground' => '#FFFFFF',
        'radius' => '0.5rem',
    ];

    /** Palet netral untuk auto-generate mode light yang hilang. */
    private const NEUTRAL_LIGHT = [
        'background' => '#F8FAFC',
        'foreground' => '#0F172A',
        'card' => '#FFFFFF',
        'cardForeground' => '#0F172A',
        'popover' => '#FFFFFF',
        'popoverForeground' => '#0F172A',
        'secondary' => '#F1F5F9',
        'secondaryForeground' => '#0F172A',
        'muted' => '#F1F5F9',
        'mutedForeground' => '#64748B',
        'border' => '#E2E8F0',
        'input' => '#E2E8F0',
        'sidebar' => '#FFFFFF',
        'sidebarForeground' => '#0F172A',
        'sidebarAccent' => '#F1F5F9',
        'sidebarAccentForeground' => '#0F172A',
        'sidebarBorder' => '#E2E8F0',
    ];

    /** Palet netral untuk auto-generate mode dark yang hilang. */
    private const NEUTRAL_DARK = [
        'background' => '#0F172A',
        'foreground' => '#F8FAFC',
        'card' => '#1F2937',
        'cardForeground' => '#F8FAFC',
        'popover' => '#1F2937',
        'popoverForeground' => '#F8FAFC',
        'secondary' => '#334155',
        'secondaryForeground' => '#F8FAFC',
        'muted' => '#334155',
        'mutedForeground' => '#94A3B8',
        'border' => '#334155',
        'input' => '#334155',
        'sidebar' => '#1E293B',
        'sidebarForeground' => '#F8FAFC',
        'sidebarAccent' => '#334155',
        'sidebarAccentForeground' => '#F8FAFC',
        'sidebarBorder' => '#334155',
    ];

    /** Token identitas brand yang dipertahankan sama di kedua mode. */
    private const BRAND_KEYS = [
        'primary', 'primaryForeground',
        'accent', 'accentForeground',
        'destructive', 'destructiveForeground',
        'ring',
        'chart1', 'chart2', 'chart3', 'chart4', 'chart5',
        'sidebarPrimary', 'sidebarPrimaryForeground', 'sidebarRing',
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
                    'primary' => $template['primary'],
                    'secondary' => $template['secondary'],
                    'accent' => $template['accent'],
                    'is_dark' => $template['is_dark'],
                    'is_system' => true,
                    'light_tokens' => $template['light_tokens'],
                    'dark_tokens' => $template['dark_tokens'],
                ],
            );
        }

        if (method_exists($this->command, 'info')) {
            $this->command->info('✅ '.count($templates).' system theme presets created (Violet, Supabase, Vercel, Twitter, Perpetuity, Caffein).');
        }
    }

    /**
     * Lengkapi satu mode (sumber, apa adanya dari source data) dengan
     * status colors + radius standar.
     *
     * @param  array<string,string>  $sourceTokens
     * @return array<string,string>
     */
    private function completeSourceMode(array $sourceTokens): array
    {
        return array_merge($sourceTokens, self::STATUS);
    }

    /**
     * Generate mode yang HILANG dari mode sumber: brand tokens dipertahankan,
     * surface tokens diganti palet netral target mode.
     *
     * @param  array<string,string>  $sourceTokens
     * @param  'light'|'dark'  $targetMode
     * @return array<string,string>
     */
    private function generateMissingMode(array $sourceTokens, string $targetMode): array
    {
        $neutral = $targetMode === 'light' ? self::NEUTRAL_LIGHT : self::NEUTRAL_DARK;
        $brand = array_intersect_key($sourceTokens, array_flip(self::BRAND_KEYS));

        return array_merge($neutral, $brand, self::STATUS);
    }

    /**
     * Data 6 template built-in baru. Setiap entry punya SATU set token
     * sumber (sesuai mode aslinya di PresetTheme.md) — mode lawan
     * di-generate otomatis oleh generateMissingMode().
     *
     * @return array<int, array>
     */
    private function getTemplates(): array
    {
        $defs = [
            [
                'slug' => 'violet',
                'name' => 'Violet',
                'description' => 'Ungu vibrant dengan aksen navy — modern & tegas, cocok untuk SaaS dan dashboard developer.',
                'sourceMode' => 'dark',
                'tokens' => [
                    'primary' => '#8C5CFF', 'primaryForeground' => '#FFFFFF',
                    'secondary' => '#2A2C33', 'secondaryForeground' => '#F0F0F0',
                    'accent' => '#1E293B', 'accentForeground' => '#79C0FF',
                    'background' => '#1A1B1E', 'foreground' => '#F0F0F0',
                    'card' => '#222327', 'cardForeground' => '#F0F0F0',
                    'popover' => '#222327', 'popoverForeground' => '#F0F0F0',
                    'muted' => '#2A2C33', 'mutedForeground' => '#A0A0A0',
                    'destructive' => '#F87171', 'destructiveForeground' => '#FFFFFF',
                    'border' => '#33353A', 'input' => '#33353A', 'ring' => '#8C5CFF',
                    'chart1' => '#4ADE80', 'chart2' => '#8C5CFF', 'chart3' => '#FCA5A5', 'chart4' => '#5993F4', 'chart5' => '#A0A0A0',
                    'sidebar' => '#161618', 'sidebarForeground' => '#F0F0F0',
                    'sidebarPrimary' => '#8C5CFF', 'sidebarPrimaryForeground' => '#FFFFFF',
                    'sidebarAccent' => '#2A2C33', 'sidebarAccentForeground' => '#8C5CFF',
                    'sidebarBorder' => '#33353A', 'sidebarRing' => '#8C5CFF',
                ],
            ],
            [
                'slug' => 'supabase',
                'name' => 'Supabase',
                'description' => 'Hijau gelap khas Supabase — cocok untuk SaaS, dashboard developer, cloud tools.',
                'sourceMode' => 'dark',
                'tokens' => [
                    'primary' => '#006239', 'primaryForeground' => '#DDE8E3',
                    'secondary' => '#242424', 'secondaryForeground' => '#FAFAFA',
                    'accent' => '#313131', 'accentForeground' => '#FAFAFA',
                    'background' => '#121212', 'foreground' => '#E2E8F0',
                    'card' => '#171717', 'cardForeground' => '#E2E8F0',
                    'popover' => '#242424', 'popoverForeground' => '#A9A9A9',
                    'muted' => '#1F1F1F', 'mutedForeground' => '#A2A2A2',
                    'destructive' => '#541C15', 'destructiveForeground' => '#EDE9E8',
                    'border' => '#292929', 'input' => '#242424', 'ring' => '#4ADE80',
                    'chart1' => '#4ADE80', 'chart2' => '#60A5FA', 'chart3' => '#A78BFA', 'chart4' => '#FBBF24', 'chart5' => '#2DD4BF',
                    'sidebar' => '#121212', 'sidebarForeground' => '#898989',
                    'sidebarPrimary' => '#006239', 'sidebarPrimaryForeground' => '#DDE8E3',
                    'sidebarAccent' => '#313131', 'sidebarAccentForeground' => '#FAFAFA',
                    'sidebarBorder' => '#292929', 'sidebarRing' => '#4ADE80',
                ],
            ],
            [
                'slug' => 'vercel',
                'name' => 'Vercel',
                'description' => 'Monokrom hitam-putih minimalis khas Vercel — cocok untuk platform developer & tech.',
                'sourceMode' => 'dark',
                'tokens' => [
                    'primary' => '#FFFFFF', 'primaryForeground' => '#000000',
                    'secondary' => '#222222', 'secondaryForeground' => '#FFFFFF',
                    'accent' => '#333333', 'accentForeground' => '#FFFFFF',
                    'background' => '#000000', 'foreground' => '#FFFFFF',
                    'card' => '#090909', 'cardForeground' => '#FFFFFF',
                    'popover' => '#121212', 'popoverForeground' => '#FFFFFF',
                    'muted' => '#1D1D1D', 'mutedForeground' => '#A4A4A4',
                    'destructive' => '#FF5B5B', 'destructiveForeground' => '#000000',
                    'border' => '#242424', 'input' => '#333333', 'ring' => '#A4A4A4',
                    'chart1' => '#FFAE04', 'chart2' => '#2671F4', 'chart3' => '#747474', 'chart4' => '#525252', 'chart5' => '#E4E4E4',
                    'sidebar' => '#121212', 'sidebarForeground' => '#FFFFFF',
                    'sidebarPrimary' => '#FFFFFF', 'sidebarPrimaryForeground' => '#000000',
                    'sidebarAccent' => '#333333', 'sidebarAccentForeground' => '#FFFFFF',
                    'sidebarBorder' => '#333333', 'sidebarRing' => '#A4A4A4',
                ],
            ],
            [
                'slug' => 'twitter',
                'name' => 'Twitter',
                'description' => 'Biru terang di atas hitam pekat khas X/Twitter — cocok untuk platform sosial & media.',
                'sourceMode' => 'dark',
                'tokens' => [
                    'primary' => '#1C9CF0', 'primaryForeground' => '#FFFFFF',
                    'secondary' => '#F0F3F4', 'secondaryForeground' => '#0F1419',
                    'accent' => '#061622', 'accentForeground' => '#1C9CF0',
                    'background' => '#000000', 'foreground' => '#E7E9EA',
                    'card' => '#17181C', 'cardForeground' => '#D9D9D9',
                    'popover' => '#000000', 'popoverForeground' => '#E7E9EA',
                    'muted' => '#181818', 'mutedForeground' => '#72767A',
                    'destructive' => '#F4212E', 'destructiveForeground' => '#FFFFFF',
                    'border' => '#242628', 'input' => '#22303C', 'ring' => '#1DA1F2',
                    'chart1' => '#1E9DF1', 'chart2' => '#00B87A', 'chart3' => '#F7B928', 'chart4' => '#17BF63', 'chart5' => '#E0245E',
                    'sidebar' => '#17181C', 'sidebarForeground' => '#D9D9D9',
                    'sidebarPrimary' => '#1DA1F2', 'sidebarPrimaryForeground' => '#FFFFFF',
                    'sidebarAccent' => '#061622', 'sidebarAccentForeground' => '#1C9CF0',
                    'sidebarBorder' => '#38444D', 'sidebarRing' => '#1DA1F2',
                ],
            ],
            [
                'slug' => 'perpetuity',
                'name' => 'Perpetuity',
                'description' => 'Teal kalem & tenang — cocok untuk healthcare, klinik, layanan profesional.',
                'sourceMode' => 'light',
                'tokens' => [
                    'primary' => '#06858E', 'primaryForeground' => '#FFFFFF',
                    'secondary' => '#D9EAEA', 'secondaryForeground' => '#0A4A55',
                    'accent' => '#C9E5E7', 'accentForeground' => '#0A4A55',
                    'background' => '#E8F0F0', 'foreground' => '#0A4A55',
                    'card' => '#F2F7F7', 'cardForeground' => '#0A4A55',
                    'popover' => '#F2F7F7', 'popoverForeground' => '#0A4A55',
                    'muted' => '#E0EAEA', 'mutedForeground' => '#427A7E',
                    'destructive' => '#D13838', 'destructiveForeground' => '#FFFFFF',
                    'border' => '#CDE0E2', 'input' => '#D9EAEA', 'ring' => '#06858E',
                    'chart1' => '#06858E', 'chart2' => '#1E9EA6', 'chart3' => '#37B6BE', 'chart4' => '#5DC7CE', 'chart5' => '#8AD8DD',
                    'sidebar' => '#DAEBED', 'sidebarForeground' => '#0A4A55',
                    'sidebarPrimary' => '#06858E', 'sidebarPrimaryForeground' => '#FFFFFF',
                    'sidebarAccent' => '#C9E5E7', 'sidebarAccentForeground' => '#0A4A55',
                    'sidebarBorder' => '#CDE0E2', 'sidebarRing' => '#06858E',
                ],
            ],
            [
                'slug' => 'caffein',
                'name' => 'Caffein',
                'description' => 'Coklat hangat & krem lembut — cocok untuk cafe, bakery, coffee shop.',
                'sourceMode' => 'light',
                'tokens' => [
                    'primary' => '#644A40', 'primaryForeground' => '#FFFFFF',
                    'secondary' => '#FFDFB5', 'secondaryForeground' => '#582D1D',
                    'accent' => '#E8E8E8', 'accentForeground' => '#202020',
                    'background' => '#F9F9F9', 'foreground' => '#202020',
                    'card' => '#FCFCFC', 'cardForeground' => '#202020',
                    'popover' => '#FCFCFC', 'popoverForeground' => '#202020',
                    'muted' => '#EFEFEF', 'mutedForeground' => '#646464',
                    'destructive' => '#E54D2E', 'destructiveForeground' => '#FFFFFF',
                    'border' => '#D8D8D8', 'input' => '#D8D8D8', 'ring' => '#644A40',
                    'chart1' => '#644A40', 'chart2' => '#FFDFB5', 'chart3' => '#E8E8E8', 'chart4' => '#FFE6C4', 'chart5' => '#66493E',
                    'sidebar' => '#FBFBFB', 'sidebarForeground' => '#252525',
                    'sidebarPrimary' => '#343434', 'sidebarPrimaryForeground' => '#FBFBFB',
                    'sidebarAccent' => '#F7F7F7', 'sidebarAccentForeground' => '#343434',
                    'sidebarBorder' => '#EBEBEB', 'sidebarRing' => '#B5B5B5',
                ],
            ],
        ];

        $result = [];
        foreach ($defs as $d) {
            $isDarkSource = $d['sourceMode'] === 'dark';
            $sourceTokens = $this->completeSourceMode($d['tokens']);
            $generatedTokens = $this->generateMissingMode($d['tokens'], $isDarkSource ? 'light' : 'dark');

            $result[] = [
                'slug' => $d['slug'],
                'name' => $d['name'],
                'description' => $d['description'],
                'primary' => $d['tokens']['primary'],
                'secondary' => $d['tokens']['secondary'],
                'accent' => $d['tokens']['accent'],
                'is_dark' => $isDarkSource,
                'light_tokens' => $isDarkSource ? $generatedTokens : $sourceTokens,
                'dark_tokens' => $isDarkSource ? $sourceTokens : $generatedTokens,
            ];
        }

        return $result;
    }
}
