# Google Stitch Design Prompts — Paint Stock Manager

## How to Use
1. Go to [stitch.withgoogle.com](https://stitch.withgoogle.com/)
2. Switch to **Experimental Mode** (top-right toggle)
3. Select **Web**
4. Click the **Image icon** and upload the corresponding screenshot from `/screenshots`
5. Paste the **Shared Context** below + the **Page-Specific Prompt** together
6. Generate → Review → Iterate

---

## SHARED CONTEXT (paste this at the top of EVERY prompt)

```
APP CONTEXT:
- Paint stock management system for a shipyard/industrial factory warehouse
- Used on wall-mounted kiosk touchscreen (1920x1080, viewed from ~1 meter)
- Operators wear work gloves — all interactive elements must be minimum 48px height
- 3 user roles: Admin (monitoring + master data), Warehouse Operator (stock-in/out), Sideroom Operator (receive leftover/dispose)
- Tech: Next.js 14, Tailwind CSS, shadcn/ui components
- Environment: bright factory floor with fluorescent lighting, screens may have glare
- Design priorities: readability at distance, high contrast, minimal clicks, clear color-coded actions
- Current palette: neutral grays, green=positive/incoming, blue=outgoing, red=destructive, orange=warnings
- The app uses a numeric PIN login (no keyboard needed — touch only)

HEADER & BRANDING:
- Every page (except login) MUST have a prominent sticky header bar at the top
- The header must include a factory icon/logo placeholder on the left side (use a generic factory/building SVG icon as placeholder — the real logo will be swapped in later)
- Factory icon should be ~40x40px, placed before the app name
- Header layout: [🏭 Factory Icon] [App Name + Page Title] ... [Nav Tabs] ... [User Info + Logout]
- The factory icon should be white or light-colored on a dark header background (deep navy/dark blue)
- Login page should also show the factory icon above the title as a brand element
```

---

## Page 1: Login (PIN Keypad)
**Screenshot:** `screenshots/01-login.png`

```
PAGE: PIN Login Screen
USER: All operators (warehouse, sideroom, admin)
PURPOSE: Quick numeric PIN entry to authenticate operators on the kiosk

CURRENT ISSUES:
- No app branding — no factory icon or logo anywhere
- The keypad buttons look too small and generic for gloved touch input
- The PIN display dots are hard to see at a distance
- The gradient background looks bland for an industrial setting
- No visual feedback when a digit is pressed (no press animation hint)
- "Clear" and backspace buttons are same size/style as number keys, easy to misfire
- The Login button color is too light/washed out

REDESIGN GOALS:
- Add a factory icon placeholder (🏭) centered above the title as brand identity
- Make keypad buttons at least 72px tall with large bold numbers (32px+)
- Add clear visual press states / affordance for each key
- Make PIN dots much larger and more visible (filled circles, high contrast)
- Use a bold, dark header area with the app name clearly readable from 1m+
- Make the Login button full-width, bold, high-contrast (e.g., bright blue or green)
- Add subtle haptic-feel shadows on keys for 3D touch affordance
- Keep the layout centered and vertically balanced
- Consider adding a dark theme option for better contrast in bright environments
```

---

## Page 2: Dashboard (Admin Overview)
**Screenshot:** `screenshots/02-dashboard.png`

```
PAGE: Admin Dashboard
USER: Admin / Office staff
PURPOSE: Real-time monitoring of all paint stock, daily usage trends, low-stock alerts, and recent activity

CURRENT ISSUES:
- Header is plain white with no branding — no factory icon or logo
- Stats cards are too small — the numbers need to be readable from 1+ meter
- The bar chart is cramped and hard to read quickly
- Low Stock Alert section is a wall of badges — hard to scan
- The Stock Overview table rows are too dense, text too small
- Recent Transactions list has small text and badges
- The header navigation buttons are cramped on smaller screens
- No clear visual hierarchy — everything competes for attention equally

REDESIGN GOALS:
- Add a dark navy header bar with: [🏭 Factory Icon] "Paint Stock Manager" on the left, nav tabs center, user+logout right
- Make stat cards much larger with BIG numbers (48-64px bold)
- Make the bar chart taller (400px+) with larger axis labels
- Redesign Low Stock Alert as a prominent warning panel with large item names
- Make table rows taller (56px+) with larger font (16px+)
- Use color-coded left borders or backgrounds to differentiate stock levels
- Make the Refresh button more prominent (auto-refresh indicator would be ideal)
- Add visual grouping: "Monitoring Zone" (stats + chart) vs "Detail Zone" (table + logs)
- Consider a dark mode variant optimized for the factory floor display
```

---

## Page 3: Warehouse (Stock In/Out)
**Screenshot:** `screenshots/03-warehouse.png`

```
PAGE: Warehouse Operations
USER: Warehouse Operator
PURPOSE: Record paint stock-in (receiving) and stock-out (sending to painting) transactions

CURRENT ISSUES:
- The Stock In / Stock Out toggle buttons could be more visually distinct
- The paint selector dropdown is hard to read — color swatches are small
- Quantity stepper buttons (-/+) are too small for gloved hands
- Quick quantity buttons (1, 2, 5, 10, 20) look like generic buttons, not clearly "shortcuts"
- The notes field is not prominent enough
- The submit button, while large, could have more visual weight
- The Recent Activity section is identical to dashboard — no differentiation

REDESIGN GOALS:
- Make the Stock In / Stock Out tabs much larger (full-width, 80px+ tall) with bold icons
- Redesign paint selector as a visual grid of paint cards (showing color swatch prominently)
- Make quantity stepper buttons 64px+ with large icons and bold number display
- Style quick quantity buttons as prominent "chips" with active state clearly highlighted
- Make the submit button 64px+ tall with a bold, action-oriented label
- Show current stock for selected paint as a prominent card, not just small badges
- Recent activity should show only warehouse-relevant transactions with clearer formatting
- Use green theme for Stock In mode, blue theme for Stock Out mode (entire page tint changes)
```

---

## Page 4: Sideroom (Receive/Dispose)
**Screenshot:** `screenshots/04-sideroom.png`

```
PAGE: Sideroom Operations
USER: Sideroom Operator
PURPOSE: Receive leftover paint from painting process, or dispose expired/mixed paint

CURRENT ISSUES:
- Same issues as Warehouse page (tabs, selector, stepper, buttons all too small)
- The Dispose mode should feel MORE dangerous/prominent — currently looks too similar to Receive
- The warning text about irreversibility is small and easy to miss
- No visual distinction between "safe" (receive) and "dangerous" (dispose) operations

REDESIGN GOALS:
- Apply same large-touch improvements as Warehouse page
- Make Dispose mode visually alarming: red tint, warning stripes, large warning icon
- Add a prominent "DANGER ZONE" visual treatment for the Dispose tab
- The dispose confirmation should be very large and clearly show "IRREVERSIBLE"
- Consider adding a confirmation step for Dispose (e.g., "Type the paint name to confirm")
- Receive mode should feel calm and safe (green tones)
- Make the form layout wider to accommodate larger touch targets
```

---

## Page 5: Admin — Paint Items Management
**Screenshot:** `screenshots/05-admin-paint-items.png`

```
PAGE: Paint Items CRUD (Admin)
USER: Admin only
PURPOSE: Add new paint items, activate/deactivate existing ones

CURRENT ISSUES:
- The table is dense and hard to scan — color swatches are tiny dots
- The "Add Paint Item" button is small and hard to find
- The "Deactivate" buttons are plain outline — not clearly distinguishable
- The "Back to Dashboard" link is small
- No search or filter capability visible
- The color hex values aren't shown — only tiny dots represent colors

REDESIGN GOALS:
- Make the table more visual: larger color swatches (32px circles), bigger text
- Make the "Add Paint Item" button prominent (large, colored, top-right)
- Add clear status badges: green "Active" / gray "Inactive" with toggle switches
- Show color hex code next to the swatch for identification
- Add a search/filter bar above the table
- Make action buttons larger and clearly labeled
- The table should feel like a product catalog, not a spreadsheet
- Keep the layout clean with good whitespace between rows (64px+ row height)
```

---

## Page 6: Admin — User Management
**Screenshot:** `screenshots/06-admin-users.png`

```
PAGE: User Management (Admin)
USER: Admin only
PURPOSE: Create new users with PIN and role, view existing users

CURRENT ISSUES:
- The user table is very sparse — only 3 users shown, lots of empty space
- PIN is shown as asterisks but there's no way to reset or view it
- Role badges are small and hard to differentiate at a glance
- The "Add User" button is small
- No user avatars or visual identifiers
- The "Created" date column uses small text

REDESIGN GOALS:
- Make user cards/rows more visual: add avatar placeholders with initials
- Use color-coded role badges that are large and clearly distinct (Admin=purple, Warehouse=blue, Sideroom=orange)
- Make the "Add User" button large and prominent
- Add PIN management: show masked PIN with a "Reset PIN" action
- Make the table feel like a team management dashboard
- Add user count per role as small stat badges above the table
- Row height should be 64px+ for comfortable scanning
- Consider a card-grid layout instead of a table for 3-10 users
```

---

## App Header / Navigation
**Reference:** Visible in screenshots 02-06

```
COMPONENT: App Header (sticky top navigation)
APPEARS ON: All pages except login

CURRENT ISSUES:
- Header has plain white background — no branding, no factory icon
- Navigation buttons are cramped on the right side
- The page title and user info are stacked vertically, wasting vertical space
- The Logout button is small and blends with navigation
- No clear visual indication of which page is active (just button color change)

REDESIGN GOALS:
- Add a bold dark header (deep navy #0f172a or similar) spanning full width
- Left section: [🏭 Factory Icon ~40px] + App name "Paint Stock Manager" in white bold + current page subtitle
- Center section: Role-based navigation tabs as large pill buttons (56px+ height, clearly highlighted active tab with contrasting color)
- Right section: User name + role label + Logout button (prominent, red-tinted, with icon)
- Header height: 72-80px for comfortable touch targets
- Add a subtle drop shadow for clear separation from content below
- Make navigation tabs feel like physical tabs (raised/selected appearance, smooth transitions)
- The Logout button should be clearly separated from navigation (visual gap + different style, confirm dialog on tap)
- Factory icon should be a simple SVG placeholder (building/smokestack silhouette) — will be replaced with real logo later
```

---

## Design System Notes (for consistency)

```
DESIGN SYSTEM GUIDELINES:
- Font: Use a clean sans-serif (Inter, or system default). Minimum body text 16px.
- Touch targets: Minimum 48px height, preferred 56-64px for primary actions
- Colors:
  - Primary: Deep blue (#1e40af or similar)
  - Success/Incoming: Green (#16a34a)
  - Outgoing/Info: Blue (#2563eb)
  - Danger/Destructive: Red (#dc2626)
  - Warning: Orange/Amber (#f59e0b)
  - Background: Light gray (#f8fafc) or white
- Cards: Rounded corners (12px), subtle shadow, white background
- Tables: Alternating row colors, 56px+ row height, 16px text
- Buttons: Rounded (8px), bold text, clear hover/active states
- Badges: Pill-shaped, color-coded, 14px text minimum
- Dark mode: Consider a dark variant for factory kiosk displays (dark bg + bright text)
```
