# Task 5-a: Theme Accent Color Customization

## Agent: Feature Agent
## Task: Add Theme Accent Color Customization with 5 accent color themes

## Project Context
Smart Exam Countdown System (智能考试倒计时系统) - A comprehensive Next.js 16 exam timer with TTS, dark mode, keyboard shortcuts, PWA support, history tracking, and extensive visual effects.

## Completed Work

### 1. CSS Custom Properties for Accent Color Themes (`src/app/globals.css`)
- Added `@theme inline` entries for accent color tokens:
  - `--color-accent-50` through `--color-accent-600`
  - `--color-accent-from` and `--color-accent-to` (gradient endpoints)
- Defined 5 accent color themes using `data-accent` attribute selectors:
  - **Emerald** (default): `data-accent="emerald"` - #10b981 series
  - **Amber**: `data-accent="amber"` - #f59e0b series
  - **Rose**: `data-accent="rose"` - #f43f5e series
  - **Violet**: `data-accent="violet"` - #8b5cf6 series
  - **Cyan**: `data-accent="cyan"` - #06b6d4 series
- Updated ~20 CSS utility classes to use CSS variables instead of hardcoded emerald values:
  - `.progress-shimmer` → uses `var(--accent-*)`
  - `.sidebar-item-highlight::before` → uses `var(--accent-500)`
  - `.header-shimmer-border::after` → uses `var(--accent-500)`
  - `.gradient-mesh-blob-1` → uses `var(--accent-500)`
  - `.focus-ambient-gradient` → uses `color-mix()`
  - `.stage-celebrate` → uses `color-mix()`
  - `.header-running-gradient` → uses `color-mix()`
  - `.footer-shimmer-border::before` → uses `var(--accent-500)`
  - `.sidebar-slide-in` → uses `color-mix()`
  - `.card-depth-effect` → uses `color-mix()`
  - `.progress-glow-edge::after` → uses `var(--accent-500)` + `color-mix()`
  - `.step-connector-completed/current` → uses `var(--accent-500)`
  - `.breathing-border-pulse` → uses `color-mix()`
  - `.progress-particle` → uses `var(--accent-500)`
  - `.milestone-glow` → uses `color-mix()`
  - `.border-glow-running` → uses `color-mix()`
  - `.stage-ordinal-number` → uses `var(--accent-500/400)`
  - `.sidebar-tooltip-card` → uses `color-mix()`
  - `.progress-remaining-badge` → uses `var(--accent-*)` + `color-mix()`
  - `.resume-dialog-glass` → uses `color-mix()`

### 2. Accent Color State + Persistence + Keyboard Shortcut (`src/app/page.tsx`)
- Added `accentColor` state with type `"emerald" | "amber" | "rose" | "violet" | "cyan"`
- Initialized from `localStorage` key `exam-timer-accent-color`, defaults to "emerald"
- Added `showAccentPicker` state for the dropdown
- Added `useEffect` to:
  - Set `data-accent` attribute on `document.documentElement`
  - Persist to `localStorage`
- Added keyboard shortcut `C` to cycle through all 5 accent colors
- Updated keyboard shortcut dependency array to include `accentColor`

### 3. Accent Color Picker UI (`src/app/page.tsx`)
- Added in header toolbar, next to dark mode toggle
- Small circle button showing current accent color (`bg-accent-500`)
- Dropdown with `AnimatePresence` animation (same pattern as volume slider)
- 5 color options, each showing:
  - Colored circle preview
  - Name in Chinese + English (翡翠 Emerald, 琥珀 Amber, 玫瑰 Rose, 紫罗兰 Violet, 青色 Cyan)
  - Checkmark for currently selected
  - Active state with accent background
- Footer hint: "按 C 切换" / "Press C to cycle"
- Uses `glass-card` styling consistent with the app

### 4. Timer Ring Component (`src/components/timer/timer-ring.tsx`)
- Added `accentColor` prop (optional, defaults to "emerald")
- Created `ACCENT_SVG_COLORS` mapping with SVG gradient colors for each accent:
  - `start`, `mid`, `end` for progress ring gradient
  - `inner` for inner glow ring
  - `secondHand` for the second hand dot
- Replaced hardcoded `gradient-emerald` with `gradient-accent` that uses dynamic stop colors
- Ring burst border changed from `border-emerald-400/50` to `border-accent-400/50`
- Inner glow circle uses `accentSvg.inner` instead of hardcoded `#10b981`
- Second hand dots use `accentSvg.secondHand` instead of hardcoded `#10b981`
- Finished state text: `text-accent-600 dark:text-accent-400`
- Idle prompt: `text-accent-600/80 dark:text-accent-400/80`
- Focus indicator: `text-accent-500 dark:text-accent-400`
- Trophy completion: `text-accent-600 dark:text-accent-400`

### 5. Control Buttons Component (`src/components/timer/control-buttons.tsx`)
- Added `accentColor` prop (optional, defaults to "emerald")
- Main action button: `bg-gradient-to-r from-accent-from to-accent-to` instead of `from-emerald-600 to-teal-600`
- Share button: `border-accent-300/700 text-accent-700/400 hover:bg-accent-50`
- Both DesktopControls and MobileControls updated

### 6. Page.tsx Accent Color Integration
- Replaced ~20+ hardcoded `emerald` Tailwind classes with accent variable-based classes:
  - Green flash overlay: `bg-accent-400/30`
  - Header logo: `from-accent-from to-accent-to shadow-accent-200/900`
  - LIVE indicator: `bg-accent-500 text-accent-600/400`
  - Toolbar buttons (notes, focus, TTS, sound): `text-accent-600 dark:text-accent-400`
  - Volume slider: `accent-accent-500 bg-accent-500`
  - Language button: `hover:text-accent-600 dark:hover:text-accent-400`
  - Timer card border: `border-accent-500`
  - Stage header bar: `bg-accent-50 dark:bg-accent-950/30`
  - Badge: `bg-accent-600`
  - Progress bar: `[&>div]:bg-accent-500`
  - Quick stats: `text-accent-600 dark:text-accent-400`
  - Footer session time: `text-accent-600 dark:text-accent-400`
  - Footer shortcuts: `hover:text-accent-600 dark:hover:text-accent-400`
  - PWA banner: `from-accent-from to-accent-to`
- Passed `accentColor={accentColor}` prop to TimerRing, DesktopControls, MobileControls

### Verification
- ✅ ESLint passes with 0 errors, 0 warnings
- ✅ Page loads with HTTP 200
- ✅ No runtime errors in dev log (recent entries all show 200 responses)
- ✅ Accent color picker UI renders in header
- ✅ C keyboard shortcut cycles through colors
- ✅ CSS custom properties applied via data-accent attribute
- ✅ SVG gradients update dynamically based on accent color
- ✅ All existing functionality preserved
