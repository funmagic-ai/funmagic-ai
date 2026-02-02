# UI Architecture Documentation

## Core Dependencies

| Package | apps/web | apps/admin |
|---------|----------|------------|
| **Next.js** | 16.1.6 | 16.1.6 |
| **React** | 19.2.4 | 19.2.4 |
| **Tailwind CSS** | 4.1.18 | 4.1.18 |
| **@base-ui/react** | 1.1.0 | 1.1.0 |
| **lucide-react** | 0.563.0 | 0.563.0 |
| **better-auth** | 1.4.18 | 1.4.18 |
| **next-intl** | 4.7.0 | - |

---

## shadcn/ui Configuration

### components.json

| Setting | Value |
|---------|-------|
| **Style** | `base-nova` |
| **Tailwind baseColor** | `neutral` |
| **CSS Variables** | `true` |
| **Icon Library** | `lucide` |
| **RSC** | `true` |

### Aliases

```json
{
  "components": "@/components",
  "ui": "@/components/ui",
  "lib": "@/lib",
  "hooks": "@/hooks",
  "utils": "@/lib/cn"
}
```

### Custom Registries (apps/web)

```json
{
  "@better-upload": "https://better-upload.com/r/{name}.json"
}
```

---

## Tailwind Configuration

Using **Tailwind CSS v4** with new syntax:

```css
/* globals.css */
@import 'tailwindcss';

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --color-primary: var(--primary);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... */
}
```

**No separate tailwind.config.ts** - configuration is inline via `@theme` directive.

---

## Theme System

### CSS Variables

#### Light Mode (Default)

| Variable | Value | Usage |
|----------|-------|-------|
| `--primary` | `#3713ec` | Buttons, links, accents |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--background` | `#f6f6f8` | Page background |
| `--foreground` | `#0f172a` | Text color |
| `--card` | `#ffffff` | Card surfaces |
| `--card-foreground` | `#0f172a` | Card text |
| `--border` | `#e2e8f0` | Borders, dividers |
| `--muted` | `#f1f5f9` | Muted backgrounds |
| `--muted-foreground` | `#64748b` | Secondary text |
| `--accent` | `#8b5cf6` | Accent highlights |
| `--accent-foreground` | `#ffffff` | Text on accent |
| `--input` | `#e2e8f0` | Input borders |
| `--ring` | `#3713ec` | Focus rings |
| `--destructive` | `#ef4444` | Error states |

#### Dark Mode (`.dark` class)

| Variable | Value |
|----------|-------|
| `--background` | `#131022` |
| `--foreground` | `#ffffff` |
| `--card` | `#1e1b2e` |
| `--card-foreground` | `#ffffff` |
| `--border` | `#2b2839` |
| `--muted` | `#2b2839` |
| `--muted-foreground` | `#a19db9` |
| `--input` | `#2b2839` |
| `--ring` | `#8b5cf6` |

#### Accent Themes (`data-accent` attribute)

| Theme | Primary | Accent |
|-------|---------|--------|
| `purple` | `#3713ec` | `#8b5cf6` |
| `blue` | `#2563eb` | `#3b82f6` |
| `green` | `#16a34a` | `#22c55e` |
| `orange` | `#ea580c` | `#f97316` |
| `pink` | `#db2777` | `#ec4899` |

### Custom Utility Classes

```css
.glass-panel     /* Glassmorphism: backdrop-blur + border */
.neon-hover      /* Glow effect on hover */
.primary-glow    /* Primary color box shadow */
.scrollbar-hide  /* Hide scrollbar */
.custom-scrollbar /* Styled scrollbar */
.line-clamp-2    /* Text truncation (2 lines) */
.line-clamp-3    /* Text truncation (3 lines) */
```

---

## Installed UI Components

### apps/web (20 components)

| Component | File | Usage |
|-----------|------|-------|
| `avatar` | avatar.tsx | User avatars |
| `badge` | badge.tsx | Status indicators |
| `button` | button.tsx | Actions, CTAs |
| `card` | card.tsx | Content containers |
| `checkbox` | checkbox.tsx | Form checkboxes |
| `collapsible` | collapsible.tsx | Expandable sections |
| `dialog` | dialog.tsx | Modals, confirmations |
| `dropdown-menu` | dropdown-menu.tsx | Context menus |
| `field` | field.tsx | Form field wrapper |
| `input` | input.tsx | Text inputs |
| `input-group` | input-group.tsx | Input with addons |
| `label` | label.tsx | Form labels |
| `popover` | popover.tsx | Tooltips, popovers |
| `select` | select.tsx | Dropdowns |
| `separator` | separator.tsx | Dividers |
| `skeleton` | skeleton.tsx | Loading placeholders |
| `switch` | switch.tsx | Toggle switches |
| `tabs` | tabs.tsx | Tab navigation |
| `textarea` | textarea.tsx | Multi-line input |
| `upload-dropzone` | upload-dropzone.tsx | File upload (better-upload) |

### apps/admin (11 components)

| Component | File |
|-----------|------|
| `badge` | badge.tsx |
| `button` | button.tsx |
| `card` | card.tsx |
| `dialog` | dialog.tsx |
| `dropdown-menu` | dropdown-menu.tsx |
| `field` | field.tsx |
| `input` | input.tsx |
| `label` | label.tsx |
| `select` | select.tsx |
| `separator` | separator.tsx |
| `table` | table.tsx |

---

## apps/web Pages

### Layout: `[locale]/layout.tsx`

- **Provider:** `NextIntlClientProvider`
- **Font:** Inter (Google Fonts)
- **Theme:** FOUC prevention script
- **i18n:** Message loading via `LocaleContent`

### Homepage: `/[locale]`

| Cache | TTL | Tag |
|-------|-----|-----|
| `'use cache'` | 5 min | `homepage` |

**Components:**
- `Header` (via Suspense + `HeaderSkeleton`)
- `Footer` (via Suspense + `FooterSkeleton`)
- `HeroCarousel` - Main promotional banners
- `SideBanner` - Side promotional content
- `ToolCard` - Featured tool cards
- `CategoryFilterWrapper` - Category filter (client)

### Tools List: `/[locale]/tools`

| Cache | TTL | Tag |
|-------|-----|-----|
| `'use cache'` | 5 min | `tools-list` |

**Components:**
- `Header`, `Footer`
- `CategoryFilterWrapper` - Filter by type
- `ToolCard` - Tool grid items
- `ToolsGridSkeleton` - Loading state

### Tool Detail: `/[locale]/tools/[slug]`

| Cache | TTL | Tag |
|-------|-----|-----|
| `'use cache'` | 5 min | `tool-${slug}` |

**Components:**
- `Header`, `Footer`
- Dynamic executor mapping:

```tsx
const TOOL_EXECUTORS = {
  'figme': FigMeExecutor,
  'background-remove': BackgroundRemoveExecutor,
}
```

**FigMeExecutor Components:**
- `executor.tsx` - Main orchestrator
- `input-view.tsx` - Prompt input
- `style-selector.tsx` - Style selection
- `confirmation-view.tsx` - User confirmation step
- `completion-view.tsx` - Result display
- `result-viewer.tsx` - Generated image viewer
- `error-view.tsx` - Error handling

**BackgroundRemoveExecutor Components:**
- `executor.tsx` - Main orchestrator
- `result-viewer.tsx` - Before/after comparison

### Auth Pages (Dynamic)

#### `/[locale]/auth/login`

**Rendering:** `'use client'`

**Components:**
- `LoginForm` (useActionState)
- `MagicLinkForm` - Email magic link
- `PasswordForm` - Email/password (collapsible)
- OAuth buttons: Google, Facebook

#### `/[locale]/auth/register`

**Rendering:** `'use client'`

**Components:**
- `RegisterForm` (useActionState)
- Email, password, name fields
- OAuth buttons: Google, GitHub

#### `/[locale]/auth/forgot-password`

**Components:**
- Email input
- Success state display

#### `/[locale]/auth/magic-link-sent`

**Components:**
- Success confirmation message

#### `/[locale]/auth/reset-password`

**Components:**
- `ResetPasswordForm`
- New password fields

### Protected Pages (Dynamic)

#### `/[locale]/(protected)/assets`

**Components:**
- Asset grid (images, audio, video, text)
- Download button
- Delete button

---

## apps/admin Pages

### Layout: `/dashboard/layout.tsx`

- **Auth:** `requireAdmin()` check
- **Structure:** Sidebar + Main content
- **Rendering:** `connection()` for dynamic

```
+-------------------------------------+
| Sidebar (w-64)  | Main Content      |
|                 | (flex-1)          |
| - Logo          |                   |
| - Nav links     | Page content      |
| - User menu     | (p-8)             |
+-------------------------------------+
```

### Dashboard: `/dashboard`

**Components:**
- Stats cards (users, tasks, credits, revenue)
- Recent transactions table

### Tools: `/dashboard/tools`

**Components:**
- `Table` - Tools list
- `Badge` - Active/Featured status
- Toggle actions (activate/feature)

### Tool Edit: `/dashboard/tools/[id]`

**Components:**
- Edit form (title, description, slug)
- `StyleEditor` - FigMe style configuration
- Config JSON viewer

**StyleEditor Components:**
- `style-editor.tsx` - Style list editor
- `style-card.tsx` - Individual style card

### Users: `/dashboard/users`

**Components:**
- `Table` - Users list
- `Badge` - Role display (user/admin/super_admin)
- Credits column
- Created date

### User Detail: `/dashboard/users/[id]`

**Components:**
- User detail view
- Edit capabilities

### Tasks: `/dashboard/tasks`

**Components:**
- `Table` - Tasks list
- Status filter
- Duration calculation
- Status badges

### Task Detail: `/dashboard/tasks/[id]`

**Components:**
- Task detail view
- Input/output display

### Billing: `/dashboard/billing`

**Components:**
- Revenue statistics
- Transaction history

### Providers: `/dashboard/providers`

**Components:**
- Provider list
- API key management

### Tool Types: `/dashboard/tool-types`

**Components:**
- Type list
- CRUD operations

### Content: `/dashboard/content`

**Components:**
- Banner management
- Content editor

### Queue: `/dashboard/queue`

**Components:**
- Job queue monitoring
- Status display

---

## Component Patterns

### Base UI `render` Prop

```tsx
// Correct - Base UI pattern
<DialogClose render={<Button variant="outline" />}>
  Close
</DialogClose>

// Wrong - Radix pattern (not used)
<DialogClose asChild>
  <Button>Close</Button>
</DialogClose>
```

### Data Attributes for States

```tsx
// Animations
className="data-open:animate-in data-closed:animate-out"

// Positioning
className="data-[side=bottom]:slide-in-from-top-2"

// ARIA states
className="aria-expanded:bg-muted"
className="aria-invalid:border-destructive"
```

### Server/Client Separation

| Component Type | Directive | Use Case |
|----------------|-----------|----------|
| Data fetching | (none) | Server component default |
| Cached data | `'use cache'` | Public pages |
| Interactive | `'use client'` | Forms, event handlers |
| Dynamic | `connection()` | Auth-dependent pages |

### Suspense Pattern

```tsx
<Suspense fallback={<HeaderSkeleton />}>
  <Header />
</Suspense>
```

### Hydration Fix

```tsx
// For components with browser-dependent state
const Filter = dynamic(
  () => import('./filter').then(m => m.Filter),
  { ssr: false }
)
```

---

## Typography

**Font:** Inter (Google Fonts)
**Weights:** 400, 500, 600, 700
**Features:** `'rlig' 1, 'calt' 1`

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700"
  rel="stylesheet"
/>
```

---

## Layout Components

### apps/web

| Component | Path | Purpose |
|-----------|------|---------|
| `Header` | layout/header.tsx | Main navigation |
| `Footer` | layout/footer.tsx | Site footer |
| `HeaderSkeleton` | layout/header-skeleton.tsx | Loading state |
| `FooterSkeleton` | layout/footer-skeleton.tsx | Loading state |
| `Logo` | layout/logo.tsx | Brand logo |
| `ThemeToggle` | layout/theme-toggle.tsx | Dark/light switch |
| `LocaleSwitcher` | layout/locale-switcher.tsx | Language select |
| `NavLink` | layout/nav-link.tsx | Navigation links |
| `AccentPicker` | layout/accent-picker.tsx | Color theme |
| `CopyrightYear` | layout/copyright-year.tsx | Dynamic year |

### apps/admin

| Component | Path | Purpose |
|-----------|------|---------|
| `Sidebar` | sidebar.tsx | Admin navigation |
| `LoginForm` | login-form.tsx | Admin login |
