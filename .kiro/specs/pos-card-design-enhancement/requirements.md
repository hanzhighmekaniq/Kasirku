# Requirements Document

## Introduction

This document specifies the requirements for enhancing the ProductCard component design in the Kasir (POS) page. The enhancement aims to modernize the visual appearance and interaction patterns by adopting design patterns from a reference implementation (MenuCard POS), while maintaining full compatibility with existing features including variants, packaging units, stock tracking, recipe ingredients, and out-of-stock states.

## Glossary

- **ProductCard_Component**: The React component located at `resources/js/Pages/Admin/Kasir/components/ProductCard.jsx` that displays individual products in the POS interface
- **Kasir_Page**: The main POS page component located at `resources/js/Pages/Admin/Kasir/Kasir.jsx`
- **MenuCard_Reference**: The reference implementation containing modern design patterns from `MenuCard POS/src/routes/index.tsx`
- **Hover_State**: The visual appearance of an element when the user's pointer is positioned over it
- **Transition**: A CSS animation that smoothly changes an element's properties over time
- **Backdrop_Blur**: A CSS effect that applies gaussian blur to the area behind an element
- **Badge**: A small visual indicator displaying status information (stock, tags, variants)
- **Gradient_Background**: A CSS background that transitions between two or more colors
- **Packaging_Unit**: Alternative selling units for products (e.g., box, carton) with different pricing and quantity conversions
- **Variant**: Product variations (e.g., size, flavor) with distinct names and pricing
- **Recipe_Ingredient**: Raw materials required to prepare a product, tracked for availability
- **Out_Of_Stock**: A state where a product's stock quantity is zero or below required levels
- **Ingredient_Shortage**: A state where one or more required recipe ingredients have insufficient stock

## Requirements

### Requirement 1: Image Container Enhancement

**User Story:** As a POS user, I want product images to have smooth hover effects, so that the interface feels more responsive and modern.

#### Acceptance Criteria

1. WHEN the user hovers over ProductCard_Component, THE ProductCard_Component SHALL apply a scale-110 transform to the product image within 300ms
2. WHEN the user hovers over ProductCard_Component, THE ProductCard_Component SHALL apply a gradient overlay from transparent to black/10 with opacity transition
3. THE ProductCard_Component SHALL use rounded-3xl border-radius for the outer card container
4. THE ProductCard_Component SHALL use rounded-xl border-radius for inner elements including image container and buttons
5. WHEN the product is out of stock, THE ProductCard_Component SHALL apply grayscale filter to the product image

### Requirement 2: Stock Badge Modernization

**User Story:** As a POS user, I want stock badges to be visually distinctive, so that I can quickly identify stock status.

#### Acceptance Criteria

1. WHEN stock is available, THE ProductCard_Component SHALL display a stock badge with an animated pulse effect on the status indicator dot
2. THE ProductCard_Component SHALL render stock badges with backdrop-blur-sm effect and bg-background/90 background
3. THE ProductCard_Component SHALL display stock badges with rounded-full shape and shadow-sm shadow
4. WHEN stock quantity is 10 or below and above 0, THE ProductCard_Component SHALL use amber-500 color for the status indicator
5. WHEN stock quantity is above 10, THE ProductCard_Component SHALL use emerald-500 color for the status indicator
6. WHEN stock quantity is 0, THE ProductCard_Component SHALL use destructive color for the status indicator and remove pulse animation

### Requirement 3: Tag Badge Enhancement

**User Story:** As a POS user, I want product tags to be visually prominent, so that I can identify featured or special products.

#### Acceptance Criteria

1. WHEN a product has a tag attribute, THE ProductCard_Component SHALL display the tag badge with shadow-md shadow
2. THE ProductCard_Component SHALL render tag badges with rounded-full shape and primary background color
3. THE ProductCard_Component SHALL include a Sparkles icon (h-3 w-3 size) within tag badges
4. WHEN a product is out of stock, THE ProductCard_Component SHALL hide the tag badge
5. THE ProductCard_Component SHALL position tag badges at the top-right corner with 12px spacing (top-3 right-3)

### Requirement 4: Out of Stock Overlay Improvement

**User Story:** As a POS user, I want out-of-stock indicators to be immediately obvious, so that I don't attempt to select unavailable products.

#### Acceptance Criteria

1. WHEN a product is out of stock or has ingredient shortage, THE ProductCard_Component SHALL apply backdrop-blur effect to the overlay
2. THE ProductCard_Component SHALL render the status message in a rounded-full badge with destructive background
3. THE ProductCard_Component SHALL display "Habis" for out of stock and "Bahan Habis" for ingredient shortage
4. THE ProductCard_Component SHALL use uppercase text with tracking-wider letter spacing for status messages
5. THE ProductCard_Component SHALL center the status badge both horizontally and vertically within the overlay

### Requirement 5: Card Container Hover Effects

**User Story:** As a POS user, I want product cards to respond to hover interactions, so that I can see which product I'm about to select.

#### Acceptance Criteria

1. WHEN the user hovers over ProductCard_Component, THE ProductCard_Component SHALL translate upward by 4px within 300ms
2. WHEN the user hovers over ProductCard_Component, THE ProductCard_Component SHALL increase shadow to shadow-xl with primary/5 tint
3. WHEN the user hovers over ProductCard_Component, THE ProductCard_Component SHALL change border color from border/60 to primary color
4. WHEN the product is disabled, THE ProductCard_Component SHALL prevent hover effects and display cursor-not-allowed
5. THE ProductCard_Component SHALL use duration-300 transition for all hover state changes

### Requirement 6: Variant Badge Redesign

**User Story:** As a POS user, I want variant badges to have a modern appearance, so that the interface looks polished and professional.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL render variant badges with rounded-md shape instead of rounded
2. THE ProductCard_Component SHALL apply gradient background (from-indigo-500 to-indigo-600) to variant badges
3. THE ProductCard_Component SHALL use shadow-sm on variant badges
4. THE ProductCard_Component SHALL display a circular dot icon (h-2 w-2) before each variant name
5. WHEN more than 2 variants exist, THE ProductCard_Component SHALL display "+N" badge with slate-200 background for remaining variants

### Requirement 7: Packaging Unit Button Enhancement

**User Story:** As a POS user, I want packaging unit buttons to be visually appealing, so that I can easily select different unit sizes.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL render base unit buttons with rounded-lg shape and border-2 border
2. THE ProductCard_Component SHALL apply gradient backgrounds (from-indigo-50 to-indigo-100) to base unit buttons
3. THE ProductCard_Component SHALL apply gradient backgrounds (from-emerald-50 to-emerald-100) to packaging unit buttons
4. WHEN the user hovers over a unit button, THE ProductCard_Component SHALL scale the button to 105% within 200ms
5. WHEN the user hovers over a unit button, THE ProductCard_Component SHALL increase border color intensity and apply shadow-lg
6. WHEN the user clicks a unit button, THE ProductCard_Component SHALL apply scale-95 transform (active state)
7. THE ProductCard_Component SHALL apply gradient overlay transition on hover (from-color/0 to from-color/10)

### Requirement 8: Conversion Hint Modernization

**User Story:** As a POS user, I want conversion information to be clearly displayed, so that I understand unit relationships.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL render conversion hints with rounded-full shape and border border-slate-200
2. THE ProductCard_Component SHALL include a conversion icon (h-2 w-2 size) with emerald-500 color before the text
3. THE ProductCard_Component SHALL display conversion hints with shadow-sm shadow and white background
4. THE ProductCard_Component SHALL use font-semibold weight and text-slate-600 color for conversion text
5. THE ProductCard_Component SHALL render conversion hints below the packaging unit button grid

### Requirement 9: Single Price Display Enhancement

**User Story:** As a POS user, I want single price displays to be visually prominent, so that pricing is immediately clear.

#### Acceptance Criteria

1. WHEN no packaging units exist and no active variants exist, THE ProductCard_Component SHALL display price in a gradient container
2. THE ProductCard_Component SHALL apply gradient background (from-indigo-500 to-indigo-600) to price containers
3. THE ProductCard_Component SHALL render price text with font-extrabold weight and white color
4. THE ProductCard_Component SHALL apply shadow-md to price containers
5. THE ProductCard_Component SHALL use rounded-lg shape for price containers

### Requirement 10: Recipe Badge Redesign

**User Story:** As a POS user, I want recipe indicators to be visually consistent, so that I can identify recipe-based products.

#### Acceptance Criteria

1. WHEN a product has recipe ingredients, THE ProductCard_Component SHALL display a recipe badge with gradient background (from-amber-100 to-orange-100)
2. THE ProductCard_Component SHALL render recipe badges with rounded-full shape and border border-amber-200
3. THE ProductCard_Component SHALL include a recipe icon (h-3 w-3 size) within the badge
4. THE ProductCard_Component SHALL apply shadow-sm to recipe badges
5. THE ProductCard_Component SHALL display the count of recipe ingredients in the badge text

### Requirement 11: Typography Improvements

**User Story:** As a POS user, I want text to be readable and well-styled, so that information is easy to scan.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL use font-bold weight for product names instead of font-medium
2. THE ProductCard_Component SHALL use uppercase text with tracking-wide letter spacing for unit labels
3. THE ProductCard_Component SHALL use font-extrabold weight for price text
4. THE ProductCard_Component SHALL use font-bold weight for all badge text
5. THE ProductCard_Component SHALL maintain leading-snug line height for multi-line product names

### Requirement 12: Spacing and Layout Refinement

**User Story:** As a POS user, I want consistent spacing throughout the card, so that the design looks clean and organized.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL use p-3 padding for the card body section
2. THE ProductCard_Component SHALL use gap-2 spacing for variant badge flex containers
3. THE ProductCard_Component SHALL use gap-1.5 spacing for packaging unit button grids
4. THE ProductCard_Component SHALL use mt-3 margin for section separators (variants, units, price)
5. THE ProductCard_Component SHALL use pt-3 padding for the footer section

### Requirement 13: Color Scheme Modernization

**User Story:** As a POS user, I want colors to be vibrant and consistent, so that the interface is visually appealing.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL use indigo color palette (indigo-50, indigo-100, indigo-500, indigo-600) for primary elements
2. THE ProductCard_Component SHALL use emerald color palette (emerald-50, emerald-100, emerald-500, emerald-600) for packaging units
3. THE ProductCard_Component SHALL use amber/orange color palette for recipe badges
4. THE ProductCard_Component SHALL use slate color palette (slate-200, slate-600, slate-700) for neutral elements
5. THE ProductCard_Component SHALL use red/destructive color palette for out-of-stock states

### Requirement 14: Shadow System Implementation

**User Story:** As a POS user, I want depth and hierarchy to be communicated through shadows, so that interactive elements are obvious.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL use shadow-sm for base card state
2. WHEN the user hovers over ProductCard_Component, THE ProductCard_Component SHALL increase shadow to shadow-xl
3. THE ProductCard_Component SHALL use shadow-md for prominent badges and price containers
4. THE ProductCard_Component SHALL use shadow-lg for hovered unit buttons
5. THE ProductCard_Component SHALL apply primary/5 tint to hover state shadows

### Requirement 15: Animation and Transition Consistency

**User Story:** As a POS user, I want smooth animations throughout the interface, so that interactions feel polished.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL use duration-300 for card-level transitions (hover, shadow, border)
2. THE ProductCard_Component SHALL use duration-500 for image scale transitions
3. THE ProductCard_Component SHALL use duration-200 for button-level transitions (unit buttons, hover states)
4. THE ProductCard_Component SHALL apply transition-all to elements with multiple changing properties
5. THE ProductCard_Component SHALL use animate-pulse for stock indicator dots when stock is available

### Requirement 16: Responsive Design Maintenance

**User Story:** As a POS user, I want the enhanced design to work on all screen sizes, so that I can use the system on different devices.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL maintain aspect-square ratio for product images on all screen sizes
2. THE ProductCard_Component SHALL render correctly in 2-column grid on small screens (grid-cols-2)
3. THE ProductCard_Component SHALL render correctly in 3-column grid on large screens (lg:grid-cols-2, xl:grid-cols-3)
4. THE ProductCard_Component SHALL render correctly in 5-column grid on extra-large screens (2xl:grid-cols-5)
5. THE ProductCard_Component SHALL use text-sm or smaller for all text content to prevent overflow in grid layouts

### Requirement 17: Accessibility Preservation

**User Story:** As a POS user, I want the enhanced design to remain accessible, so that all users can operate the system.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL maintain disabled state with disabled:opacity-60 and disabled:cursor-not-allowed
2. THE ProductCard_Component SHALL preserve all existing onClick and onUnitClick event handlers
3. THE ProductCard_Component SHALL maintain keyboard navigation support for all interactive elements
4. THE ProductCard_Component SHALL preserve alt text for product images
5. THE ProductCard_Component SHALL maintain proper button semantics for all clickable elements

### Requirement 18: Background Gradient Implementation

**User Story:** As a POS user, I want subtle background gradients, so that the interface has depth and visual interest.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL apply gradient background (from-white to-slate-50/50) to the card body section
2. THE ProductCard_Component SHALL apply gradient background (from-slate-50 via-white to-slate-100) to empty image placeholders
3. THE ProductCard_Component SHALL apply gradient backgrounds to all unit buttons as specified in Requirement 7
4. THE ProductCard_Component SHALL apply gradient backgrounds to price containers as specified in Requirement 9
5. THE ProductCard_Component SHALL apply gradient backgrounds to badge elements as specified in other requirements

### Requirement 19: Icon Integration

**User Story:** As a POS user, I want visual icons to complement text, so that information is easier to understand at a glance.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL use Lucide React icons or inline SVG icons with consistent sizing
2. THE ProductCard_Component SHALL use h-3 w-3 size for badge icons (stock, tag, recipe)
3. THE ProductCard_Component SHALL use h-2 w-2 size for small inline icons (variant dots, conversion icons)
4. THE ProductCard_Component SHALL maintain existing SVG icons for product placeholder when no image exists
5. THE ProductCard_Component SHALL apply proper icon colors matching the parent badge or element color scheme

### Requirement 20: Feature Compatibility Verification

**User Story:** As a developer, I want to ensure all existing features continue to work, so that the redesign doesn't break functionality.

#### Acceptance Criteria

1. THE ProductCard_Component SHALL correctly display products with active variants
2. THE ProductCard_Component SHALL correctly display products with packaging units
3. THE ProductCard_Component SHALL correctly display products with recipe ingredients
4. THE ProductCard_Component SHALL correctly handle out-of-stock products with track_stock enabled
5. THE ProductCard_Component SHALL correctly handle products with ingredient shortages
6. THE ProductCard_Component SHALL correctly handle products without images (placeholder display)
7. THE ProductCard_Component SHALL correctly invoke onClick handler when card is clicked
8. THE ProductCard_Component SHALL correctly invoke onUnitClick handler when unit buttons are clicked
9. THE ProductCard_Component SHALL correctly display conversion hints for all packaging units
10. THE ProductCard_Component SHALL correctly handle disabled state for out-of-stock and ingredient-shortage products
