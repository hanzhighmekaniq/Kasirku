<?php

namespace Tests\Feature;

use App\Models\ThemePreset;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThemePreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_save_builtin_template_preference(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        ThemePreset::factory()->create(['user_id' => null, 'is_system' => true, 'slug' => 'violet']);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->patch('/app/theme-preference', [
                'templateId' => 'violet',
                'mode' => 'dark',
            ]);

        $response->assertOk()->assertJson(['success' => true]);

        $this->assertEquals(
            ['templateId' => 'violet', 'mode' => 'dark'],
            $user->refresh()->theme_preference,
        );
    }

    public function test_user_can_save_custom_theme_preference(): void
    {
        $user = User::factory()->create(['is_developer' => true]);

        $lightTokens = [
            'primary' => '#FF5733', 'primaryForeground' => '#FFFFFF',
            'background' => '#F8FAFC', 'foreground' => '#0F172A',
            'card' => '#FFFFFF', 'cardForeground' => '#0F172A',
        ];
        $darkTokens = [
            'primary' => '#FF5733', 'primaryForeground' => '#FFFFFF',
            'background' => '#0F172A', 'foreground' => '#F8FAFC',
            'card' => '#1F2937', 'cardForeground' => '#F8FAFC',
        ];

        $payload = [
            'templateId' => 'custom',
            'mode' => 'light',
            'customTokens' => [
                'light' => $lightTokens,
                'dark' => $darkTokens,
            ],
        ];

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->patch('/app/theme-preference', $payload);

        $response->assertOk()->assertJson(['success' => true]);
        $this->assertEquals($payload, $user->refresh()->theme_preference);
    }

    public function test_invalid_template_id_is_rejected(): void
    {
        $user = User::factory()->create(['is_developer' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($user)
            ->patch('/app/theme-preference', [
                'templateId' => 'not-a-real-template',
                'mode' => 'light',
            ]);

        $response->assertSessionHasErrors('templateId');
        $this->assertNull($user->refresh()->theme_preference);
    }

    public function test_guest_cannot_save_theme_preference(): void
    {
        ThemePreset::factory()->create(['user_id' => null, 'is_system' => true, 'slug' => 'violet']);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->patch('/app/theme-preference', [
                'templateId' => 'violet',
                'mode' => 'light',
            ]);

        $response->assertRedirect('/login');
    }
}
