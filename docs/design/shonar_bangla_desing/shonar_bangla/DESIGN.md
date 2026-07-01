---
name: Shonar Bangla
colors:
  surface: '#10141a'
  surface-dim: '#10141a'
  surface-bright: '#353940'
  surface-container-lowest: '#0a0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2eb'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#fff9ef'
  on-secondary: '#3a3000'
  secondary-container: '#ffdb3c'
  on-secondary-container: '#725f00'
  tertiary: '#f5f7ff'
  on-tertiary: '#29313e'
  tertiary-container: '#d3dbec'
  on-tertiary-container: '#58606e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#dbe3f4'
  tertiary-fixed-dim: '#bfc7d7'
  on-tertiary-fixed: '#141c28'
  on-tertiary-fixed-variant: '#3f4755'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-display:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter-mobile: 16px
  gutter-desktop: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  container-max: 1440px
---

## Brand & Style

The design system embodies a "Data-Driven Futuristic" aesthetic where national identity converges with high-performance technology. It is designed for an audience that values precision, cultural pride, and forward-thinking innovation.

The visual style is a blend of **Glassmorphism** and **High-Contrast Bold**. Deep, atmospheric backgrounds provide a canvas for vibrant neon accents that represent "energy" and "value." Surfaces leverage frosted-glass effects to create a sense of depth and sophisticated layering. The emotional response should be one of profound reliability, technological dominance, and a modern resurgence of heritage.

## Colors

The palette is anchored in a high-density dark mode to minimize eye strain and maximize the "glow" of data elements.

- **Primary (Teal - #00F2FF):** Used for primary actions, active states, and critical data pathways. It represents the "pulse" of the system.
- **Secondary (Gold - #FFD700):** Reserved for premium highlights, high-value data points, and achievements.
- **Surface & Background:** The foundation uses #0A0E14 (Deep Charcoal) for the base and #121A26 (Navy) for nested containers to create a hierarchical structural flow.
- **Semantic Accents:** Success and safety are handled by the teal primary, while warnings should leverage a desaturated version of the gold.

## Typography

The typography strategy prioritizes high-tech legibility and "digital-first" aesthetics. 

**Space Grotesk** is used for headlines to provide a technical, geometric edge. **Inter** handles the bulk of the body content for its exceptional clarity on screens. **Geist** is utilized for labels and data points to provide a mono-inspired, developer-centric feel that reinforces the data-driven narrative. 

Always use uppercase with increased letter spacing for `label-sm` to signify system metadata or status indicators.

## Layout & Spacing

This design system utilizes a **Fluid Grid** model with a strict 8px baseline rhythm. 

- **Desktop:** 12-column grid with 24px gutters. Content should be capped at 1440px for optimal readability.
- **Tablet:** 8-column grid with 24px gutters and 40px side margins.
- **Mobile:** 4-column grid with 16px gutters and 20px side margins.

Horizontal spacing between related data elements should be tight (8px-16px) to maintain visual grouping, while vertical sections should be separated by larger gaps (48px-64px) to allow the glassmorphic surfaces to "breathe."

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and **Tonal Layers**. Instead of traditional shadows, this design system uses:

1.  **Backdrop Blurs:** Surfaces use a 12px to 20px blur radius with a semi-transparent Navy (#121A26) fill at 60-80% opacity.
2.  **Inner Glow / Strokes:** Elevated cards feature a 1px solid border at 10% white opacity to define edges against the dark background.
3.  **Neon Bloom:** Interaction states (like hovering a primary button) utilize a soft teal outer glow (bloom) rather than a shadow to simulate light emission.
4.  **Z-Index Tiering:** Lower levels are darker and more opaque; higher levels (modals, tooltips) are lighter with more pronounced blur effects.

## Shapes

The shape language is "Precision Soft." We use **Soft (0.25rem)** roundedness for standard components like input fields and small buttons to maintain a technical feel. Larger containers and cards use **0.5rem (rounded-lg)** to soften the tech-heavy aesthetic.

Avoid fully circular "pill" shapes except for status indicators (chips) to prevent the UI from appearing too casual. Geometry should feel calculated and architectural.

## Components

### Buttons
Primary buttons use a solid Teal (#00F2FF) fill with dark text. On hover, they emit a "Neon Bloom" glow. Secondary buttons use a Teal 1px ghost border with a subtle glass background.

### Data Tables
Tables are the heart of the system. Rows have a subtle 1px bottom border (#ffffff10). Headers use `label-sm` typography. High-value cells may use the Gold (#FFD700) accent for emphasis.

### Glassmorphic Cards
Containers for data visualizations. They must feature a `backdrop-filter: blur(16px)` and a subtle gradient stroke (from top-left Teal at 20% to bottom-right transparent).

### Input Fields
Dark backgrounds (#0A0E14) with a Teal bottom-border active state. Labels use `label-sm`.

### High-Fidelity Charts
Charts should use Teal for the primary data series and Gold for the comparison or "peak" series. Grid lines in charts should be kept at 5% white opacity to remain unobtrusive.

### Chips & Tags
Small, angular badges with high-contrast text. Use Teal background at 10% opacity with solid Teal text for a "terminal" look.