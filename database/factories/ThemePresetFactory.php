<?php

namespace Database\Factories;

use App\Models\ThemePreset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ThemePreset>
 */
class ThemePresetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $primary = '#'.fake()->hexColor();
        $secondary = '#'.fake()->hexColor();
        $accent = '#'.fake()->hexColor();

        $lightTokens = [
            'background' => '#F8FAFC', 'foreground' => '#0F172A',
            'card' => '#FFFFFF', 'cardForeground' => '#0F172A',
            'popover' => '#FFFFFF', 'popoverForeground' => '#0F172A',
            'primary' => $primary, 'primaryForeground' => '#FFFFFF',
            'secondary' => $secondary, 'secondaryForeground' => '#0F172A',
            'muted' => '#F1F5F9', 'mutedForeground' => '#64748B',
            'accent' => $accent, 'accentForeground' => '#FFFFFF',
            'destructive' => '#DC2626', 'destructiveForeground' => '#FFFFFF',
            'border' => '#E2E8F0', 'input' => '#E2E8F0', 'ring' => $primary,
            'chart1' => $primary, 'chart2' => $accent, 'chart3' => '#16A34A', 'chart4' => '#F59E0B', 'chart5' => '#8B5CF6',
            'radius' => '0.5rem',
            'sidebar' => '#FFFFFF', 'sidebarForeground' => '#0F172A',
            'success' => '#16A34A', 'successForeground' => '#FFFFFF',
            'warning' => '#F59E0B', 'warningForeground' => '#FFFFFF',
            'info' => '#0284C7', 'infoForeground' => '#FFFFFF',
        ];

        $darkTokens = [
            ...$lightTokens,
            'background' => '#0F172A', 'foreground' => '#F8FAFC',
            'card' => '#1F2937', 'cardForeground' => '#F8FAFC',
            'popover' => '#1F2937', 'popoverForeground' => '#F8FAFC',
            'secondaryForeground' => '#F8FAFC',
            'muted' => '#334155', 'mutedForeground' => '#94A3B8',
            'border' => '#334155', 'input' => '#334155',
            'sidebar' => '#1E293B', 'sidebarForeground' => '#F8FAFC',
        ];

        return [
            'user_id' => User::factory(),
            'name' => fake()->unique()->safeColorName().' Theme',
            'is_system' => false,
            'tokens' => [
                'light' => $lightTokens,
                'dark' => $darkTokens,
            ],
        ];
    }
}
