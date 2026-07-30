<?php

namespace Database\Factories;

use App\Models\RoleTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<RoleTemplate>
 */
class RoleTemplateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->unique()->word();

        return [
            'key' => Str::slug($name, '_'),
            'name' => Str::title($name),
            'description' => $this->faker->sentence(),
            'icon' => 'ShieldCheck',
            'color' => 'muted',
            'is_core' => false,
            'permissions' => [],
            'store_type_codes' => ['*'],
            'sort_order' => 0,
        ];
    }

    /** Template inti — tidak bisa dihapus/rename. */
    public function core(): static
    {
        return $this->state(fn () => ['is_core' => true]);
    }

    /** Template dengan akses penuh (wildcard). */
    public function grantsAll(): static
    {
        return $this->state(fn () => ['permissions' => ['*']]);
    }

    /**
     * Template yang hanya berlaku di tipe toko tertentu.
     *
     * @param  array<int, string>  $codes
     */
    public function forStoreTypes(array $codes): static
    {
        return $this->state(fn () => ['store_type_codes' => $codes]);
    }
}
