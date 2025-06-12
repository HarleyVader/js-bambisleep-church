# 🎨 Cyberpunk Neonwave Theme - Customization Guide

## 🚀 Quick Customization

The theme is built with CSS custom properties for easy customization. All colors, spacing, and effects are controlled through variables in the `:root` section.

## 🎯 Color Customization

To change the theme colors, modify these variables in `public/css/style.css`:

```css
:root {
    /* Primary Colors - Main neon colors */
    --color-primary-cyan: #00ffff;      /* Main cyan/blue */
    --color-primary-magenta: #ff00ff;   /* Main pink/magenta */
    --color-primary-green: #00ff00;     /* Main green */
    --color-primary-yellow: #ffff00;    /* Main yellow */
    
    /* Background Colors */
    --color-bg-dark: #0a0a0a;           /* Darkest background */
    --color-bg-purple: #1a0a2e;         /* Purple gradient */
    --color-bg-blue: #16213e;           /* Blue gradient */
    --color-bg-navy: #0f3460;           /* Navy gradient */
    
    /* Text Colors */
    --color-text-primary: #00ffff;      /* Main text color */
    --color-text-secondary: #ffffff;    /* Secondary text */
    --color-text-accent: #ff00ff;       /* Accent text */
}
```

## 📐 Spacing & Layout

Adjust spacing throughout the site:

```css
:root {
    /* Spacing (Mobile-first, reduced for compact design) */
    --spacing-xs: 4px;     /* Extra small spacing */
    --spacing-sm: 8px;     /* Small spacing */
    --spacing-md: 12px;    /* Medium spacing */
    --spacing-lg: 16px;    /* Large spacing */
    --spacing-xl: 20px;    /* Extra large spacing */
    --spacing-2xl: 24px;   /* 2X large spacing */
    --spacing-3xl: 32px;   /* 3X large spacing */
}
```

## 🔲 Border Radius

Control the roundness of elements:

```css
:root {
    --radius-sm: 4px;      /* Small corners */
    --radius-md: 8px;      /* Medium corners */
    --radius-lg: 12px;     /* Large corners */
    --radius-xl: 16px;     /* Extra large corners */
}
```

## 📱 Responsive Design

The theme automatically adjusts:

- **Mobile (≤480px)**: Single column layout, reduced spacing
- **Mobile Large (481-768px)**: Single column, larger spacing
- **Tablet (769-1024px)**: 2-column grid
- **Desktop Small (1025-1200px)**: 3-column grid
- **Desktop Large (≥1201px)**: 4-column grid

## 🎨 Example Color Themes

### 🌊 Ocean Theme

```css
--color-primary-cyan: #00ccff;
--color-primary-magenta: #0066cc;
--color-primary-green: #00ffcc;
--color-primary-yellow: #66ccff;
```

### 🔥 Fire Theme

```css
--color-primary-cyan: #ff6600;
--color-primary-magenta: #ff0066;
--color-primary-green: #ffcc00;
--color-primary-yellow: #ff3300;
```

### 💜 Purple Theme

```css
--color-primary-cyan: #9966ff;
--color-primary-magenta: #cc00ff;
--color-primary-green: #6633ff;
--color-primary-yellow: #ff66cc;
```

## ⚡ Performance Features

- **CSS Custom Properties**: Easy theming without rebuilding
- **Mobile-first responsive**: Optimized for all devices
- **Reduced spacing**: Compact, modern design
- **Border radius**: Smooth, rounded corners
- **Hardware acceleration**: Smooth animations

## 🛠️ Development Tips

1. **Test on mobile first** - The design is mobile-first
2. **Use browser dev tools** - Test responsive breakpoints
3. **Modify one variable at a time** - See changes instantly
4. **Check contrast** - Ensure text remains readable
5. **Test hover effects** - Especially on touch devices

## 📁 File Structure

```
public/css/style.css  - Main theme file with all customizations
views/pages/index.ejs - HTML structure with theme classes
```

## 🎯 Key Classes

- `.neon-text` - Flickering neon text effect
- `.glitch` - Digital glitch distortion
- `.scan-line` - Scanning beam effect
- `.card` - Main content cards with hover effects

Enjoy customizing your cyberpunk experience! 🚀
