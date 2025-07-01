# EchoIQ Branding Guide

This document contains the complete branding guidelines for EchoIQ that can be used across multiple applications.

## Logo & Brand Identity

### Logo Component (React/Next.js)
```jsx
const EchoIQLogo = () => {
  return (
    <div className="flex items-center space-x-3">
      {/* Pulsing Logo */}
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm opacity-90"></div>
        </div>
        <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg animate-pulse opacity-30"></div>
      </div>
      <div>
        <h1 className="text-2xl font-light text-black tracking-tight">EchoIQ</h1>
        <p className="text-sm font-light text-gray-600 mt-1">Intelligent Analytics</p>
      </div>
    </div>
  )
}
```

### Logo Variations
- **Full Logo**: Logo mark + "EchoIQ" + tagline
- **Logo + Name**: Logo mark + "EchoIQ" only
- **Logo Mark Only**: Just the pulsing gradient square

## Color Palette

### Primary Colors
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
}
```

### Tailwind CSS Classes
```css
/* Primary Colors */
.text-primary { color: hsl(0, 0%, 0%); }
.text-secondary { color: hsl(215, 14%, 46%); }
.bg-primary { background-color: hsl(0, 0%, 0%); }
.bg-secondary { background-color: hsl(210, 20%, 98%); }

/* Accent Colors */
.text-accent-blue { color: hsl(221, 83%, 53%); }
.text-accent-purple { color: hsl(262, 83%, 58%); }
.bg-accent-blue { background-color: hsl(221, 83%, 53%); }
.bg-accent-purple { background-color: hsl(262, 83%, 58%); }
```

### Hex Values
- **Primary Black**: `#000000`
- **Dark Gray**: `#2D3748`
- **Medium Gray**: `#718096`
- **Light Gray**: `#F7FAFC`
- **Accent Blue**: `#3182CE`
- **Accent Purple**: `#805AD5`
- **Accent Green**: `#38A169`
- **Accent Orange**: `#DD6B20`

## Typography

### Font Family
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
```

### Font Weights & Usage
- **Extra Light (100)**: Large headings, hero text
- **Light (300)**: Body text, descriptions, most UI text
- **Regular (400)**: Standard text
- **Medium (500)**: Emphasis, button text
- **Semi Bold (600)**: Section headings
- **Bold (700)**: Strong emphasis (rarely used)

### Typography Scale
```css
h1 { font-size: 3rem; font-weight: 100; letter-spacing: -0.025em; }
h2 { font-size: 1.875rem; font-weight: 300; letter-spacing: -0.025em; }
h3 { font-size: 1.25rem; font-weight: 500; }
h4 { font-size: 1.125rem; font-weight: 500; }
p { font-weight: 300; }
```

## Component Styles

### Buttons
```css
.btn-primary {
  background-color: #000000;
  color: #ffffff;
  padding: 0.75rem 2rem;
  font-weight: 300;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #1a1a1a;
}

.btn-secondary {
  background-color: transparent;
  color: #4a5568;
  padding: 0.75rem 2rem;
  font-weight: 300;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #000000;
  color: #ffffff;
}
```

### Cards
```css
.card-minimal {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  transition: box-shadow 0.2s ease;
}

.card-minimal:hover {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
```

## Design Principles

### 1. Minimalism
- Clean, uncluttered layouts
- Generous white space
- Focus on content over decoration

### 2. Typography-First
- Light font weights throughout
- Excellent readability
- Clear hierarchy

### 3. Subtle Interactions
- Gentle hover effects
- Smooth transitions (200ms)
- No jarring animations

### 4. Data-Focused
- Charts and visualizations are prominent
- Clear data presentation
- Consistent color coding

## Usage Guidelines

### Logo Usage
- **Minimum size**: 24px height for digital
- **Clear space**: Equal to the height of the logo mark
- **Background**: Works best on white or very light backgrounds
- **Don't**: Stretch, rotate, or modify colors

### Color Usage
- **Primary**: Black for text, white for backgrounds
- **Accents**: Use sparingly for highlights and data visualization
- **Gray scale**: For secondary information and subtle UI elements

### Typography
- **Headings**: Always use light weights
- **Body text**: Light (300) weight for readability
- **Emphasis**: Use medium (500) weight, not bold

## Implementation Examples

### React Component Structure
```jsx
// Typical page layout
<div className="flex h-screen bg-gray-50">
  <Sidebar />
  <div className="flex-1 ml-[240px]">
    <Header />
    <div className="p-8">
      <h1 className="text-3xl font-light text-black mb-2">Page Title</h1>
      <p className="text-gray-600 font-light">Page description</p>
      {/* Content */}
    </div>
  </div>
</div>
```

### CSS Custom Properties
```css
:root {
  --font-primary: 'Inter', sans-serif;
  --transition: all 0.2s ease;
  --radius: 0rem; /* Sharp corners for modern look */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
}
```

## File Structure for Branding
```
/branding/
  /logos/
    - echoiq-logo.svg
    - echoiq-logo-mark.svg
    - echoiq-logo-white.svg
  /colors/
    - palette.css
    - tailwind-config.js
  /fonts/
    - inter-font-face.css
  /components/
    - Logo.tsx
    - BrandButton.tsx
    - BrandCard.tsx
```

This branding guide ensures consistency across all EchoIQ applications and provides a professional, modern aesthetic focused on data analytics and intelligence.