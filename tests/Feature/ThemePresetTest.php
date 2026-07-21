<?php

namespace Tests\Feature;

use App\Models\ThemePreset;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Quick custom preset (3 warna dasar) — endpoint legacy di
 * ThemePresetController. Sejak restructure, primary/secondary/accent tidak
 * lagi kolom terpisah, jadi verifikasi warna dicek dari kolom `tokens`
 * (light) bukan assertDatabaseHas kolom primary langsung.
 */
class ThemePresetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_save_theme_preset(): void
    {
        $user = User::factory()->create(['is_developer' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->post('/app/theme-presets', [
                'name' => 'Tema Toko A',
                'primary' => '#FF5733',
                'secondary' => '#64748B',
                'accent' => '#FFA07A',
            ]);

        $response->assertOk()->assertJson(['success' => true]);
        $this->assertDatabaseHas('theme_presets', [
            'user_id' => $user->id,
            'name' => 'Tema Toko A',
        ]);

        $preset = ThemePreset::where('name', 'Tema Toko A')->first();
        $this->assertEquals('#FF5733', $preset->tokens['light']['primary']);
    }

    public function test_user_can_delete_own_preset(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $preset = ThemePreset::factory()->create(['user_id' => $user->id]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->delete("/app/theme-presets/{$preset->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('theme_presets', ['id' => $preset->id]);
    }

    public function test_user_cannot_delete_other_users_preset(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $other = User::factory()->create(['is_developer' => true]);
        $preset = ThemePreset::factory()->create(['user_id' => $other->id]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->delete("/app/theme-presets/{$preset->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('theme_presets', ['id' => $preset->id]);
    }

    public function test_invalid_preset_name_is_rejected(): void
    {
        $user = User::factory()->create(['is_developer' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->post('/app/theme-presets', [
                'name' => '',
                'primary' => '#FF5733',
                'secondary' => '#64748B',
                'accent' => '#FFA07A',
            ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_owner_cannot_delete_system_preset(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $preset = ThemePreset::factory()->create([
            'user_id' => null,
            'is_system' => true,
        ]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->delete("/app/theme-presets/{$preset->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('theme_presets', ['id' => $preset->id]);
    }

    public function test_saved_preset_is_never_marked_system(): void
    {
        $user = User::factory()->create(['is_developer' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->post('/app/theme-presets', [
                'name' => 'Tema Toko B',
                'primary' => '#FF5733',
                'secondary' => '#64748B',
                'accent' => '#FFA07A',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('theme_presets', [
            'name' => 'Tema Toko B',
            'is_system' => false,
        ]);
    }
}
