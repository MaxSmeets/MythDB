# MythDB CSS Structure

## Overview
All CSS files have been consolidated to **dark mode only** with centralized variable management for consistency and maintainability.

## Files

### `main.css` - Core Theme & Variables
Contains all root CSS variables and global element styling:
- **Color variables**: backgrounds, text, borders, semantic colors
- **Typography variables**: fonts, sizes, line heights
- **Spacing system**: standardized spacing scale (xs, sm, md, lg, xl)
- **Radius system**: standardized border radius values (sm, md, lg, xl, 2xl)
- **Global styles**: body, header, main, footer, form elements

**Key Feature**: All colors and spacing are defined here as CSS variables, making it trivial to adjust the entire theme from one place.

### `layout.css` - Component & Layout Styles
Organized into logical sections:
- **Layout structure**: flexbox containers, page layout
- **Navigation**: topbar, breadcrumbs
- **Cards & grids**: card components, grid layouts
- **Modal**: dialog styling
- **Project layout**: sidebar and tree structures
- **Media management**: upload panels, media grids
- **Responsive**: media queries for mobile breakpoints

All hardcoded values replaced with CSS variables from `main.css`.

### `markdown.css` - Markdown Content Styling
Styles for rendered markdown content:
- Headings, paragraphs, lists
- Code blocks and inline code
- Tables with proper dark mode styling
- Blockquotes with accent color
- Links with hover states
- Images and footnotes

Uses the same variable system as main.css for consistency.

### `graph.css` & `entry.css`
Currently empty placeholder files for future feature-specific styling.

## Variable System

### Colors
```css
--bg-app          /* Page background */
--bg-surface      /* Surface/container background */
--bg-surface-2    /* Secondary surface */
--bg-elevated     /* Elevated/highlight background */

--text-primary    /* Main text color */
--text-secondary  /* Secondary text */
--text-muted      /* Muted/disabled text */

--border-subtle   /* Subtle borders */
--border-strong   /* Prominent borders */

--accent          /* Primary accent color */
--accent-hover    /* Accent hover state */

--danger          /* Error/danger color */
--success         /* Success color */
```

### Spacing Scale
```css
--spacing-xs   /* 0.25rem */
--spacing-sm   /* 0.5rem */
--spacing-md   /* 0.75rem */
--spacing-lg   /* 1rem */
--spacing-xl   /* 1.5rem */
```

### Border Radius
```css
--radius-sm    /* 4px */
--radius-md    /* 6px */
--radius-lg    /* 8px */
--radius-xl    /* 10px */
--radius-2xl   /* 12px */
```

## How to Update the Theme

To change colors, spacing, or typography globally:

1. Edit the CSS variable values in `main.css` under `:root`
2. All files automatically inherit these changes
3. No need to find and replace hardcoded values across multiple files

## Dark Mode Only

All light mode code, fallback values, and conditional theming has been removed:
- ✅ Single theme definition
- ✅ Cleaner, more maintainable code
- ✅ Smaller file sizes
- ✅ Faster browser rendering
- ✅ No runtime theme switching overhead

## Best Practices

1. **Use variables**: Always reference CSS variables instead of hardcoding values
2. **Consistency**: Follow the spacing and radius scales
3. **Organization**: Add comments for major sections
4. **Responsive**: Use the media queries provided in `layout.css`
5. **Performance**: Minimize inline styles; use classes

## Future Enhancements

If light mode is needed in the future:
1. Add light mode variables to `:root` or new `@media (prefers-color-scheme: light)` block
2. Reference the same variables throughout
3. No changes needed to component CSS (they already use variables)
