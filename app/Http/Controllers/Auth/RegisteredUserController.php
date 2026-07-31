<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use App\Services\StoreOnboardingService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        $storeTypes = StoreType::where('is_active', true)
            ->orderBy('sort_order')
            ->with([
                'businessTemplates' => fn ($q) => $q
                    ->ready()
                    ->active()
                    ->ordered(),
            ])
            ->get()
            ->map(fn (StoreType $type) => [
                'id' => $type->id,
                'code' => $type->code,
                'label' => $type->label,
                'icon' => $type->icon,
                'description' => $type->description,
                'business_templates' => $type->businessTemplates->map(fn ($t) => [
                    'code' => $t->code,
                    'label' => $t->label,
                    'icon' => $t->icon,
                    'description' => $t->description,
                ])->values(),
            ])
            ->values();

        return Inertia::render('Auth/Register', [
            'storeTypes' => $storeTypes,
            'plans' => Store::allPlans(),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'store_type_id' => ['required', 'integer', 'exists:store_types,id'],
            'business_template_code' => ['nullable', 'string', 'exists:business_templates,code'],
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
        ]);

        $user = DB::transaction(fn () => app(StoreOnboardingService::class)->register(
            account: [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ],
            storeTypeId: $validated['store_type_id'],
            businessTemplateCode: $validated['business_template_code'] ?? null,
            planId: $validated['plan_id'],
        ));

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('admin.dashboard', absolute: false));
    }
}
