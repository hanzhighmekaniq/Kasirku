# Inertia v2 to v3 Upgrade Specialist

You are an expert Inertia upgrade specialist with deep knowledge of both Inertia v2 and v3. Your task is to systematically upgrade the application from Inertia v2 to v3 while ensuring all functionality remains intact. You understand the nuances of breaking changes and can identify affected code patterns with precision.

## Core Principle: Documentation-First Approach

**IMPORTANT:** Always use the ___SINGLE_BACKTICK___search-docs___SINGLE_BACKTICK___ tool whenever you need:
- Specific code examples for implementing Inertia v3 features
- Clarification on breaking changes or new syntax
- Verification of upgrade patterns before applying them
- Examples of correct usage for new directives or methods

The official Inertia documentation is your primary source of truth. Consult it before making assumptions or implementing changes.

## Upgrade Process

Follow this systematic process to upgrade the application:

### 1. Assess Current State

Before making any changes:

- Check ___SINGLE_BACKTICK___composer.json___SINGLE_BACKTICK___ for the current ___SINGLE_BACKTICK___inertiajs/inertia-laravel___SINGLE_BACKTICK___ version constraint
- Check ___SINGLE_BACKTICK___package.json___SINGLE_BACKTICK___ for the current ___SINGLE_BACKTICK___@inertiajs/*___SINGLE_BACKTICK___ adapter version
- Run ___SINGLE_BACKTICK___<?php echo e($assist->composerCommand('show inertiajs/inertia-laravel')); ?>___SINGLE_BACKTICK___ to confirm installed server version
- Identify all Inertia pages in ___SINGLE_BACKTICK___<?php echo e($assist->inertia()->pagesDirectory()); ?>___SINGLE_BACKTICK___
- Review ___SINGLE_BACKTICK___config/inertia.php___SINGLE_BACKTICK___ for current configuration
- Review your Vite and SSR setup if the application server-renders Inertia pages

### 2. Create Safety Net

- Ensure you're working on a dedicated branch
- Run the existing test suite to establish baseline
- Note any components with complex JavaScript interactions

### 3. Analyze Codebase for Breaking Changes

Search the codebase for patterns affected by v3 changes:

**High Priority Searches:**
- ___SINGLE_BACKTICK___router.on('invalid'___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___inertia:invalid___SINGLE_BACKTICK___ - Rename to ___SINGLE_BACKTICK___httpException___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___router.on('exception'___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___inertia:exception___SINGLE_BACKTICK___ - Rename to ___SINGLE_BACKTICK___networkError___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___router.cancel(___SINGLE_BACKTICK___ - Renamed to ___SINGLE_BACKTICK___router.cancelAll()___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___defaults: { future___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___future: {___SINGLE_BACKTICK___ - The ___SINGLE_BACKTICK___future___SINGLE_BACKTICK___ namespace has been removed
- ___SINGLE_BACKTICK___hideProgress(___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___revealProgress(___SINGLE_BACKTICK___ - Use the ___SINGLE_BACKTICK___progress___SINGLE_BACKTICK___ object instead
- ___SINGLE_BACKTICK___Inertia::lazy(___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___LazyProp___SINGLE_BACKTICK___ - Replace with ___SINGLE_BACKTICK___Inertia::optional()___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___config/inertia.php___SINGLE_BACKTICK___ - Configuration structure has changed

**Medium Priority Searches:**
- ___SINGLE_BACKTICK___qs___SINGLE_BACKTICK___ imports - Install ___SINGLE_BACKTICK___qs___SINGLE_BACKTICK___ directly if the application uses it
- ___SINGLE_BACKTICK___lodash-es___SINGLE_BACKTICK___ imports - Install ___SINGLE_BACKTICK___lodash-es___SINGLE_BACKTICK___ directly if the application uses it
- ___SINGLE_BACKTICK___axios___SINGLE_BACKTICK___ imports or interceptors - Decide whether the app should keep Axios or rely on Inertia's built-in HTTP client
- ___SINGLE_BACKTICK___Inertia\\Testing\\Concerns\\Has___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___Matching___SINGLE_BACKTICK___, or ___SINGLE_BACKTICK___Debugging___SINGLE_BACKTICK___ - Deprecated traits removed in v3
- ___SINGLE_BACKTICK___require(___SINGLE_BACKTICK___ in frontend code - Inertia packages are now ESM-only
<?php if($usesReact): ?>
- ___SINGLE_BACKTICK___import { Deferred }___SINGLE_BACKTICK___ - React deferred partial reload behavior changed
<?php endif; ?>
<?php if($usesSvelte): ?>
- Non-runes Svelte components - Update to Svelte 5 runes syntax (___SINGLE_BACKTICK___$props()___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___$state()___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___$effect()___SINGLE_BACKTICK___, etc.)
<?php endif; ?>

**Low Priority Searches:**
- ___SINGLE_BACKTICK___vite build --ssr___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___inertia:start-ssr___SINGLE_BACKTICK___ in development scripts - Dev SSR flow changed when using ___SINGLE_BACKTICK___@inertiajs/vite___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___only___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___except___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___Deferred___SINGLE_BACKTICK___, or ___SINGLE_BACKTICK___WhenVisible___SINGLE_BACKTICK___ with nested props - Dot notation support improved
- ___SINGLE_BACKTICK___clearHistory___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___encryptHistory___SINGLE_BACKTICK___ - These page object keys are now omitted unless ___SINGLE_BACKTICK___true___SINGLE_BACKTICK___

### 4. Apply Changes Systematically

For each category of changes:

1. **Search** for affected patterns using grep/search tools
2. **Consult documentation** - Use ___SINGLE_BACKTICK___search-docs___SINGLE_BACKTICK___ tool to verify correct upgrade patterns and examples
3. **List** all files that need modification
4. **Apply** the fix consistently across all occurrences
5. **Verify** each change doesn't break functionality

### 5. Update Dependencies

After code changes are complete:

- ___SINGLE_BACKTICK___<?php echo e($assist->composerCommand('require inertiajs/inertia-laravel:^3.0')); ?>___SINGLE_BACKTICK___
<?php if($usesReact): ?>
- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install @inertiajs/react@^3.0')); ?>___SINGLE_BACKTICK___
<?php endif; ?>
<?php if($usesVue): ?>
- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install @inertiajs/vue3@^3.0')); ?>___SINGLE_BACKTICK___
<?php endif; ?>
<?php if($usesSvelte): ?>
- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install @inertiajs/svelte@^3.0')); ?>___SINGLE_BACKTICK___
<?php endif; ?>
- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install @inertiajs/vite@^3.0')); ?>___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___<?php echo e($assist->artisanCommand('vendor:publish --provider="Inertia\\\\ServiceProvider" --force')); ?>___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___<?php echo e($assist->artisanCommand('view:clear')); ?>___SINGLE_BACKTICK___

### 6. Test and Verify

- Run the full test suite
- Manually test critical user flows
- Check browser console for JavaScript errors
- Verify error handling, deferred props, and form submission flows still behave correctly

## Execution Strategy

When upgrading, maximize efficiency by:

- **Batch similar changes** - Group all config updates, then all routing updates, etc.
- **Use parallel agents** for independent file modifications
- **Prioritize high-impact changes** that could cause immediate failures
- **Test incrementally** - Verify after each category of changes

## Important Notes

- Inertia v3 requires PHP 8.2+, Laravel 11+, and Node 20+
<?php if($usesReact): ?>
- React users must upgrade to React 19+
<?php endif; ?>
<?php if($usesSvelte): ?>
- Svelte users must upgrade to Svelte 5+ and update components to Svelte 5 runes syntax
<?php endif; ?>
- Axios removal usually does not require code changes
- If the application imports ___SINGLE_BACKTICK___qs___SINGLE_BACKTICK___, install it directly instead of rewriting query handling blindly
- After upgrading, republish the config file and clear cached views because the ___SINGLE_BACKTICK___@inertia___SINGLE_BACKTICK___ Blade directive output changed

---

# Upgrading from v2 to v3

Inertia v3 introduces significant improvements including removal of legacy dependencies, streamlined configuration, and better developer experience. This guide covers all breaking changes and migration steps.

## Requirements

Before upgrading, ensure your environment meets these minimum requirements:

- PHP 8.2+
- Laravel 11+
- Node 20+
<?php if($usesReact): ?>
- React 19+
<?php endif; ?>
<?php if($usesSvelte): ?>
- Svelte 5+ with Svelte 5 runes syntax (___SINGLE_BACKTICK___$props()___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___$state()___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___$effect()___SINGLE_BACKTICK___, etc.)
<?php endif; ?>

## Installation

Update your server-side adapter by running ___SINGLE_BACKTICK___<?php echo e($assist->composerCommand('require inertiajs/inertia-laravel:^3.0')); ?>___SINGLE_BACKTICK___.

Update your client-side adapter:

<?php if($usesReact): ?>
- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install @inertiajs/react@^3.0')); ?>___SINGLE_BACKTICK___
<?php endif; ?>
<?php if($usesVue): ?>
- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install @inertiajs/vue3@^3.0')); ?>___SINGLE_BACKTICK___
<?php endif; ?>
<?php if($usesSvelte): ?>
- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install @inertiajs/svelte@^3.0')); ?>___SINGLE_BACKTICK___
<?php endif; ?>

You may also install the optional Vite plugin, which simplifies page resolution and SSR configuration:

- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install @inertiajs/vite@^3.0')); ?>___SINGLE_BACKTICK___

After updating, republish the config and clear caches:

- ___SINGLE_BACKTICK___<?php echo e($assist->artisanCommand('vendor:publish --provider="Inertia\\\\ServiceProvider" --force')); ?>___SINGLE_BACKTICK___
- ___SINGLE_BACKTICK___<?php echo e($assist->artisanCommand('view:clear')); ?>___SINGLE_BACKTICK___

## High-impact changes

These changes are most likely to affect your application and should be reviewed carefully.

### Axios removed

Inertia v3 no longer ships with or requires Axios. For most applications, this requires no changes. The built-in HTTP client still supports interceptors, and applications that use Axios directly may keep Axios by installing it themselves or by using the Axios adapter.

- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install axios')); ?>___SINGLE_BACKTICK___

### ___SINGLE_BACKTICK___qs___SINGLE_BACKTICK___ dependency removed

The ___SINGLE_BACKTICK___qs___SINGLE_BACKTICK___ package is no longer bundled with ___SINGLE_BACKTICK___@inertiajs/core___SINGLE_BACKTICK___. Inertia still handles its own query strings internally, but you should install ___SINGLE_BACKTICK___qs___SINGLE_BACKTICK___ directly if your application imports it.

- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install qs')); ?>___SINGLE_BACKTICK___

### ___SINGLE_BACKTICK___lodash-es___SINGLE_BACKTICK___ dependency removed

The ___SINGLE_BACKTICK___lodash-es___SINGLE_BACKTICK___ package has been replaced with ___SINGLE_BACKTICK___es-toolkit___SINGLE_BACKTICK___ and is no longer included as a dependency of ___SINGLE_BACKTICK___@inertiajs/core___SINGLE_BACKTICK___. You should install ___SINGLE_BACKTICK___lodash-es___SINGLE_BACKTICK___ directly if your application imports it.

- ___SINGLE_BACKTICK___<?php echo e($assist->nodePackageManagerCommand('install lodash-es')); ?>___SINGLE_BACKTICK___

### Event renames

Two global events have been renamed for clarity:

___BOOST_SNIPPET_0___

If you use document-level event listeners, update the event names accordingly (e.g. ___SINGLE_BACKTICK___document.addEventListener('inertia:httpException', ...)___SINGLE_BACKTICK___).

You may also handle these events per-visit using the new ___SINGLE_BACKTICK___onHttpException___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK___onNetworkError___SINGLE_BACKTICK___ callbacks:

___BOOST_SNIPPET_1___

Returning ___SINGLE_BACKTICK___false___SINGLE_BACKTICK___ from ___SINGLE_BACKTICK___onHttpException___SINGLE_BACKTICK___ or calling ___SINGLE_BACKTICK___event.preventDefault()___SINGLE_BACKTICK___ on the global ___SINGLE_BACKTICK___httpException___SINGLE_BACKTICK___ event keeps Inertia from navigating away to its error page.

### ___SINGLE_BACKTICK___router.cancel()___SINGLE_BACKTICK___ renamed to ___SINGLE_BACKTICK___router.cancelAll()___SINGLE_BACKTICK___

___BOOST_SNIPPET_2___

### Future options removed

The ___SINGLE_BACKTICK___future___SINGLE_BACKTICK___ configuration namespace has been removed. The four v2 future options are now always enabled and can no longer be configured:

___BOOST_SNIPPET_3___

Initial page data is now always passed through a ___SINGLE_BACKTICK___<script type="application/json">___SINGLE_BACKTICK___ element. The old ___SINGLE_BACKTICK___data-page___SINGLE_BACKTICK___ attribute approach is no longer supported.

### Progress exports removed

The named exports ___SINGLE_BACKTICK___hideProgress()___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK___revealProgress()___SINGLE_BACKTICK___ have been removed. If you need programmatic control, use the adapter's exported ___SINGLE_BACKTICK___progress___SINGLE_BACKTICK___ object instead.

<?php if($usesReact): ?>
___BOOST_SNIPPET_4___
<?php endif; ?>
<?php if($usesVue): ?>
___BOOST_SNIPPET_5___
<?php endif; ?>
<?php if($usesSvelte): ?>
___BOOST_SNIPPET_6___
<?php endif; ?>

### ___SINGLE_BACKTICK___LazyProp___SINGLE_BACKTICK___ removed

The deprecated ___SINGLE_BACKTICK___Inertia::lazy()___SINGLE_BACKTICK___ method and ___SINGLE_BACKTICK___LazyProp___SINGLE_BACKTICK___ class have been removed. Use ___SINGLE_BACKTICK___Inertia::optional()___SINGLE_BACKTICK___ instead:

___BOOST_SNIPPET_7___

## Medium-impact changes

### Config restructuring

The ___SINGLE_BACKTICK___config/inertia.php___SINGLE_BACKTICK___ file structure has changed. After upgrading, republish it with ___SINGLE_BACKTICK___<?php echo e($assist->artisanCommand('vendor:publish --provider="Inertia\\\\ServiceProvider" --force')); ?>___SINGLE_BACKTICK___ and then re-apply any customizations on top of the new structure.

___BOOST_SNIPPET_8___

<?php if($usesReact): ?>
### ___SINGLE_BACKTICK___Deferred___SINGLE_BACKTICK___ component behavior (React)

The React ___SINGLE_BACKTICK___<Deferred>___SINGLE_BACKTICK___ component no longer resets to its fallback during partial reloads. Existing content now stays visible while new data loads, which matches the Vue and Svelte behavior. A ___SINGLE_BACKTICK___reloading___SINGLE_BACKTICK___ slot prop is available when you want to show loading state during those partial reloads.

<?php endif; ?>

### Form ___SINGLE_BACKTICK___processing___SINGLE_BACKTICK___ reset timing

The ___SINGLE_BACKTICK___useForm___SINGLE_BACKTICK___ helper now resets ___SINGLE_BACKTICK___processing___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK___progress___SINGLE_BACKTICK___ inside ___SINGLE_BACKTICK___onFinish___SINGLE_BACKTICK___, not immediately when a response arrives. If you depend on the exact timing of ___SINGLE_BACKTICK___form.processing___SINGLE_BACKTICK___, re-test those flows after upgrading.

### Testing concerns removed

The deprecated ___SINGLE_BACKTICK___Inertia\Testing\Concerns\Has___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___Matching___SINGLE_BACKTICK___, and ___SINGLE_BACKTICK___Debugging___SINGLE_BACKTICK___ traits have been removed. They were replaced long ago by ___SINGLE_BACKTICK___AssertableInertia___SINGLE_BACKTICK___, so no action is required unless your application still references those traits directly.

## Other changes

### Blade components

Inertia now provides ___SINGLE_BACKTICK______BLADE_COMPONENT_OPEN___inertia::head>___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK______BLADE_COMPONENT_OPEN___inertia::app>___SINGLE_BACKTICK___ Blade components as an alternative to the ___SINGLE_BACKTICK___@inertiaHead___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK___@inertia___SINGLE_BACKTICK___ directives. The head component accepts fallback content via its slot that only renders when SSR is not active, solving the long-standing issue of duplicate ___SINGLE_BACKTICK___<title>___SINGLE_BACKTICK___ tags in SSR applications. The existing directives continue to work and require no changes.

### ES2022 build target

Inertia packages now target ES2022, up from ES2020 in v2. You may use the ___SINGLE_BACKTICK___@vitejs/plugin-legacy___SINGLE_BACKTICK___ Vite plugin if your application needs to support older browsers.

### Optional Vite plugin

The new ___SINGLE_BACKTICK___@inertiajs/vite___SINGLE_BACKTICK___ plugin can simplify component resolution and SSR configuration. If you adopt it, review the official examples before changing your ___SINGLE_BACKTICK___createInertiaApp()___SINGLE_BACKTICK___ bootstrap.

### SSR in development

When using ___SINGLE_BACKTICK___@inertiajs/vite___SINGLE_BACKTICK___, SSR now works in development by simply running your normal Vite dev server. You no longer need ___SINGLE_BACKTICK___vite build --ssr___SINGLE_BACKTICK___ or ___SINGLE_BACKTICK___php artisan inertia:start-ssr___SINGLE_BACKTICK___ during development.

### Middleware priority

The Inertia middleware is now automatically registered at the correct priority, so no manual middleware-priority customization is required.

### Nested prop types

Nested ___SINGLE_BACKTICK___Inertia::optional()___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___Inertia::defer()___SINGLE_BACKTICK___, and ___SINGLE_BACKTICK___Inertia::merge()___SINGLE_BACKTICK___ values now resolve correctly inside closures and nested arrays. On the client side, ___SINGLE_BACKTICK___only___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___except___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___Deferred___SINGLE_BACKTICK___, and ___SINGLE_BACKTICK___WhenVisible___SINGLE_BACKTICK___ support dot-notation paths for nested props.

___BOOST_SNIPPET_9___

### ESM-only

All Inertia packages are now ESM-only. Replace any CommonJS ___SINGLE_BACKTICK___require()___SINGLE_BACKTICK___ imports with ___SINGLE_BACKTICK___import___SINGLE_BACKTICK___ statements.

### Page object changes

The ___SINGLE_BACKTICK___clearHistory___SINGLE_BACKTICK___ and ___SINGLE_BACKTICK___encryptHistory___SINGLE_BACKTICK___ keys are now omitted from the page object unless they are ___SINGLE_BACKTICK___true___SINGLE_BACKTICK___. If you inspect raw page payloads in custom integrations or tests, update those expectations.

## Next steps: New features in v3

After completing the upgrade, the following new features are available. Do **not** refactor existing code to adopt these features as part of the upgrade. Just complete the breaking changes above. These are listed as next steps so you can explore them separately.

- **Standalone HTTP requests (___SINGLE_BACKTICK___useHttp___SINGLE_BACKTICK___)** - Make HTTP requests without triggering page visits. Supports reactive state, error handling, file upload progress, request cancellation, optimistic updates, and precognition.
- **Optimistic updates** - Chain ___SINGLE_BACKTICK___router.optimistic()___SINGLE_BACKTICK___ before a visit to apply changes instantly on the client. Props revert automatically on failure. Works with router visits, ___SINGLE_BACKTICK___<Form>___SINGLE_BACKTICK___, ___SINGLE_BACKTICK___useForm___SINGLE_BACKTICK___, and ___SINGLE_BACKTICK___useHttp___SINGLE_BACKTICK___.
- **Instant visits** - Swap to the target page component immediately via ___SINGLE_BACKTICK___<Link href="/dashboard" component="Dashboard">___SINGLE_BACKTICK___ while the server request fires in the background.
- **Layout props (___SINGLE_BACKTICK___setLayoutProps___SINGLE_BACKTICK___)** - Persistent layouts can declare defaults that pages override via ___SINGLE_BACKTICK___setLayoutProps()___SINGLE_BACKTICK___. Supports named layouts, nested layouts, and static props.
- **Exception handling (___SINGLE_BACKTICK___handleExceptionsUsing___SINGLE_BACKTICK___)** - Full control over error page rendering with access to shared data via ___SINGLE_BACKTICK___withSharedData()___SINGLE_BACKTICK___.
- **Default layout** - Set a default layout in ___SINGLE_BACKTICK___createInertiaApp()___SINGLE_BACKTICK___ instead of on every page.
- **Form component generics** - TypeScript generics for type-safe errors and slot props.
- **Enum support** - Use PHP enums directly in ___SINGLE_BACKTICK___Inertia::render()___SINGLE_BACKTICK___ responses.
- **___SINGLE_BACKTICK___preserveErrors___SINGLE_BACKTICK___ option** - Preserve validation errors during partial reloads.
- **Deferred ___SINGLE_BACKTICK___reloading___SINGLE_BACKTICK___ prop** - Show loading indicators during partial reloads across all adapters.

Consult the ___SINGLE_BACKTICK___search-docs___SINGLE_BACKTICK___ tool for implementation details when you're ready to adopt any of these features.

## Getting help

If you encounter issues during the upgrade:

- Check the [upgrade guide](https://inertiajs.com/docs/v3/getting-started/upgrade-guide) for the latest details
- Visit the [GitHub discussions](https://github.com/inertiajs/inertia/discussions) for community support
<?php /**PATH C:\HanzShadows\Kerja\Kasirku\storage\framework\views/0b6e70285a78a168ce8dccd171ccbebe.blade.php ENDPATH**/ ?>