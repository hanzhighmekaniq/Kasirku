<?php

namespace Tests\Feature;

use App\Models\ThemePreset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThemePreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_save_builtin_template_preference(): void
    {
        $user = User::factory()->create(['is_developer' => true]);
        ThemePreset::factory()->create(['user_id' => null, 'is_system' => true, 'slug' => 'violet']);

        $response = $this
            ->actingAs($user)
            ->patch('/app/theme-preference', [
                'templateId' => 'violet',
                'mode' => 'dark',
                'custom' => null,
            ]);

        $response->assertOk()->assertJson(['success' => true]);

        $this->assertEquals(
            ['templateId' => 'violet', 'mode' => 'dark', 'custom' => null],
            $user->refresh()->theme_preference,
        );
    }

    public function test_user_can_save_custom_theme_preference(): void
    {
        $user = User::factory()->create(['is_developer' => true]);

        $payload = [
            'templateId' => 'custom',
            'mode' => 'light',
            'custom' => [
                'primary' => '#FF5733',
                'secondary' => '#64748B',
                'accent' => '#FFA07A',
            ],
        ];

        $response = $this
            ->actingAs($user)
            ->patch('/app/theme-preference', $payload);

        $response->assertOk()->assertJson(['success' => true]);
        $this->assertEquals($payload, $user->refresh()->theme_preference);
    }

    public function test_invalid_template_id_is_rejected(): void
    {
        $user = User::factory()->create(['is_developer' => true]);

        $response = $this
            ->actingAs($user)
            ->patch('/app/theme-preference', [
                'templateId' => 'not-a-real-template',
                'mode' => 'light',
                'custom' => null,
            ]);

        $response->assertSessionHasErrors('templateId');
        $this->assertNull($user->refresh()->theme_preference);
    }

    public function test_guest_cannot_save_theme_preference(): void
    {
        ThemePreset::factory()->create(['user_id' => null, 'is_system' => true, 'slug' => 'violet']);

        $response = $this->patch('/app/theme-preference', [
            'templateId' => 'violet',
            'mode' => 'light',
            'custom' => null,
        ]);

        $response->assertRedirect('/login');
    }
}
