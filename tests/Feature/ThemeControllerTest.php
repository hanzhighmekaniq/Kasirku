<?php

namespace Tests\Feature;

use App\Models\ThemePreset;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CRUD tema custom (Admin\ThemeController) + proteksi is_system.
 * Preset dengan is_system = true adalah tema built-in bawaan aplikasi dan
 * tidak boleh bisa diubah/dihapus oleh user manapun (termasuk owner).
 *
 * Struktur data sekarang: 1 row per tema, kolom `tokens` JSON berbentuk
 * {light: {...36 keys}, dark: {...36 keys}} — bukan kolom primary/
 * secondary/accent/is_dark/light_tokens/dark_tokens terpisah lagi.
 */
class ThemeControllerTest extends TestCase
{
    use RefreshDatabase;

    /** Token set minimal (subset) untuk payload test — cukup untuk lolos validasi. */
    private function sampleTokens(string $primary = '#FF5733'): array
    {
        return [
            'primary' => $primary,
            'background' => '#FFFFFF',
            'foreground' => '#0F172A',
        ];
    }

    public function test_index_lists_own_presets_only(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $other = User::factory()->create(['is_developer' => true]);

        $own = ThemePreset::factory()->create(['user_id' => $user->id, 'is_system' => false]);
        $others = ThemePreset::factory()->create(['user_id' => $other->id, 'is_system' => false]);

        $response = $this->actingAs($user)->get('/app/themes');

        $response->assertOk();
        $userIds = collect($response->viewData('page')['props']['userThemes'])->pluck('id');

        $this->assertTrue($userIds->contains($own->id));
        $this->assertFalse($userIds->contains($others->id));
    }

    public function test_user_can_create_custom_theme(): void
    {
        $user = User::factory()->create(['is_developer' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->post('/app/themes', [
                'name' => 'Tema Toko Saya',
                'description' => 'Tema custom milik saya',
                'light_tokens' => $this->sampleTokens('#FF5733'),
                'dark_tokens' => $this->sampleTokens('#FF5733'),
            ]);

        $response->assertRedirect(route('admin.themes.index'));
        $this->assertDatabaseHas('theme_presets', [
            'user_id' => $user->id,
            'name' => 'Tema Toko Saya',
            'is_system' => false,
        ]);

        $theme = ThemePreset::where('name', 'Tema Toko Saya')->first();
        $this->assertEquals('#FF5733', $theme->tokens['light']['primary']);
    }

    public function test_user_can_update_own_custom_theme(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $theme = ThemePreset::factory()->create(['user_id' => $user->id, 'is_system' => false]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->put("/app/themes/{$theme->id}", [
                'name' => 'Tema Baru',
                'description' => null,
                'light_tokens' => $this->sampleTokens('#111111'),
                'dark_tokens' => $this->sampleTokens('#222222'),
            ]);

        $response->assertRedirect(route('admin.themes.index'));
        $this->assertDatabaseHas('theme_presets', [
            'id' => $theme->id,
            'name' => 'Tema Baru',
        ]);

        $theme->refresh();
        $this->assertEquals('#111111', $theme->tokens['light']['primary']);
        $this->assertEquals('#222222', $theme->tokens['dark']['primary']);
    }

    public function test_user_can_delete_own_custom_theme(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $theme = ThemePreset::factory()->create(['user_id' => $user->id, 'is_system' => false]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->delete("/app/themes/{$theme->id}");

        $response->assertRedirect(route('admin.themes.index'));
        $this->assertDatabaseMissing('theme_presets', ['id' => $theme->id]);
    }

    public function test_user_cannot_update_system_theme(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $system = ThemePreset::factory()->create(['user_id' => null, 'is_system' => true, 'name' => 'Ocean Blue']);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->put("/app/themes/{$system->id}", [
                'name' => 'Hacked Name',
                'light_tokens' => $this->sampleTokens('#000000'),
                'dark_tokens' => $this->sampleTokens('#000000'),
            ]);

        $response->assertSessionHasErrors('theme');
        $this->assertDatabaseHas('theme_presets', [
            'id' => $system->id,
            'name' => 'Ocean Blue',
        ]);
    }

    public function test_owner_cannot_delete_system_theme(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $system = ThemePreset::factory()->create(['user_id' => null, 'is_system' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->delete("/app/themes/{$system->id}");

        $response->assertSessionHasErrors('theme');
        $this->assertDatabaseHas('theme_presets', ['id' => $system->id]);
    }

    public function test_user_cannot_update_other_users_theme(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $other = User::factory()->create(['is_developer' => true]);
        $theme = ThemePreset::factory()->create(['user_id' => $other->id, 'is_system' => false]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->put("/app/themes/{$theme->id}", [
                'name' => 'Hijack',
                'light_tokens' => $this->sampleTokens('#000000'),
                'dark_tokens' => $this->sampleTokens('#000000'),
            ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_delete_other_users_theme(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        $other = User::factory()->create(['is_developer' => true]);
        $theme = ThemePreset::factory()->create(['user_id' => $other->id, 'is_system' => false]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->delete("/app/themes/{$theme->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('theme_presets', ['id' => $theme->id]);
    }

    public function test_create_validates_required_fields(): void
    {
        $user = User::factory()->create(['is_developer' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->post('/app/themes', [
                'name' => '',
                'light_tokens' => ['primary' => 'not-a-hex-color'],
                'dark_tokens' => $this->sampleTokens(),
            ]);

        $response->assertSessionHasErrors(['name', 'light_tokens.primary']);
    }
}
