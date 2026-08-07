<?php

use App\Models\Plan;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Plan::firstOrCreate(
        ['code' => 'free'],
        ['label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );

    $this->withoutMiddleware(ValidateCsrfToken::class);
});

function registrationPayload(array $overrides = []): array
{
    return array_merge([
        'email' => fake()->unique()->safeEmail(),
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
        'honeypot_token' => encrypt(now()->subSeconds(10)->timestamp),
    ], $overrides);
}

it('silently redirects when honeypot field is filled', function () {
    $response = $this->post('/register', registrationPayload([
        'website' => 'http://spam-bot.example.com',
    ]));

    $response->assertRedirect(route('register'));
    $this->assertDatabaseCount('users', 0);
});

it('rejects registration submitted too quickly', function () {
    $freshToken = encrypt(now()->timestamp);

    $response = $this->post('/register', registrationPayload([
        'honeypot_token' => $freshToken,
    ]));

    $response->assertRedirect();
    $response->assertSessionHasErrors('email');
    $this->assertDatabaseCount('users', 0);
});

it('allows valid registration with an old honeypot token', function () {
    $email = fake()->unique()->safeEmail();

    $response = $this->post('/register', registrationPayload(['email' => $email]));

    $response->assertRedirect(route('onboarding'));
    $this->assertDatabaseHas('users', ['email' => $email]);
});

it('creates user with the free plan on successful registration', function () {
    $email = fake()->unique()->safeEmail();

    $this->post('/register', registrationPayload(['email' => $email]));

    $freePlan = Plan::where('code', 'free')->first();
    $this->assertDatabaseHas('users', [
        'email' => $email,
        'plan_id' => $freePlan->id,
    ]);
});
