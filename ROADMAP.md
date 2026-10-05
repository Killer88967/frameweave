# Frameweave Roadmap

This roadmap outlines the planned development of **Frameweave**, a visual UI editor for VS Code designed to make editing modern web applications feel closer to working in tools like Figma while still producing real, maintainable source code.

> [!NOTE]
> This roadmap is not a strict release schedule. Features may be reordered, changed, or removed as Frameweave evolves.

## Current Focus

The current priority is improving the core visual editing experience, making the editor reliable across desktop and mobile browsers, and strengthening source-to-canvas matching.

### Visual Editor

- [x] VS Code extension foundation
- [x] Webview-based editor
- [x] Project profile view
- [x] Component listing
- [x] Image / asset listing
- [x] CSS listing
- [x] Appearance section
- [x] Optimized webview bundle
- [x] Local `.vsix` development workflow
- [ ] Improve visual editor layout
- [ ] Improve mobile and tablet layouts
- [ ] Improve Safari compatibility
- [ ] Restore reliable navigation between editor sections
- [ ] Make panels resizable
- [ ] Add collapsible editor sections
- [ ] Better empty states
- [ ] Better loading states
- [ ] Better error handling

## Canvas

The canvas should become the primary workspace for visually editing applications.

- [ ] Render the application inside Frameweave
- [ ] Select elements directly from the canvas
- [ ] Hover highlighting
- [ ] Selection outlines
- [ ] Element bounding boxes
- [ ] Nested element selection
- [ ] Parent / child navigation
- [ ] Component boundaries
- [ ] Breadcrumb navigation
- [ ] Zoom controls
- [ ] Pan controls
- [ ] Fit canvas to viewport
- [ ] Reset viewport
- [ ] Canvas rulers
- [ ] Alignment guides
- [ ] Smart snapping
- [ ] Grid overlay
- [ ] Toggle visual debugging overlays

## Element Editing

- [ ] Move elements
- [ ] Resize elements
- [ ] Reorder elements
- [ ] Duplicate elements
- [ ] Delete elements
- [ ] Copy / paste elements
- [ ] Multi-select
- [ ] Group selections
- [ ] Move elements between containers
- [ ] Keyboard movement
- [ ] Fine movement controls
- [ ] Lock elements
- [ ] Hide elements
- [ ] Undo changes
- [ ] Redo changes

## Inspector

- [ ] Selected element information
- [ ] Element type
- [ ] Component name
- [ ] Source file
- [ ] Source line
- [ ] Element ID
- [ ] CSS classes
- [ ] Props
- [ ] Attributes
- [ ] Event handlers
- [ ] Computed styles
- [ ] Inherited styles

### Layout

- [ ] Display
- [ ] Position
- [ ] Width
- [ ] Height
- [ ] Min / max dimensions
- [ ] Margin
- [ ] Padding
- [ ] Gap
- [ ] Overflow
- [ ] Z-index
- [ ] Aspect ratio

### Flexbox

- [ ] Flex direction
- [ ] Justify content
- [ ] Align items
- [ ] Align content
- [ ] Flex wrap
- [ ] Flex grow
- [ ] Flex shrink
- [ ] Flex basis
- [ ] Order

### Grid

- [ ] Grid columns
- [ ] Grid rows
- [ ] Grid gap
- [ ] Column span
- [ ] Row span
- [ ] Grid alignment
- [ ] Named grid areas

### Appearance

- [x] Appearance panel foundation
- [ ] Background colors
- [ ] Gradients
- [ ] Text colors
- [ ] Borders
- [ ] Border radius
- [ ] Box shadows
- [ ] Opacity
- [ ] Filters
- [ ] Backdrop filters
- [ ] Cursor
- [ ] Visibility

### Typography

- [ ] Font family
- [ ] Font size
- [ ] Font weight
- [ ] Line height
- [ ] Letter spacing
- [ ] Text alignment
- [ ] Text decoration
- [ ] Text transform
- [ ] Text wrapping
- [ ] Text overflow

## Source Matching

Frameweave should understand where every editable element came from instead of behaving like a detached page builder.

- [x] Initial source matching work
- [ ] Match rendered DOM elements to JSX / TSX nodes
- [ ] Match elements to their owning component
- [ ] Match components to source files
- [ ] Match styles to source files
- [ ] Match Tailwind classes to elements
- [ ] Match CSS Module classes
- [ ] Detect inherited styles
- [ ] Detect inline styles
- [ ] Detect generated elements
- [ ] Detect mapped elements
- [ ] Detect conditional rendering
- [ ] Detect fragments
- [ ] Detect reusable components
- [ ] Detect component props
- [ ] Detect spread props
- [ ] Detect event handlers

## Source Editing

Visual changes should produce minimal, predictable source-code changes.

- [ ] AST-based JSX editing
- [ ] AST-based TSX editing
- [ ] Update HTML attributes
- [ ] Update React props
- [ ] Update class names
- [ ] Update inline styles
- [ ] Update CSS rules
- [ ] Update Tailwind classes
- [ ] Preserve comments
- [ ] Preserve formatting
- [ ] Avoid unnecessary file rewrites
- [ ] Detect unsafe transformations
- [ ] Preview source changes
- [ ] Show changed files
- [ ] Open changed file in editor
- [ ] Revert individual visual changes

## Source Navigation

- [ ] Open selected element in source
- [ ] Reveal component definition
- [ ] Reveal stylesheet
- [ ] Reveal imported components
- [ ] Jump from source to canvas
- [ ] Jump from canvas to source
- [ ] Show source path in inspector
- [ ] Show source line and column
- [ ] Highlight source when selecting an element

## Components

- [x] Detect project components
- [ ] Component browser
- [ ] Search components
- [ ] Drag components onto canvas
- [ ] Insert existing project components
- [ ] Create new components visually
- [ ] Extract selected elements into a component
- [ ] Rename components
- [ ] Duplicate components
- [ ] Delete components safely
- [ ] Show component props
- [ ] Edit component props
- [ ] Detect required props
- [ ] Detect prop types
- [ ] Generate prop controls automatically
- [ ] Component previews
- [ ] Component favorites
- [ ] Recently used components

## Assets

- [x] Detect project images
- [ ] Asset browser
- [ ] Image previews
- [ ] Search assets
- [ ] Drag images onto canvas
- [ ] Replace selected images
- [ ] Detect SVG assets
- [ ] Detect fonts
- [ ] Detect videos
- [ ] Detect audio assets
- [ ] Detect public directory assets
- [ ] Detect imported assets
- [ ] Asset metadata
- [ ] Unused asset detection

## Tailwind CSS

Frameweave should treat Tailwind as a first-class styling system rather than plain class strings.

### Detection

- [ ] Tailwind CSS v3 support
- [ ] Tailwind CSS v4 support
- [ ] Automatically detect Tailwind version
- [ ] Detect Tailwind configuration
- [ ] Detect custom theme values
- [ ] Detect custom colors
- [ ] Detect custom spacing
- [ ] Detect custom utilities
- [ ] Detect arbitrary values
- [ ] Detect Tailwind plugins

### Visual Editing

- [ ] Tailwind class editor
- [ ] Add utilities visually
- [ ] Remove utilities visually
- [ ] Search Tailwind utilities
- [ ] Detect conflicting utilities
- [ ] Automatically replace conflicting utilities
- [ ] Responsive variants
- [ ] Hover variants
- [ ] Focus variants
- [ ] Active variants
- [ ] Dark mode variants
- [ ] Group variants
- [ ] Peer variants
- [ ] Arbitrary variants
- [ ] Convert inspector changes into Tailwind classes

### Design Tokens

- [ ] Color palette browser
- [ ] Spacing scale
- [ ] Font families
- [ ] Font sizes
- [ ] Font weights
- [ ] Border radius values
- [ ] Shadow values
- [ ] Breakpoints
- [ ] Custom design tokens

## CSS

- [x] Detect project CSS
- [ ] Global stylesheet support
- [ ] CSS Module support
- [ ] Styled component detection
- [ ] CSS variable detection
- [ ] CSS variable editor
- [ ] CSS custom property browser
- [ ] Selector matching
- [ ] Pseudo-class editing
- [ ] Pseudo-element editing
- [ ] Media query editing
- [ ] Container query support
- [ ] Keyframe detection
- [ ] Animation editor

## Responsive Design

- [ ] Desktop viewport presets
- [ ] Laptop viewport presets
- [ ] Tablet viewport presets
- [ ] Mobile viewport presets
- [ ] Custom viewport dimensions
- [ ] Portrait / landscape switching
- [ ] Responsive breakpoint preview
- [ ] Side-by-side breakpoint preview
- [ ] Edit styles for specific breakpoints
- [ ] Detect breakpoint-specific Tailwind classes
- [ ] Detect media queries
- [ ] Responsive visibility controls

## Framework Support

### React

- [ ] Full React support
- [ ] JSX support
- [ ] TSX support
- [ ] Functional component detection
- [ ] Props detection
- [ ] Hooks awareness
- [ ] Context awareness

### Next.js

- [ ] Detect Next.js projects
- [ ] App Router support
- [ ] Pages Router support
- [ ] Layout detection
- [ ] Page detection
- [ ] Route detection
- [ ] Dynamic route detection
- [ ] Server Component awareness
- [ ] Client Component awareness
- [ ] `next/image` support
- [ ] `next/link` support
- [ ] Metadata awareness

### Vite

- [ ] Detect Vite projects
- [ ] React + Vite support
- [ ] Vite asset handling
- [ ] Vite environment variable awareness

### Future Frameworks

- [ ] Vue support
- [ ] Nuxt support
- [ ] Svelte support
- [ ] SvelteKit support
- [ ] Astro support
- [ ] Solid support

## Project Analysis

- [x] Project profile foundation
- [ ] Detect package manager
- [ ] Detect Node.js version
- [ ] Detect TypeScript version
- [ ] Detect framework version
- [ ] Detect React version
- [ ] Detect Tailwind version
- [ ] Detect dependencies
- [ ] Detect component libraries
- [ ] Detect styling systems
- [ ] Detect project aliases
- [ ] Detect source directories
- [ ] Detect routes
- [ ] Detect layouts
- [ ] Detect configuration files

## Component Library Support

- [ ] shadcn/ui detection
- [ ] shadcn/ui component awareness
- [ ] Radix UI detection
- [ ] Material UI detection
- [ ] Chakra UI detection
- [ ] Mantine detection
- [ ] Ant Design detection
- [ ] Bootstrap detection
- [ ] DaisyUI detection
- [ ] Framework-specific component metadata
- [ ] Automatically generate inspector controls from component props

## Events & Interactions

- [ ] Detect event handlers
- [ ] `onClick`
- [ ] `onChange`
- [ ] `onSubmit`
- [ ] `onFocus`
- [ ] `onBlur`
- [ ] Keyboard events
- [ ] Pointer events
- [ ] Drag events
- [ ] Add event handlers visually
- [ ] Remove event handlers
- [ ] Navigate to handler source
- [ ] Create new handlers
- [ ] Rename handlers safely

## States

- [ ] Hover state editing
- [ ] Focus state editing
- [ ] Active state editing
- [ ] Disabled state editing
- [ ] Selected state editing
- [ ] Dark mode preview
- [ ] Custom application state preview
- [ ] Simulate component props
- [ ] Simulate loading states
- [ ] Simulate empty states
- [ ] Simulate error states

## Layers

- [ ] Layers panel
- [ ] DOM hierarchy
- [ ] Component hierarchy
- [ ] Expand / collapse nodes
- [ ] Search layers
- [ ] Rename display labels
- [ ] Reorder elements
- [ ] Drag elements between parents
- [ ] Hide elements
- [ ] Lock elements
- [ ] Multi-select layers
- [ ] Jump to source from layer
- [ ] Highlight canvas element from layer

## History

- [ ] Undo
- [ ] Redo
- [ ] Visual edit history
- [ ] Source change history
- [ ] Show affected files
- [ ] Revert individual changes
- [ ] Restore editing sessions
- [ ] Compare before / after changes

## VS Code Integration

- [x] VS Code extension
- [x] Project profile view
- [ ] Command palette commands
- [ ] Context menu actions
- [ ] Explorer context actions
- [ ] Open file in Frameweave
- [ ] Open component in Frameweave
- [ ] Open route in Frameweave
- [ ] Status bar integration
- [ ] Problems panel integration
- [ ] Source control awareness
- [ ] Workspace settings
- [ ] Per-project Frameweave configuration
- [ ] Keyboard shortcuts

## VS Code for the Web

- [ ] Evaluate full `vscode.dev` support
- [ ] Detect web extension limitations
- [ ] Browser-compatible project analysis
- [ ] Browser-compatible source editing
- [ ] Web-compatible preview system
- [ ] GitHub repository support
- [ ] Codespaces integration
- [ ] Graceful fallback for unavailable Node APIs

## Mobile & Tablet Support

Frameweave should remain usable when accessing VS Code or Codespaces from devices such as iPads.

- [ ] Improved Safari support
- [ ] Better iPad layouts
- [ ] Better mobile layouts
- [ ] Touch-friendly controls
- [ ] Larger touch targets
- [ ] Swipe-friendly panels
- [ ] Responsive inspector
- [ ] Responsive project sidebar
- [ ] Canvas touch panning
- [ ] Pinch-to-zoom
- [ ] Mobile-friendly context menus
- [ ] Better virtual keyboard behavior
- [ ] Improved landscape support

## Performance

- [x] Reduce initial webview bundle size
- [ ] Faster project scanning
- [ ] Incremental project indexing
- [ ] Cache project metadata
- [ ] Cache source mappings
- [ ] Avoid unnecessary file parsing
- [ ] Lazy-load editor panels
- [ ] Lazy-load large component lists
- [ ] Improve canvas rendering performance
- [ ] Optimize large projects
- [ ] Background indexing
- [ ] Reduce extension activation time
- [ ] Reduce memory usage

## Developer Experience

- [ ] Improve monorepo configuration
- [ ] Shared TypeScript configuration
- [ ] Shared lint configuration
- [ ] Automated formatting checks
- [ ] Unit tests
- [ ] Integration tests
- [ ] Extension tests
- [ ] Webview tests
- [ ] Source transformation tests
- [ ] Framework detection tests
- [ ] Tailwind detection tests
- [ ] End-to-end tests
- [ ] Safari testing
- [ ] VS Code Web testing
- [ ] CI improvements
- [ ] Automated dependency updates
- [ ] Automated `.vsix` builds
- [ ] Preview / prerelease builds

## Extension Distribution

- [ ] Prepare VS Code Marketplace listing
- [ ] Marketplace icon and branding
- [ ] Screenshots
- [ ] Demo GIFs / videos
- [ ] Extension documentation
- [ ] Configuration documentation
- [ ] Marketplace publishing workflow
- [ ] Automated release workflow
- [ ] Prerelease channel
- [ ] Changelog generation
- [ ] Semantic versioning strategy

## Documentation

- [ ] Getting started guide
- [ ] Installation guide
- [ ] Supported frameworks
- [ ] Supported styling systems
- [ ] Visual editor guide
- [ ] Inspector guide
- [ ] Canvas guide
- [ ] Tailwind guide
- [ ] Configuration reference
- [ ] Troubleshooting guide
- [ ] Architecture documentation
- [ ] Contributor documentation
- [ ] Extension API documentation

## Longer-Term Ideas

These are ideas rather than committed features.

- [ ] Visual animation editor
- [ ] Timeline editor
- [ ] Keyframe editor
- [ ] Visual gradient editor
- [ ] Visual shadow editor
- [ ] Visual transform editor
- [ ] Design token manager
- [ ] Reusable style presets
- [ ] Shared design systems
- [ ] Component variants
- [ ] Component states
- [ ] Component playground
- [ ] Storybook integration
- [ ] Figma import
- [ ] Figma design token import
- [ ] Export components from designs
- [ ] Accessibility inspector
- [ ] Contrast checker
- [ ] Responsive layout suggestions
- [ ] Visual diffing
- [ ] Screenshot comparison
- [ ] Plugin / extension architecture
- [ ] Custom inspector controls
- [ ] Custom framework adapters
- [ ] Team configuration sharing
- [ ] Project templates

## Principles

Frameweave development should continue to prioritize:

1. **Real source code first** — Frameweave should edit the developer's existing application rather than replacing it with a proprietary project format.
2. **Visual editing without lock-in** — projects should continue working normally even if Frameweave is removed.
3. **Minimal source changes** — visual edits should modify only what is necessary and preserve existing code structure wherever possible.
4. **Framework awareness** — Frameweave should understand React, Next.js, Tailwind, and other supported technologies rather than treating everything as generic HTML.
5. **Developer control** — visual tools should complement the source editor, not hide it.
6. **Responsive editing** — desktop, tablet, and mobile layouts should all be first-class editing targets.
7. **Performance** — project analysis and visual editing should remain responsive even in large applications.
8. **Extensibility** — framework support, styling systems, component libraries, and future integrations should remain modular.
9. **Cross-platform usability** — Frameweave should work well in desktop VS Code while continuing to improve support for Codespaces, Safari, iPadOS, and VS Code for the Web.
10. **Predictability** — developers should always be able to understand what Frameweave changed in their source code.

---

Frameweave is actively developed and this roadmap will change as the project grows.
