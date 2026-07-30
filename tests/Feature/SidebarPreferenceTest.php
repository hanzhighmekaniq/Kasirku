<?php

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user bisa menyimpan preferensi layout sidebar lengkap', function () {
    $user = User::factory()->create(['is_developer' => true]);

    $payload = [
        'groups' => ['loyalty', 'purchasing', 'transaction'],
        'items' => [
            'purchasing' => ['suppliers', 'purchases'],
        ],
        'placement' => [
            'promotions' => 'purchasing',
        ],
    ];

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($user)
        ->patch('/app/sidebar-preference', $payload);

    $response->assertOk()->assertJson(['success' => true]);
    $this->assertEquals($payload, $user->refresh()->sidebar_preference);
});

test('preferensi kosong tetap valid dan tersimpan sebagai array kosong', function () {
    $user = User::factory()->create(['is_developer' => true]);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($user)
        ->patch('/app/sidebar-preference', [
            'groups' => [],
            'items' => [],
            'placement' => [],
        ]);

    $response->assertOk()->assertJson(['success' => true]);
    $this->assertEquals(
        ['groups' => [], 'items' => [], 'placement' => []],
        $user->refresh()->sidebar_preference,
    );
});

test('bentuk tidak valid ditolak', function () {
    $user = User::factory()->create(['is_developer' => true]);

    // `groups` harus array of string, bukan array bersarang.
    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($user)
        ->patch('/app/sidebar-preference', [
            'groups' => [['nested' => 'not-a-string']],
        ]);

    $response->assertSessionHasErrors('groups.0');
    $this->assertNull($user->refresh()->sidebar_preference);
});

test('guest tidak bisa menyimpan preferensi sidebar', function () {
    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->patch('/app/sidebar-preference', [
            'groups' => ['home'],
        ]);

    $response->assertRedirect('/login');
});

test('preferensi sidebar terisolasi antar user', function () {
    $userA = User::factory()->create(['is_developer' => true]);
    $userB = User::factory()->create(['is_developer' => true]);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($userA)
        ->patch('/app/sidebar-preference', [
            'groups' => ['home', 'system'],
        ])
        ->assertOk();

    expect($userA->refresh()->sidebar_preference)->toBe([
        'groups' => ['home', 'system'],
    ]);
    expect($userB->refresh()->sidebar_preference)->toBeNull();
});
