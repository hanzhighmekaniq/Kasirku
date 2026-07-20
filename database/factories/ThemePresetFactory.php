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
        return [
            'user_id' => User::factory(),
            'name' => fake()->unique()->safeColorName().' Theme',
            'primary' => '#'.fake()->hexColor(),
            'secondary' => '#'.fake()->hexColor(),
            'accent' => '#'.fake()->hexColor(),
            'is_dark' => fake()->boolean(20),
            'is_system' => false,
        ];
    }
}
