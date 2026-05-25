# Wifme Styling & Responsive Mapping Guide

This guide is the single source of truth for all styling, layout, and responsive designs across the Wifme platform. All AI agents MUST read and follow these rules strictly to maintain visual excellence, responsiveness, and performance without introducing layout bugs.

---

## 1 · Styling Philosophy & Core Rules

1. **Tailwind-First Mandate**: Tailwind CSS v4 is the exclusive styling system. Every utility class must be a Tailwind utility.
2. **Absolute Inline Style Ban**:
   - **DO NOT** use inline `style={{ ... }}` for static layout, margins, padding, typography, colors, borders, or positioning.
   - **EXCEPTIONS**: Dynamic properties whose values are only known at runtime and cannot be written with standard class names (e.g., dynamic percentage bars like `style={{ width: `${progress}%` }}` or complex dynamic translate values calculated by drag gestures).
3. **Use CSS Custom Properties**: Never hardcode colors, border-radii, transitions, or shadows. Always use the semantic CSS variables defined in `src/app/globals.css` wrapped in Tailwind arbitrary value brackets.
   - **Incorrect**: `text-[#1B6B4A]`, `bg-[#FAF7F2]`, `rounded-[14px]`
   - **Correct**: `text-[var(--emerald)]`, `bg-[var(--ivory)]`, `rounded-[var(--radius-md)]`, `shadow-[var(--shadow-sm)]`

### Hex-to-Variable Mapping Table
| Name | Hex Value | Tailwind Class Equivalent | Purpose |
|---|---|---|---|
| `--ivory` | `#FAF7F2` | `bg-[var(--ivory)]` | Base Page Background |
| `--ivory-dark`| `#F0EBE1` | `bg-[var(--ivory-dark)]` | Border/Section Accents |
| `--sand` | `#E8DCC8` | `bg-[var(--sand)]` | Warm Divider/Card Accents |
| `--sand-dark` | `#C8B89A` | `text-[var(--sand-dark)]` | Warm Muted text |
| `--emerald` | `#1B6B4A` | `bg-[var(--emerald)]` / `text-[var(--emerald)]` | Brand Primary |
| `--emerald-light`| `#2A8A60` | `bg-[var(--emerald-light)]` | Brand Primary Hover State |
| `--emerald-pale`| `#EBF5EF` | `bg-[var(--emerald-pale)]` | Accent Badges / Active tab bg |
| `--gold` | `#C4973B` | `text-[var(--gold)]` / `bg-[var(--gold)]` | Brand Secondary Accent |
| `--gold-light` | `#E4B55A` | `bg-[var(--gold-light)]` | Secondary Hover State |
| `--brown` | `#6B4C2A` | `text-[var(--brown)]` | Warm Body/Secondary text |
| `--charcoal` | `#2C2C2C` | `text-[var(--charcoal)]` | Main Heading Typography |
| `--text-body` | `#4A4A4A` | `text-[var(--text-body)]` | Standard Body Copy |
| `--text-muted` | `#8A8A8A` | `text-[var(--text-muted)]` | Captions/Muted Labels |
| `--border` | `#E0D8CC` | `border-[var(--border)]` | Card & Separator Borders |

---

## 2 · Desktop vs. Mobile Layout Matrix

Wifme uses distinct navigation, header, and content patterns depending on the user's role and viewport. Never mix these up!

### Responsive Breakdown by User Role

| Role | Viewport | Sidebar | Top Header | Bottom Navigation |
|---|---|---|---|---|
| **Jamaah** | **Desktop** (> 900px) | Visible (Fixed Left) | `AmirHeaderPanel` (Sticky) | Hidden |
| **Jamaah** | **Mobile** (≤ 768px) | Off-canvas drawer (Open on burger tap) | `.mob-topbar` (Green gradient sticky) | `JamaahMobileNav` (Fixed Bottom) |
| **Muthawif**| **Desktop** (> 900px) | Hidden | `DashboardHeader` (Emerald gradient sticky) | Hidden |
| **Muthawif**| **Mobile** (≤ 768px) | Hidden | `DashboardHeader` (Glassmorphic, scrollable) | `MuthawifMobileNav` (Fixed Bottom) |
| **Amir** | **Desktop** (> 900px) | Visible (Fixed Left) | `AmirHeaderPanel` (Sticky, admin tools) | Hidden |
| **Amir** | **Mobile** (≤ 768px) | Off-canvas drawer (Open on burger tap) | `.mob-topbar` (Green gradient sticky) | `JamaahMobileNav` (Fixed Bottom) |

### Crucial Component Mappings & Target Files
- **Jamaah Sidebar Drawer**: `src/components/MobileSidebarDrawer.tsx`
  - Handles the `.mob-sidebar` sliding menu for Jamaah/Amir.
- **Jamaah Bottom Nav**: `src/app/dashboard/JamaahMobileNav.tsx`
  - Fixed mobile menu for Jamaah dashboard.
- **Muthawif Bottom Nav**: `src/app/dashboard/muthawif/MuthawifMobileNav.tsx`
  - Fixed mobile navigation specifically for Muthawif.
- **Muthawif Mobile Topbar Behavior**:
  - CSS rule in `globals.css`: `.muthawif-dashboard .mob-topbar { display: none !important; }`
  - The Muthawif dashboard completely suppresses the standard green `.mob-topbar` and instead displays the custom glassmorphic `DashboardHeader` at the top of the viewport.

---

## 3 · Responsive Breakpoints & Tailwind v4 Syntax

Wifme is **mobile-native-first**. Always code mobile styling as default, then build desktop enhancement using Tailwind modifiers.

### Breakpoint Specs
- **Mobile**: `≤ 640px` (or `≤ 768px` for dashboard sidebar transitions)
- **Tablet**: `641px – 900px`
- **Desktop**: `> 900px`

### Coding Responsiveness in JSX (Tailwind CSS v4)
- **Default classes** target **mobile** viewports.
- **`md:` modifier**: Targets **tablets and desktop** (min-width `768px` or `641px` depending on contexts).
- **`lg:` modifier**: Targets **desktop** (min-width `1024px` / `900px`+).
- **`max-*` modifiers**: Under Tailwind v4, use `max-md:` or `max-lg:` to target mobile-only or tablet-only behaviors where a mobile-first flow is awkward.
  - *Example (Hide on Desktop)*: `<div className="max-md:block hidden">Only visible on mobile</div>`
  - *Example (Show on Mobile)*: `<div className="md:hidden flex">Mobile Nav Bar</div>`

---

## 4 · Z-Index Hierarchy & Portal Rules

Z-index conflicts can break mobile interaction. Use the absolute values below strictly:

| Element Type | Z-Index Value | CSS Variable / Tailwind | Description |
|---|---|---|---|
| **Content Cards / Tables** | `0 - 50` | `z-0` to `z-50` | Regular content flow |
| **Sticky Headers** | `100 - 150` | `z-100` / `z-150` | `DashboardHeader` / `AmirHeaderPanel` |
| **Mobile Top Bar** | `200` | `z-[200]` | `.mob-topbar` (Jamaah/Amir sticky bar) |
| **Mobile Bottom Nav** | `230 - 250` | `z-[250]` | `JamaahMobileNav` / `MuthawifMobileNav` |
| **Mobile Sidebar Drawer** | `400` | `z-[400]` | `.mob-sidebar` sliding menu drawer |
| **Overlays & Modals (Portals)**| `9000+` | `z-[9000]` | Full-screen modals, profile drawers |

### The Backdrop-Filter containing block bug (Root Cause of Profile Drawer Bug)
> [!IMPORTANT]
> When a parent container has CSS filters (like `backdrop-filter: blur(18px)` or `transform: translate(0)`), it creates a new **containing block** under the CSS specification. This forces all child elements with `position: fixed` or `position: absolute` to align relative to the *filtered header* rather than the browser window, trapping them inside the header or causing layout cutoffs.

### The Portal Mandate
To prevent this containment issue, all full-screen slide-outs (e.g., the User Profile Drawer) and modals MUST be rendered via a React Portal to the root document body:

```typescript
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

export const ClientPortal = ({ children, isOpen }: PortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;
  return createPortal(children, document.body);
};
```

---

## 5 · Inline Style Cleanup Playbook

When cleaning up inline styles in future sessions, follow this standard playbook to convert inline styles into responsive, clean Tailwind CSS components.

### 5.1 Step-by-Step Conversion Flow
1. **Analyze**: Group the inline `style={{ ... }}` block's properties into Layout (flex, grid), Spacing (padding, margin), Colors (bg, text), and Borders.
2. **Translate**: Map each style property to its Tailwind utility class (see table below).
3. **Map Variables**: Convert static colors or dimensions to CSS variables (e.g. `color: '#1B6B4A'` becomes `text-[var(--emerald)]`).
4. **Implement Breakpoints**: If the inline style had a ternary logic based on window dimensions, translate it into standard responsive classes (e.g. `md:flex max-md:hidden`).
5. **Extract Complex Rules**: If the style contains a rule that cannot be written in Tailwind cleanly, define a descriptive, semantic class name in `globals.css` instead of writing it inline in the component.

### 5.2 Common Tailwind Equivalents for Inline Styles

| Inline Style CSS | Tailwind CSS Class |
|---|---|
| `display: 'flex'` | `flex` |
| `flexDirection: 'column'` | `flex-col` |
| `justifyContent: 'space-between'` | `justify-between` |
| `alignItems: 'center'` | `items-center` |
| `gap: '12px'` | `gap-3` (12px = 0.75rem = gap-3) |
| `borderRadius: '14px'` | `rounded-[var(--radius-md)]` |
| `border: '1px solid #E0D8CC'` | `border border-[var(--border)]` |
| `backgroundColor: '#FAF7F2'` | `bg-[var(--ivory)]` |
| `padding: '16px 20px'` | `py-4 px-5` |
| `boxShadow: '0 4px 16px rgba(44, 44, 44, 0.1)'` | `shadow-[var(--shadow-md)]` |
| `transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'` | `transition-all duration-250 ease-in-out` |
| `overflowY: 'auto'` | `overflow-y-auto` |
| `cursor: 'pointer'` | `cursor-pointer` |

### 5.3 Before & After Refactoring Example
Taken from the successful refactoring of the Profile Drawer in `AmirHeaderPanel.tsx` & `DashboardHeader.tsx`:

#### BEFORE (Fragile, long code, inline style containment bug)
```tsx
// Trapped inside backdrop-filter header, styling cluttering JSX
return (
  <div 
    style={{
      position: 'fixed',
      top: 0,
      right: 0,
      height: '100%',
      width: '320px',
      backgroundColor: '#FAF7F2',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: isOpen ? 'block' : 'none',
      padding: '24px'
    }}
  >
    <h3 style={{ color: '#1B6B4A', fontSize: '18px', fontWeight: 'bold' }}>Profil User</h3>
    {/* Profile content */}
  </div>
);
```

#### AFTER (Clean Tailwind classes, ported to root body, responsive, perfectly styled)
```tsx
import { createPortal } from "react-dom";

return createPortal(
  <div 
    className={`fixed top-0 right-0 h-full w-[320px] bg-[var(--ivory)] shadow-[var(--shadow-lg)] z-[9000] p-6 transition-transform duration-300 ${
      isOpen ? "translate-x-0" : "translate-x-full"
    }`}
  >
    <h3 className="text-[var(--emerald)] text-lg font-bold">Profil User</h3>
    {/* Profile content */}
  </div>,
  document.body
);
```

---

## 6 · Code Integrity & Formatting Checklists

When editing layout files, ALWAYS check:
1. Does this page look consistent on both **Mobile (390x844 viewport)** and **Desktop (1920x1080 viewport)**?
2. Are all interactive hit regions/buttons at least **44x44px**?
3. Did I avoid injecting raw inline `style={{ ... }}` blocks for static design?
4. Are all brand colors referenced via CSS custom property variables (`var(--emerald)`) instead of raw hex codes?
5. Did I avoid using any emojis or emoticons in user-facing copy or comments? (Wifme rule!)
