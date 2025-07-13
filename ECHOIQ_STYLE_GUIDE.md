# EchoIQ Design System & Style Guide

A comprehensive style guide for the EchoIQ Shopify analytics platform, featuring a clean, minimal, and professional design system.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Component Library](#component-library)
5. [Layout System](#layout-system)
6. [CSS Variables](#css-variables)
7. [Tailwind Configuration](#tailwind-configuration)
8. [Implementation Guide](#implementation-guide)

## Design Philosophy

EchoIQ follows a **light, bright, and minimal** design philosophy with these core principles:

- **Clarity First**: Clean layouts with ample white space
- **Data-Driven**: Visual hierarchy that emphasizes important metrics
- **Professional**: Sophisticated color palette suitable for business applications
- **Accessible**: High contrast ratios and readable typography
- **Consistent**: Systematic approach to spacing, colors, and components

## Color Palette

### Brand Colors
```css
/* Primary Grayscale */
--color-black: 0 0% 0%           /* #000000 */
--color-dark-gray: 215 25% 17%   /* #1f2937 */
--color-medium-gray: 215 14% 46% /* #6b7280 */
--color-light-gray: 210 20% 98%  /* #f8fafc */
--color-white: 0 0% 100%         /* #ffffff */

/* Accent Colors */
--color-accent-blue: 221 83% 53%    /* #3b82f6 */
--color-accent-green: 160 84% 39%   /* #10b981 */
--color-accent-purple: 262 83% 58%  /* #8b5cf6 */
--color-accent-orange: 38 92% 50%   /* #f59e0b */
```

### Semantic Colors
```css
/* Light Theme */
--background: var(--color-white)
--foreground: var(--color-black)
--primary: var(--color-black)
--primary-foreground: var(--color-white)
--secondary: var(--color-light-gray)
--secondary-foreground: var(--color-dark-gray)
--muted: var(--color-light-gray)
--muted-foreground: var(--color-medium-gray)
--border: 220 13% 91%
--input: 220 13% 91%
```

### Chart Colors
```css
--chart-1: var(--color-accent-blue)    /* Primary charts */
--chart-2: var(--color-accent-green)   /* Secondary data */
--chart-3: var(--color-accent-purple)  /* Tertiary data */
--chart-4: var(--color-accent-orange)  /* Accent data */
--chart-5: var(--color-medium-gray)    /* Neutral data */
```

## Typography

### Font Family
```css
--font-primary: 'Inter', sans-serif;
```

### Font Weights & Sizes
```css
/* Headings */
h1 { @apply text-5xl font-extralight leading-tight; }
h2 { @apply text-3xl font-light leading-tight; }
h3 { @apply text-xl font-medium leading-snug; }
h4 { @apply text-lg font-medium leading-snug; }

/* Body */
body { @apply font-light; }
p { @apply font-light; }

/* Utilities */
.text-minimal { @apply font-light text-gray-900; }
.text-minimal-secondary { @apply font-light text-gray-600; }
```

### Typography Scale
- **Display**: 5xl (48px) - Hero headings
- **Heading 1**: 3xl (30px) - Page titles
- **Heading 2**: xl (20px) - Section titles
- **Heading 3**: lg (18px) - Subsection titles
- **Body**: base (16px) - Regular text
- **Small**: sm (14px) - Secondary text
- **Tiny**: xs (12px) - Labels and captions

## Component Library

### Buttons

#### Primary Button
```css
.btn-primary {
  @apply bg-black text-white px-8 py-3 font-light border-0 
         transition-all duration-200 hover:bg-gray-800;
}
```

#### Secondary Button
```css
.btn-secondary {
  @apply bg-transparent text-gray-700 px-8 py-3 font-light 
         border border-gray-300 transition-all duration-200 
         hover:bg-black hover:text-white;
}
```

#### Button Variants (shadcn/ui)
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "text-foreground border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    }
  }
)
```

### Cards

#### Minimal Card
```css
.card-minimal {
  @apply bg-white border border-gray-200 p-6 
         transition-shadow duration-200 hover:shadow-sm;
}
```

#### Card Component (shadcn/ui)
```typescript
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[calc(var(--radius))] border-border border bg-card text-card-foreground shadow",
        className
      )}
      {...props}
    />
  )
)
```

### KPI Cards

#### Enhanced KPI Card Structure
```typescript
interface EnhancedKPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  isMonetary?: boolean;
  size?: 'small' | 'normal';
  trend?: number[];
  data?: any[];
  filename?: string;
}
```

#### KPI Card Styling
```css
/* KPI Card Container */
.kpi-card {
  @apply transition-all duration-200 hover:shadow-sm group;
}

/* KPI Value Display */
.kpi-value {
  @apply text-2xl font-bold tracking-tight text-foreground;
}

/* KPI Trend Indicators */
.kpi-trend-positive {
  @apply bg-green-50 text-green-700;
}

.kpi-trend-negative {
  @apply bg-red-50 text-red-700;
}

.kpi-trend-neutral {
  @apply bg-gray-50 text-gray-700;
}
```

## Layout System

### Spacing Scale
```css
--spacing-xs: 0.5rem;    /* 8px */
--spacing-sm: 1rem;      /* 16px */
--spacing-md: 1.5rem;    /* 24px */
--spacing-lg: 2rem;      /* 32px */
--spacing-xl: 3rem;      /* 48px */
--spacing-2xl: 4rem;     /* 64px */
--spacing-3xl: 5rem;     /* 80px */
--spacing-4xl: 6rem;     /* 96px */
```

### Grid Systems

#### Dashboard Grid
```css
/* KPI Grid */
.kpi-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

/* Chart Grid */
.chart-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

/* Full Width Chart */
.chart-full {
  @apply col-span-full;
}
```

#### Responsive Breakpoints
```css
/* Mobile First Approach */
.responsive-grid {
  @apply grid grid-cols-1 gap-4;
  @apply sm:grid-cols-2 sm:gap-6;
  @apply md:grid-cols-3 md:gap-6;
  @apply lg:grid-cols-4 lg:gap-8;
  @apply xl:grid-cols-5 xl:gap-8;
}
```

### Container Layouts
```css
/* Page Container */
.page-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Content Container */
.content-container {
  @apply space-y-6;
}

/* Section Container */
.section-container {
  @apply py-8 space-y-6;
}
```

## CSS Variables

### Complete Variable Set
```css
:root {
  /* Brand Colors */
  --color-black: 0 0% 0%;
  --color-dark-gray: 215 25% 17%;
  --color-medium-gray: 215 14% 46%;
  --color-light-gray: 210 20% 98%;
  --color-white: 0 0% 100%;
  
  /* Accent Colors */
  --color-accent-blue: 221 83% 53%;
  --color-accent-green: 160 84% 39%;
  --color-accent-purple: 262 83% 58%;
  --color-accent-orange: 38 92% 50%;
  
  /* Semantic Colors */
  --background: var(--color-white);
  --foreground: var(--color-black);
  --card: var(--color-white);
  --card-foreground: var(--color-black);
  --popover: var(--color-white);
  --popover-foreground: var(--color-black);
  --primary: var(--color-black);
  --primary-foreground: var(--color-white);
  --secondary: var(--color-light-gray);
  --secondary-foreground: var(--color-dark-gray);
  --muted: var(--color-light-gray);
  --muted-foreground: var(--color-medium-gray);
  --accent: var(--color-light-gray);
  --accent-foreground: var(--color-black);
  --destructive: 0 84% 60%;
  --destructive-foreground: var(--color-white);
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: var(--color-black);
  --radius: 0rem;
  
  /* Chart Colors */
  --chart-1: var(--color-accent-blue);
  --chart-2: var(--color-accent-green);
  --chart-3: var(--color-accent-purple);
  --chart-4: var(--color-accent-orange);
  --chart-5: var(--color-medium-gray);
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 4rem;
  --spacing-3xl: 5rem;
  --spacing-4xl: 6rem;
  
  /* Typography */
  --font-primary: 'Inter', sans-serif;
  --transition: all 0.2s ease;
}
```

### Dark Mode Variables
```css
.dark {
  --background: var(--color-dark-gray);
  --foreground: var(--color-white);
  --card: var(--color-dark-gray);
  --card-foreground: var(--color-white);
  --popover: var(--color-dark-gray);
  --popover-foreground: var(--color-white);
  --primary: var(--color-white);
  --primary-foreground: var(--color-black);
  --secondary: 215 25% 27%;
  --secondary-foreground: var(--color-white);
  --muted: 215 25% 27%;
  --muted-foreground: 215 14% 66%;
  --accent: 215 25% 27%;
  --accent-foreground: var(--color-white);
  --border: 215 25% 27%;
  --input: 215 25% 27%;
  --ring: var(--color-white);
}
```

## Tailwind Configuration

### Complete tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## Implementation Guide

### 1. Setup Dependencies

```bash
npm install tailwindcss @tailwindcss/typography tailwindcss-animate
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-collapsible
npm install lucide-react
```

### 2. Import Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
```

### 3. Base Styles Setup

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  
  html {
    font-family: var(--font-primary);
  }
  
  body {
    @apply bg-background text-foreground font-light;
    font-family: var(--font-primary);
    line-height: 1.6;
  }
}
```

### 4. Component Usage Examples

#### KPI Card Implementation
```typescript
import { EnhancedKPICard } from '@/components/EnhancedKPICard'
import { TrendingUp } from 'lucide-react'

<EnhancedKPICard
  title="Revenue"
  value={124500}
  previousValue={110000}
  icon={<TrendingUp />}
  isMonetary={true}
  trend={[100, 120, 110, 130, 125]}
  data={revenueData}
/>
```

#### Chart Card Implementation
```typescript
import { ChartCard } from '@/components/Layout/ChartCard'

<ChartCard
  title="Sales Trend"
  description="Monthly sales performance"
  hasData={data.length > 0}
>
  <YourChartComponent data={data} />
</ChartCard>
```

#### Button Usage
```typescript
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">
  Primary Action
</Button>

<Button variant="outline" size="default">
  Secondary Action
</Button>
```

### 5. Layout Patterns

#### Dashboard Layout
```typescript
<div className="page-container">
  <div className="content-container">
    {/* KPI Grid */}
    <div className="kpi-grid">
      {kpis.map(kpi => <EnhancedKPICard key={kpi.id} {...kpi} />)}
    </div>
    
    {/* Charts Grid */}
    <div className="chart-grid">
      <ChartCard title="Revenue Trend">
        <LineChart data={revenueData} />
      </ChartCard>
      <ChartCard title="Order Volume">
        <BarChart data={orderData} />
      </ChartCard>
    </div>
  </div>
</div>
```

### 6. Responsive Design

#### Mobile-First Approach
```css
/* Base (Mobile) */
.responsive-container {
  @apply p-4 space-y-4;
}

/* Tablet */
@media (min-width: 768px) {
  .responsive-container {
    @apply p-6 space-y-6;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .responsive-container {
    @apply p-8 space-y-8;
  }
}
```

### 7. Chart Styling

#### Recharts Integration
```typescript
const chartColors = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  neutral: 'hsl(var(--chart-5))',
}

<LineChart data={data}>
  <Line stroke={chartColors.primary} strokeWidth={3} />
  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
  <XAxis fontSize={12} stroke="#6b7280" />
  <YAxis fontSize={12} stroke="#6b7280" />
</LineChart>
```

### 8. Utility Classes

#### Custom Utility Classes
```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .transition-base {
    @apply transition-all duration-200 ease-in-out;
  }
  
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
  }
  
  .gradient-primary {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--chart-1)) 100%);
  }
}
```

## Best Practices

### 1. Consistency
- Always use CSS variables for colors
- Maintain consistent spacing using the spacing scale
- Use the defined typography scale for all text

### 2. Accessibility
- Ensure sufficient color contrast (4.5:1 minimum)
- Use semantic HTML elements
- Include proper ARIA labels and roles

### 3. Performance
- Use CSS custom properties for dynamic theming
- Leverage Tailwind's purge functionality
- Optimize for minimal CSS bundle size

### 4. Maintainability
- Keep component styles modular
- Use TypeScript for component props
- Document component APIs thoroughly

### 5. Responsive Design
- Design mobile-first
- Use logical breakpoints
- Test across different screen sizes

## File Structure

```
src/
├── styles/
│   └── globals.css          # Global styles and CSS variables
├── components/
│   ├── ui/                  # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── Layout/              # Layout components
│   │   ├── ChartCard.tsx
│   │   ├── KPIGrid.tsx
│   │   └── ...
│   └── EnhancedKPICard.tsx  # Complex components
├── lib/
│   └── utils.ts             # Utility functions (cn, etc.)
└── tailwind.config.js       # Tailwind configuration
```

This style guide provides everything needed to replicate the EchoIQ design system in other projects while maintaining consistency and professional appearance.