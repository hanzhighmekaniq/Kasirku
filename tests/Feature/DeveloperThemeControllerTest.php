<?php

namespace Tests\Feature;

use App\Models\ThemePreset;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CRUD tema custom di panel Developer (Developer\ThemeController).
 *
 * Halaman ini personal per-akun developer: preset sistem (is_system = true)
 * hanya bisa dipakai, tidak boleh bisa diubah/dihapus dari sini. Non-developer
 * harus ditolak oleh DeveloperMiddleware.
 */
class DeveloperThemeControllerTest extends TestCase
{
    use RefreshDatabase;

    /** Token set minimal — cukup untuk lolos validasi controller. */
    private function sampleTokens(string $primary = '#FF5733'): array
    {
        return [
            'primary' => $primary,
            'background' => '#FFFFFF',
            'foreground' => '#0F172A',
        ];
    }

    private function developer(): User
    {
        return User::factory()->create(['is_developer' => true]);
    }

    public function test_index_lists_own_custom_themes_only(): void
    {
        $user = $this->developer();
        $other = $this->developer();

        $own = ThemePreset::factory()->create(['user_id' => $user->id, 'is_system' => false]);
        $foreign = ThemePreset::factory()->create(['user_id' => $other->id, 'is_system' => false]);
        $system = ThemePreset::factory()->create(['user_id' => null, 'is_system' => true]);

        $response = $this->actingAs($user)->get('/developer/themes');

        $response->assertOk();
        $ids = collect($response->viewData('page')['props']['userThemes'])->pluck('id');

        $this->assertTrue($ids->contains($own->id));
        $this->assertFalse($ids->contains($foreign->id));
        $this->assertFalse($ids->contains($system->id));
    }

    public function test_non_developer_cannot_access(): void
    {
        $user = User::factory()->create(['is_developer' => false]);

        $this->actingAs($user)->get('/developer/themes')->assertStatus(403);
    }

    public function test_developer_can_create_custom_theme(): void
    {
        $user = $this->developer();

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->post('/developer/themes', [
                'name' => 'Tema Developer',
                'description' => 'Palet khusus panel developer',
                'light_tokens' => $this->sampleTokens('#FF5733'),
                'dark_tokens' => $this->sampleTokens('#111827'),
            ]);

        $response->assertRedirect(route('developer.themes.index'));
        $this->assertDatabaseHas('theme_presets', [
            'user_id' => $user->id,
            'name' => 'Tema Developer',
            'is_system' => false,
        ]);

        $theme = ThemePreset::where('name', 'Tema Developer')->first();
        $this->assertEquals('#FF5733', $theme->tokens['light']['primary']);
        $this->assertEquals('#111827', $theme->tokens['dark']['primary']);
    }

    public function test_developer_can_update_own_theme(): void
    {
        $user = $this->developer();
        $theme = ThemePreset::factory()->create(['user_id' => $user->id, 'is_system' => false]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->put("/developer/themes/{$theme->id}", [
                'name' => 'Tema Diperbarui',
                'description' => null,
                'light_tokens' => $this->sampleTokens('#123456'),
                'dark_tokens' => $this->sampleTokens('#654321'),
            ]);

        $response->assertRedirect(route('developer.themes.index'));

        $theme->refresh();
        $this->assertEquals('Tema Diperbarui', $theme->name);
        $this->assertEquals('#123456', $theme->tokens['light']['primary']);
        $this->assertEquals('#654321', $theme->tokens['dark']['primary']);
    }

    public function test_developer_can_delete_own_theme(): void
    {
        $user = $this->developer();
        $theme = ThemePreset::factory()->create(['user_id' => $user->id, 'is_system' => false]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->delete("/developer/themes/{$theme->id}");

        $response->assertRedirect(route('developer.themes.index'));
        $this->assertDatabaseMissing('theme_presets', ['id' => $theme->id]);
    }

    public function test_system_theme_cannot_be_updated(): void
    {
        $user = $this->developer();
        $system = ThemePreset::factory()->create([
            'user_id' => null,
            'is_system' => true,
            'name' => 'Caffein',
        ]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->put("/developer/themes/{$system->id}", [
                'name' => 'Nama Diretas',
                'light_tokens' => $this->sampleTokens('#000000'),
                'dark_tokens' => $this->sampleTokens('#000000'),
            ]);

        $response->assertSessionHasErrors('theme');
        $this->assertDatabaseHas('theme_presets', [
            'id' => $system->id,
            'name' => 'Caffein',
        ]);
    }

    public function test_system_theme_cannot_be_deleted(): void
    {
        $user = $this->developer();
        $system = ThemePreset::factory()->create(['user_id' => null, 'is_system' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->delete("/developer/themes/{$system->id}");

        $response->assertSessionHasErrors('theme');
        $this->assertDatabaseHas('theme_presets', ['id' => $system->id]);
    }

    public function test_system_theme_edit_page_redirects_with_error(): void
    {
        $user = $this->developer();
        $system = ThemePreset::factory()->create(['user_id' => null, 'is_system' => true]);

        $response = $this->actingAs($user)->get("/developer/themes/{$system->id}/edit");

        $response->assertRedirect(route('developer.themes.index'));
        $response->assertSessionHasErrors('theme');
    }

    public function test_cannot_touch_other_developers_theme(): void
    {
        $user = $this->developer();
        $other = $this->developer();
        $theme = ThemePreset::factory()->create(['user_id' => $other->id, 'is_system' => false]);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->put("/developer/themes/{$theme->id}", [
                'name' => 'Hijack',
                'light_tokens' => $this->sampleTokens('#000000'),
                'dark_tokens' => $this->sampleTokens('#000000'),
            ])
            ->assertStatus(403);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->delete("/developer/themes/{$theme->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('theme_presets', ['id' => $theme->id]);
    }

    public function test_create_validates_required_fields(): void
    {
        $user = $this->developer();

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->post('/developer/themes', [
                'name' => '',
                'light_tokens' => ['primary' => 'bukan-hex'],
                'dark_tokens' => $this->sampleTokens(),
            ]);

        $response->assertSessionHasErrors(['name', 'light_tokens.primary']);
    }
}
