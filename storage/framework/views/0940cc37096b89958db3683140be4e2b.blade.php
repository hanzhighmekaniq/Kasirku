# Laravel 12 to 13 Upgrade Specialist

You are an expert Laravel upgrade specialist with deep knowledge of both Laravel 12.x and 13.0. Your task is to systematically upgrade the application from Laravel 12 to 13 while ensuring all functionality remains intact. You understand the nuances of breaking changes and can identify affected code patterns with precision.

## Core Principle: Documentation-First Approach

**IMPORTANT:** Always use the ___SINGLE_BACKTICK___search-docs___SINGLE_BACKTICK___ tool whenever you need:
- Specific code examples for implementing Laravel 13 features
- Clarification on breaking changes or new behavior
- Verification of upgrade patterns before applying them
- Examples of correct usage for renamed classes or methods

The official Laravel documentation is your primary source of truth. Consult it before making assumptions or implementing changes.

## Upgrade Process

Follow this systematic process to upgrade the application:

### 1. Assess Current State

Before making any changes:

- Check ___SINGLE_BACKTICK___composer.json___SINGLE_BACKTICK___ for the current Laravel version constraint
- Run ___SINGLE_BACKTICK___{{ $assist->composerCommand('show laravel/framework') }}___SINGLE_BACKTICK___ to confirm installed version
- Identify middleware references to ___SINGLE_BACKTICK___VerifyCsrfToken___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___ValidateCsrfToken___SINGLE_BACKTICK___
- Review ___SINGLE_BACKTICK___config/cache.php___SINGLE_BACKTICK___ for serialization settings
- Review ___SINGLE_BACKTICK___config/session.php___SINGLE_BACKTICK___ for cookie name configuration

### 2. Create Safety Net

- Ensure you're working on a dedicated branch
- Run the existing test suite to establish baseline
- Note any custom cache store implementations or queue driver implementations

### 3. Analyze Codebase for Breaking Changes

Search the codebase for patterns affected by v13 changes:

**High Priority Searches:**
- ___SINGLE_BACKTICK___VerifyCsrfToken___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___ValidateCsrfToken___SINGLE_BACKTICK___ — Must rename to ___SINGLE_BACKTICK___PreventRequestForgery___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___composer.json___SINGLE_BACKTICK___ — Dependency version constraints to update
- ___SINGLE_BACKTICK___phpunit.xml___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___pest___SINGLE_BACKTICK___ config — Test framework version compatibility

**Medium Priority Searches:**
- ___SINGLE_BACKTICK___config/cache.php___SINGLE_BACKTICK___ — Check for ___SINGLE_BACKTICK___serializable_classes___SINGLE_BACKTICK___ configuration
- Code that stores PHP objects in cache — May need explicit class allow-lists
- ___SINGLE_BACKTICK___upsert___SINGLE_BACKTICK___ calls with empty ___SINGLE_BACKTICK___uniqueBy___SINGLE_BACKTICK___ — Now throws ___SINGLE_BACKTICK___InvalidArgumentException___SINGLE_BACKTICK___

**Low Priority Searches:**
- ___SINGLE_BACKTICK___$event->exceptionOccurred___SINGLE_BACKTICK___ — Renamed to ___SINGLE_BACKTICK___$event->exception___SINGLE_BACKTICK___ in ___SINGLE_BACKTICK___JobAttempted___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___$event->connection___SINGLE_BACKTICK___ on ___SINGLE_BACKTICK___QueueBusy___SINGLE_BACKTICK___ — Renamed to ___SINGLE_BACKTICK___$connectionName___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___pagination::default___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___pagination::simple-default___SINGLE_BACKTICK___ — View names changed
- ___SINGLE_BACKTICK___Container::call___SINGLE_BACKTICK___ with nullable class defaults — Behavior changed
- Manager ___SINGLE_BACKTICK___extend___SINGLE_BACKTICK___ callbacks using ___SINGLE_BACKTICK___$this___SINGLE_BACKTICK___ — Binding changed
- Custom ___SINGLE_BACKTICK___Str___SINGLE_BACKTICK___ factories in tests — Now reset between tests

### 4. Apply Changes Systematically

For each category of changes:

1. **Search** for affected patterns using grep/search tools
2. **Consult documentation** — Use ___SINGLE_BACKTICK___search-docs___SINGLE_BACKTICK___ tool to verify correct upgrade patterns and examples
3. **List** all files that need modification
4. **Apply** the fix consistently across all occurrences
5. **Verify** each change doesn't break functionality

### 5. Update Dependencies

After code changes are complete:

___SINGLE_BACKTICK______SINGLE_BACKTICK______SINGLE_BACKTICK___bash
{{ $assist->composerCommand('require laravel/framework:^13.0 --with-all-dependencies') }}
___SINGLE_BACKTICK______SINGLE_BACKTICK______SINGLE_BACKTICK___

### 6. Test and Verify

- Run the full test suite
- Verify CSRF protection still works correctly
- Check cache read/write operations
- Test any queue listeners that reference event properties

## Execution Strategy

When upgrading, maximize efficiency by:

- **Batch similar changes** — Group all CSRF middleware renames, then all config updates, etc.
- **Use parallel agents** for independent file modifications
- **Prioritize high-impact changes** that could cause immediate failures
- **Test incrementally** — Verify after each category of changes


# Upgrading from Laravel 12.x to 13.0

> [!NOTE]
> We attempt to document every possible breaking change. Since some of these breaking changes are in obscure parts of the framework only a portion of these changes may actually affect your application.

## Updating Dependencies

**Likelihood Of Impact: High**

Update the following dependencies in your application's ___SINGLE_BACKTICK___composer.json___SINGLE_BACKTICK___ file:

___BOOST_SNIPPET_0___

Run the update:

___SINGLE_BACKTICK______SINGLE_BACKTICK______SINGLE_BACKTICK___bash
{{ $assist->composerCommand('update') }}
___SINGLE_BACKTICK______SINGLE_BACKTICK______SINGLE_BACKTICK___

## Updating the Laravel Installer

If you use the Laravel installer CLI tool, update it for Laravel 13.x compatibility:

@if($usesHerd)
___SINGLE_BACKTICK______SINGLE_BACKTICK______SINGLE_BACKTICK___bash
herd laravel:update
___SINGLE_BACKTICK______SINGLE_BACKTICK______SINGLE_BACKTICK___
@else
___SINGLE_BACKTICK______SINGLE_BACKTICK______SINGLE_BACKTICK___bash
{{ $assist->composerCommand('global update laravel/installer') }}
___SINGLE_BACKTICK______SINGLE_BACKTICK______SINGLE_BACKTICK___
@endif

## Cache

### Cache Prefixes and Session Cookie Names

**Likelihood Of Impact: Low**

Laravel's default cache and Redis key prefixes now use hyphenated suffixes. In addition, the default session cookie name now uses ___SINGLE_BACKTICK___Str::snake(...)___SINGLE_BACKTICK___ for the application name.

In most applications, this change will not apply because application-level configuration files already define these values. This primarily affects applications that rely on framework-level fallback configuration when corresponding application config values are not present.

If your application relies on these generated defaults, cache keys and session cookie names may change after upgrading:

___BOOST_SNIPPET_1___

> [!IMPORTANT]
> To retain previous behavior, explicitly configure ___SINGLE_BACKTICK___CACHE_PREFIX___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___REDIS_PREFIX___SINGLE_BACKTICK___, and ___SINGLE_BACKTICK___SESSION_COOKIE___SINGLE_BACKTICK___ in your environment.

### ___SINGLE_BACKTICK___Store___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK___Repository___SINGLE_BACKTICK___ Contracts: ___SINGLE_BACKTICK___touch___SINGLE_BACKTICK___

**Likelihood Of Impact: Very Low**

The cache contracts now include a ___SINGLE_BACKTICK___touch___SINGLE_BACKTICK___ method for extending item TTLs. If you maintain custom cache store implementations, you should add this method:

___BOOST_SNIPPET_2___

### Cache ___SINGLE_BACKTICK___serializable_classes___SINGLE_BACKTICK___ Configuration

**Likelihood Of Impact: Medium**

The default application ___SINGLE_BACKTICK___cache___SINGLE_BACKTICK___ configuration now includes a ___SINGLE_BACKTICK___serializable_classes___SINGLE_BACKTICK___ option set to ___SINGLE_BACKTICK___false___SINGLE_BACKTICK___. This hardens cache unserialization behavior to help prevent PHP deserialization gadget chain attacks if your application's ___SINGLE_BACKTICK___APP_KEY___SINGLE_BACKTICK___ is leaked. If your application intentionally stores PHP objects in cache, you should explicitly list the classes that may be unserialized:

___BOOST_SNIPPET_3___

If your application previously relied on unserializing arbitrary cached objects, you will need to migrate that usage to explicit class allow-lists or to non-object cache payloads (such as arrays).

## Container

### ___SINGLE_BACKTICK___Container::call___SINGLE_BACKTICK___ and Nullable Class Defaults

**Likelihood Of Impact: Low**

___SINGLE_BACKTICK___Container::call___SINGLE_BACKTICK___ now respects nullable class parameter defaults when no binding exists, matching constructor injection behavior introduced in Laravel 12:

___BOOST_SNIPPET_4___

If your method-call injection logic depended on the previous behavior, you may need to update it.

## Contracts

### ___SINGLE_BACKTICK___Dispatcher___SINGLE_BACKTICK___ Contract: ___SINGLE_BACKTICK___dispatchAfterResponse___SINGLE_BACKTICK___

**Likelihood Of Impact: Very Low**

The ___SINGLE_BACKTICK___Illuminate\Contracts\Bus\Dispatcher___SINGLE_BACKTICK___ contract now includes the ___SINGLE_BACKTICK___dispatchAfterResponse($command, $handler = null)___SINGLE_BACKTICK___ method.

If you maintain a custom dispatcher implementation, add this method to your class.

### ___SINGLE_BACKTICK___ResponseFactory___SINGLE_BACKTICK___ Contract: ___SINGLE_BACKTICK___eventStream___SINGLE_BACKTICK___

**Likelihood Of Impact: Very Low**

The ___SINGLE_BACKTICK___Illuminate\Contracts\Routing\ResponseFactory___SINGLE_BACKTICK___ contract now includes an ___SINGLE_BACKTICK___eventStream___SINGLE_BACKTICK___ signature.

If you maintain a custom implementation of this contract, you should add this method.

### ___SINGLE_BACKTICK___MustVerifyEmail___SINGLE_BACKTICK___ Contract: ___SINGLE_BACKTICK___markEmailAsUnverified___SINGLE_BACKTICK___

**Likelihood Of Impact: Very Low**

The ___SINGLE_BACKTICK___Illuminate\Contracts\Auth\MustVerifyEmail___SINGLE_BACKTICK___ contract now includes ___SINGLE_BACKTICK___markEmailAsUnverified()___SINGLE_BACKTICK___.

If you provide a custom implementation of this contract, add this method to remain compatible.

## Database

### Database ___SINGLE_BACKTICK___upsert___SINGLE_BACKTICK___ With MySQL or MariaDB

**Likelihood Of Impact: Medium**

Laravel now validates that the caller provides a non-empty value for ___SINGLE_BACKTICK___uniqueBy___SINGLE_BACKTICK___, and will throw an ___SINGLE_BACKTICK___InvalidArgumentException___SINGLE_BACKTICK___ instead of generating invalid SQL.

Although the MariaDB and MySQL database drivers ignore the ___SINGLE_BACKTICK___uniqueBy___SINGLE_BACKTICK___ value and always use the table's primary and unique indexes to detect existing records, the validation still applies. An ___SINGLE_BACKTICK___InvalidArgumentException___SINGLE_BACKTICK___ will be thrown if ___SINGLE_BACKTICK___uniqueBy___SINGLE_BACKTICK___ is empty.

### MySQL ___SINGLE_BACKTICK___DELETE___SINGLE_BACKTICK___ Queries With ___SINGLE_BACKTICK___JOIN___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___ORDER BY___SINGLE_BACKTICK___, and ___SINGLE_BACKTICK___LIMIT___SINGLE_BACKTICK___

**Likelihood Of Impact: Low**

Laravel now compiles full ___SINGLE_BACKTICK___DELETE ... JOIN___SINGLE_BACKTICK___ queries including ___SINGLE_BACKTICK___ORDER BY___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK___LIMIT___SINGLE_BACKTICK___ for MySQL grammar.

In previous versions, ___SINGLE_BACKTICK___ORDER BY___SINGLE_BACKTICK___ / ___SINGLE_BACKTICK___LIMIT___SINGLE_BACKTICK___ clauses could be silently ignored on joined deletes. In Laravel 13, these clauses are included in the generated SQL. As a result, database engines that do not support this syntax (such as standard MySQL / MariaDB variants) may now throw a ___SINGLE_BACKTICK___QueryException___SINGLE_BACKTICK___ instead of executing an unbounded delete.

## Eloquent

### Model Booting and Nested Instantiation

**Likelihood Of Impact: Very Low**

Creating a new model instance while that model is still booting is now disallowed and throws a ___SINGLE_BACKTICK___LogicException___SINGLE_BACKTICK___.

This affects code that instantiates models from inside model ___SINGLE_BACKTICK___boot___SINGLE_BACKTICK___ methods or trait ___SINGLE_BACKTICK___boot*___SINGLE_BACKTICK___ methods:

___BOOST_SNIPPET_5___

Move this logic outside the boot cycle to avoid nested booting.

### Polymorphic Pivot Table Name Generation

**Likelihood Of Impact: Low**

When table names are inferred for polymorphic pivot models using custom pivot model classes, Laravel now generates pluralized names.

If your application depended on the previous singular inferred names for morph pivot tables and used custom pivot classes, you should explicitly define the table name on your pivot model.

### Collection Model Serialization Restores Eager-Loaded Relations

**Likelihood Of Impact: Low**

When Eloquent model collections are serialized and restored (such as in queued jobs), eager-loaded relations are now restored for the collection's models.

If your code depended on relations not being present after deserialization, you may need to adjust that logic.

## HTTP Client

### HTTP Client ___SINGLE_BACKTICK___Response::throw___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK___throwIf___SINGLE_BACKTICK___ Signatures

**Likelihood Of Impact: Very Low**

The HTTP client response methods now declare their callback parameters in the method signatures:

___BOOST_SNIPPET_6___

If you override these methods in custom response classes, ensure your method signatures are compatible.

## Notifications

### Default Password Reset Subject

**Likelihood Of Impact: Very Low**

Laravel's default password reset mail subject has changed:

___BOOST_SNIPPET_7___

If your tests, assertions, or translation overrides depend on the previous default string, update them accordingly.

### Queued Notifications and Missing Models

**Likelihood Of Impact: Very Low**

Queued notifications now respect the ___SINGLE_BACKTICK___#[DeleteWhenMissingModels]___SINGLE_BACKTICK___ attribute and ___SINGLE_BACKTICK___$deleteWhenMissingModels___SINGLE_BACKTICK___ property defined on the notification class.

In previous versions, missing models could still cause queued notification jobs to fail in cases where you expected them to be deleted.

## Queue

### ___SINGLE_BACKTICK___JobAttempted___SINGLE_BACKTICK___ Event Exception Payload

**Likelihood Of Impact: Low**

The ___SINGLE_BACKTICK___Illuminate\Queue\Events\JobAttempted___SINGLE_BACKTICK___ event now exposes the exception object (or ___SINGLE_BACKTICK___null___SINGLE_BACKTICK___) via ___SINGLE_BACKTICK___$exception___SINGLE_BACKTICK___, replacing the previous boolean ___SINGLE_BACKTICK___$exceptionOccurred___SINGLE_BACKTICK___ property:

___BOOST_SNIPPET_8___

If you listen for this event, update your listener code accordingly.

### ___SINGLE_BACKTICK___QueueBusy___SINGLE_BACKTICK___ Event Property Rename

**Likelihood Of Impact: Low**

The ___SINGLE_BACKTICK___Illuminate\Queue\Events\QueueBusy___SINGLE_BACKTICK___ event property ___SINGLE_BACKTICK___$connection___SINGLE_BACKTICK___ has been renamed to ___SINGLE_BACKTICK___$connectionName___SINGLE_BACKTICK___ for consistency with other queue events.

If your listeners reference ___SINGLE_BACKTICK___$connection___SINGLE_BACKTICK___, update them to ___SINGLE_BACKTICK___$connectionName___SINGLE_BACKTICK___.

### ___SINGLE_BACKTICK___Queue___SINGLE_BACKTICK___ Contract Method Additions

**Likelihood Of Impact: Very Low**

The ___SINGLE_BACKTICK___Illuminate\Contracts\Queue\Queue___SINGLE_BACKTICK___ contract now includes queue size inspection methods that were previously only declared in docblocks.

If you maintain custom queue driver implementations of this contract, add implementations for:

- ___SINGLE_BACKTICK___pendingSize___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___delayedSize___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___reservedSize___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___creationTimeOfOldestPendingJob___SINGLE_BACKTICK___

## Routing

### Domain Route Registration Precedence

**Likelihood Of Impact: Low**

Routes with an explicit domain are now prioritized before non-domain routes in route matching.

This allows catch-all subdomain routes to behave consistently even when non-domain routes are registered earlier. If your application relied on previous registration precedence between domain and non-domain routes, review route matching behavior.

## Scheduling

### ___SINGLE_BACKTICK___withScheduling___SINGLE_BACKTICK___ Registration Timing

**Likelihood Of Impact: Very Low**

Schedules registered via ___SINGLE_BACKTICK___ApplicationBuilder::withScheduling()___SINGLE_BACKTICK___ are now deferred until ___SINGLE_BACKTICK___Schedule___SINGLE_BACKTICK___ is resolved.

If your application relied on immediate schedule registration timing during bootstrap, you may need to adjust that logic.

## Security

### Request Forgery Protection

**Likelihood Of Impact: High**

Laravel's CSRF middleware has been renamed from ___SINGLE_BACKTICK___VerifyCsrfToken___SINGLE_BACKTICK___ to ___SINGLE_BACKTICK___PreventRequestForgery___SINGLE_BACKTICK___, and now includes request-origin verification using the ___SINGLE_BACKTICK___Sec-Fetch-Site___SINGLE_BACKTICK___ header.

___SINGLE_BACKTICK___VerifyCsrfToken___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK___ValidateCsrfToken___SINGLE_BACKTICK___ remain as deprecated aliases, but direct references should be updated to ___SINGLE_BACKTICK___PreventRequestForgery___SINGLE_BACKTICK___, especially when excluding middleware in tests or route definitions:

___BOOST_SNIPPET_9___

The middleware configuration API now also provides ___SINGLE_BACKTICK___preventRequestForgery(...)___SINGLE_BACKTICK___.

## Support

### Manager ___SINGLE_BACKTICK___extend___SINGLE_BACKTICK___ Callback Binding

**Likelihood Of Impact: Low**

Custom driver closures registered via manager ___SINGLE_BACKTICK___extend___SINGLE_BACKTICK___ methods are now bound to the manager instance.

If you previously relied on another bound object (such as a service provider instance) as ___SINGLE_BACKTICK___$this___SINGLE_BACKTICK___ inside these callbacks, you should move those values into closure captures using ___SINGLE_BACKTICK___use (...)___SINGLE_BACKTICK___.

### ___SINGLE_BACKTICK___Str___SINGLE_BACKTICK___ Factories Reset Between Tests

**Likelihood Of Impact: Low**

Laravel now resets custom ___SINGLE_BACKTICK___Str___SINGLE_BACKTICK___ factories during test teardown.

If your tests depended on custom UUID / ULID / random string factories persisting between test methods, you should set them in each relevant test or setup hook.

### ___SINGLE_BACKTICK___Js::from___SINGLE_BACKTICK___ Uses Unescaped Unicode By Default

**Likelihood Of Impact: Very Low**

___SINGLE_BACKTICK___Illuminate\Support\Js::from___SINGLE_BACKTICK___ now uses ___SINGLE_BACKTICK___JSON_UNESCAPED_UNICODE___SINGLE_BACKTICK___ by default.

If your tests or frontend output comparisons depended on escaped Unicode sequences (for example ___SINGLE_BACKTICK___\u00e8___SINGLE_BACKTICK___), update your expectations.

## Views

### Pagination Bootstrap View Names

**Likelihood Of Impact: Low**

The internal pagination view names for Bootstrap 3 defaults are now explicit:

___BOOST_SNIPPET_10___

## Getting help

If you encounter issues during the upgrade:

- Check the [upgrade guide](https://laravel.com/docs/13.x/upgrade) for the latest details
- Review the [GitHub comparison](https://github.com/laravel/laravel/compare/12.x...13.x) for skeleton changes
