# Design System: Campus Vibe 💖

## 1. Creative North Star: "Campus Vibe"
Chill Mate is the ultimate student-first matchmaking app. The design system is centered on **"Campus Vibe"**—an interface that feels alive, warm, inclusive, and fun. It avoids clinical dark screens or stark white corporate grids. Instead, it utilizes soft, translucent glass panels, floating ambient light orbs, and playful yet engineered layouts that resonate with verified college students.

Key pillars:
- **Aesthetic**: Glassmorphism with smooth background gradients that shift in color depending on the page context (e.g., warm pinks for swiping, deep indigo for chats, playful gold for premium plans).
- **Typography**: Outfit for display headings (bold, geometric, energetic) paired with Inter for body text (clean, extremely legible, neutral).
- **Animations**: Fluid spring micro-animations for card swipes, button hover state transitions, and smooth page entry effects.

---

## 2. Colors & Atmospheric Depth
The color palette represents warmth, friendship, and youth. 

- **Primary (Rose Gold / Hot Pink - #F43F5E):** Represents romance, swiping right, and key CTAs.
- **Secondary (Neon Indigo / Violet - #6366F1):** Represents chats, deep connections, and message text.
- **Accent (Sunlight Amber - #F59E0B):** Represents streaks, leaderboard rankings, and premium tier features.
- **Background (Soft Light):** Light mode shifts between `#FFF1F2` (Rose 50), `#EEF2FF` (Indigo 50), and `#FAF5FF` (Purple 50) using custom gradient meshes.
- **Background (Modern Dark Mode):** A deep purple-black base (`#0F0A1E`) with subtle neon color glows.

### Elevation Hierarchy (Glassmorphism)
- **Base Layer:** The gradient mesh canvas.
- **Container Layer:** Frosted white glass (`rgba(255, 255, 255, 0.75)`) with `backdrop-filter: blur(16px)` and a thin, semi-transparent border (`rgba(255, 255, 255, 0.4)`).
- **Interactive Layer:** Vibrant solid buttons and cards that cast soft, colored glows rather than harsh black shadows.

---

## 3. Typography Scale
We use **Outfit** for Display/Headlines and **Inter** for Body/Labels.

- **Display-LG (40px, bold):** Used for hero sections, main landing page titles. Letter spacing: `-0.02em`.
- **Headline-MD (24px, semibold):** Used for profile names on swipe cards, page titles.
- **Body-MD (16px, regular):** Used for bios, chat messages, plan descriptions. Line height: `1.5`.
- **Label-Bold (14px, bold):** Used for buttons, category tags, filters.

---

## 4. Layout & Mobile Responsiveness
Campus Vibe is mobile-first. All designs must adapt smoothly between a pocketable phone screen and a large desktop screen.

- **Mobile Grid (4 columns):** 16px margins, 12px gutters. All interactions (swiping, messaging, profile edits) are single-hand friendly (bottom 50% action area).
- **Desktop Layout:** Wraps screens into center-aligned cards simulating a high-end mobile app shell or side-by-side split screen dashboards (e.g., discover card on the left, profile info on the right) to prevent awkward, overly wide layouts.
- **Rounded Corners:** 
  - Main cards/glass panels: `24px` (`rounded-3xl`)
  - Buttons/inputs: `16px` (`rounded-2xl`)
  - Status badges/chips: `9999px` (`rounded-full`)
