# TinyGUI - Simple Immediate Mode GUI for Canvas

A lightweight, simple immediate-mode GUI library for HTML5 Canvas.

## Features

- ✅ **True Immediate Mode** - Components are functions, no complex state management
- ✅ **Automatic Layout** - Stack-based layouts (vertical/horizontal/none)
- ✅ **Automatic Mouse Handling** - No manual click regions
- ✅ **Theme Support** - Customizable color themes
- ✅ **Canvas Scaling** - Fixed scale or auto-resize to fit window
- ✅ **Font Customization** - Configurable font size and family
- ✅ **Rich Components** - Buttons, sliders, checkboxes, dropdowns, scrollboxes, accordions
- ✅ **Simple & Small** - ~1100 lines total (core + drawing utilities)
- ✅ **Easy to Use** - Minimal API surface

## Components

- **label** - Display text with optional custom font size
- **button** - Interactive button with hover/held states
- **slider** - Horizontal slider with drag support
- **checkbox** - Toggle checkbox with optional label
- **dropdown** - Select menu with overlay rendering
- **scrollBox** - Scrollable container with mouse wheel and draggable scrollbar
- **accordion** - Expandable/collapsible container with auto-calculated height
- **rect** - Non-interactive rectangle for backgrounds/panels
- **spacer** - Add empty space in layouts

## Core Concepts

### Immediate Mode
Components are functions you call every frame. They return state objects indicating changes:

```javascript
const button = gui.button('myBtn', 'Click Me', { width: 100, height: 30 });
if (button.clicked) {
    console.log('Button was clicked!');
}
```

### Layout Stack
Use `pushLayout()` and `popLayout()` to automatically position components:

```javascript
gui.pushLayout(gui.VERTICAL, { gap: 10 });
    gui.button('btn1', 'Button 1', { width: 100, height: 30 });
    gui.button('btn2', 'Button 2', { width: 100, height: 30 });
gui.popLayout();
```

### Hotspots
The library automatically tracks clickable regions. You never manually check mouse coordinates.

## Quick Start

```javascript
import * as gui from './tinygui.js';

// State
let volume = 50;
let enabled = true;

// Initialize
const canvas = document.getElementById('canvas');
gui.initialize(canvas);

// Main loop
function draw() {
    gui.begin();
    
    gui.pushLayout(gui.VERTICAL, { x: 10, y: 10, gap: 10 });
    
    const slider = gui.slider('vol', { 
        width: 200, 
        min: 0, 
        max: 100,
        label: 'Volume' 
    }, volume);
    if (slider.changed) {
        volume = slider.value;
    }
    
    const checkbox = gui.checkbox('enabled', {}, enabled);
    if (checkbox.changed) {
        enabled = checkbox.value;
    }
    
    const button = gui.button('btn', 'Click Me', { width: 200, height: 30 });
    if (button.clicked) {
        console.log('Clicked!');
    }
    
    gui.popLayout();
    
    gui.end();
    
    requestAnimationFrame(draw);
}

draw();
```

## API Reference

### Initialization

#### `initialize(canvas, customColors?, options?)`
Initialize the GUI system with a canvas element. Optionally provide a custom color theme and scaling options.

**Parameters:**
- `canvas` - HTMLCanvasElement to render to
- `customColors` - Optional object with custom theme colors (merged with defaults)
- `options` - Optional configuration
  - `scale` - Fixed scale multiplier (default: 1)
  - `autoResize` - Auto-scale to fit window (default: false)
  - `fontSize` - Default font size in pixels (default: 14)
  - `fontFamily` - Font family (default: 'monospace')

**Default Colors:**
```javascript
{
    background: '#1A1A1A',
    panel: '#2A2A2A',
    button: '#3A3A3A',
    buttonHover: '#4A4A4A',
    buttonHeld: '#2A4A2A',
    border: '#666',
    text: '#DDD',
    textBright: '#FFF',
    accent: '#88AAFF',
    green: '#88AA88',
    red: '#AA8888',
}
```

**Examples:**
```javascript
// Default - no scaling, 14px font
gui.initialize(canvas);

// Fixed 2x scale (retro pixel art look)
gui.initialize(canvas, null, { scale: 2 });

// Auto-resize to fit window (maintains aspect ratio)
gui.initialize(canvas, null, { autoResize: true });

// Larger font for readability
gui.initialize(canvas, null, { fontSize: 18 });

// Custom font
gui.initialize(canvas, null, { 
    fontSize: 16, 
    fontFamily: 'Arial, sans-serif' 
});

// Custom theme with auto-resize and custom font
gui.initialize(canvas, {
    background: '#000000',
    accent: '#FF8844'
}, { 
    autoResize: true,
    fontSize: 16
});
```

### Frame Lifecycle

#### `begin()`
Start a new frame. Call at the beginning of your render loop.

#### `end()`
End the frame. Updates hover state and mouse cursor. Call at the end of your render loop.

### Helpers

#### `getColors()`
Get the current color theme object.

```javascript
const colors = gui.getColors();
gui.rect({ width: 100, height: 100, color: colors.panel });
```

#### `setScale(scale)`
Change the canvas scale at runtime.

```javascript
gui.setScale(2); // 2x pixel scaling
```

#### `setAutoResize(enabled)`
Enable or disable auto-resize at runtime.

```javascript
gui.setAutoResize(true); // Canvas will resize to fit window
```

#### `setFontSize(size)`
Change the default font size at runtime.

```javascript
gui.setFontSize(18); // Larger text
```

#### `setFontFamily(family)`
Change the default font family at runtime.

```javascript
gui.setFontFamily('Arial, sans-serif');
```

### Layout

```javascript
const colors = gui.getColors();
gui.rect({ width: 100, height: 100, color: colors.panel });
```

### Layout

#### `pushLayout(mode, options)`
Push a new layout onto the stack.

**Modes:**
- `gui.VERTICAL` - Stack components vertically
- `gui.HORIZONTAL` - Stack components horizontally
- `gui.NONE` - No automatic positioning

**Options:**
- `x` - X position (inherits from parent if not set)
- `y` - Y position (inherits from parent if not set)
- `gap` - Space between components (default: 0)
- `padding` - Internal padding (default: 0)

```javascript
gui.pushLayout(gui.VERTICAL, { x: 10, y: 10, gap: 5 });
```

#### `popLayout()`
Pop the current layout from the stack.

### Components

#### `label(id, text, options)`
Display text.

**Options:**
- `width` - Width (default: 100)
- `height` - Height (default: 20)
- `color` - Text color (default: '#DDD')
- `fontSize` - Font size in pixels (default: global fontSize)

**Returns:** `{ rect }`

```javascript
gui.label('lbl1', 'Hello World', { width: 200, height: 25 });
gui.label('title', 'Big Title', { fontSize: 24 });
```

#### `button(id, text, options)`
Interactive button.

**Options:**
- `width` - Width (default: 100)
- `height` - Height (default: 30)
- `color` - Background color (default: button color)
- `fontSize` - Font size in pixels (default: global fontSize)

**Returns:** `{ clicked: boolean }`

```javascript
const btn = gui.button('btn1', 'Click Me', { width: 150, height: 35 });
if (btn.clicked) {
    // Handle click
}

// Large button with big text
gui.button('bigBtn', 'START', { width: 200, height: 50, fontSize: 20 });
```

#### `slider(id, options, value)`
Horizontal slider.

**Options:**
- `width` - Width (default: 200)
- `height` - Height (default: 30)
- `min` - Minimum value (default: 0)
- `max` - Maximum value (default: 100)
- `label` - Label text (default: '')

**Returns:** `{ changed: boolean, value: number }`

```javascript
let volume = 50;
const slider = gui.slider('vol', { 
    width: 200, 
    min: 0, 
    max: 100,
    label: 'Volume'
}, volume);
if (slider.changed) {
    volume = slider.value;
}
```

#### `checkbox(id, options, value)`
Checkbox / toggle.

**Options:**
- `width` - Width (default: 30)
- `height` - Height (default: 30)
- `label` - Label text (default: '')

**Returns:** `{ changed: boolean, value: boolean }`

```javascript
let enabled = true;
const check = gui.checkbox('enabled', { label: 'Enabled' }, enabled);
if (check.changed) {
    enabled = check.value;
}
```

#### `dropdown(id, options, selectedIndex)`
Dropdown / select menu.

**Options:**
- `width` - Width (default: 200)
- `height` - Height (default: 30)
- `items` - Array of option strings (default: [])
- `label` - Label text above dropdown (default: null)

**Returns:** `{ changed: boolean, selectedIndex: number, selectedItem: string, isOpen: boolean }`

```javascript
let selectedOption = 0;
const dropdown = gui.dropdown('options', {
    width: 200,
    items: ['Option 1', 'Option 2', 'Option 3'],
    label: 'Choose an option'
}, selectedOption);
if (dropdown.changed) {
    selectedOption = dropdown.selectedIndex;
    console.log('Selected:', dropdown.selectedItem);
}
```

#### `scrollBox(id, options, contentDrawFn)`
Scrollable container with mouse wheel and draggable scrollbar.

**Options:**
- `width` - Width (default: 200)
- `height` - Height (default: 200)
- `contentHeight` - Total height of content (default: 400)
- `scrollbarWidth` - Width of scrollbar (default: 12)
- `label` - Label text above scroll box (default: null)

**Parameters:**
- `contentDrawFn` - Function to draw content inside the scroll box

**Returns:** `{ scrollY: number, maxScroll: number }`

```javascript
gui.scrollBox('myList', {
    width: 300,
    height: 200,
    contentHeight: 600,
    label: 'My Scrollable List'
}, () => {
    // Content drawn here will be scrollable
    for (let i = 0; i < 20; i++) {
        const btn = gui.button(`item${i}`, `Item ${i}`, { width: 280, height: 30 });
        if (btn.clicked) {
            console.log('Clicked item', i);
        }
    }
});
```

#### `accordion(id, options, isExpanded, contentDrawFn)`
Expandable/collapsible container with a header button. Content height is automatically calculated based on the content drawn.

**Options:**
- `width` - Width (default: 200)
- `height` - Header height (default: 30)
- `label` - Header label text (default: 'Accordion')
- `showBorder` - Show border around accordion (default: true)
- `fontSize` - Font size for header text (default: global fontSize)

**Parameters:**
- `isExpanded` - Initial expanded state (only used on first call)
- `contentDrawFn` - Function to draw content when expanded

**Returns:** `{ changed: boolean, isExpanded: boolean }`

```javascript
gui.accordion('myAccordion', {
    width: 300,
    height: 30,
    label: 'Click to Expand'
}, false, () => {
    // Content drawn here when accordion is expanded
    // Height is automatically calculated
    gui.label('info', 'This is inside the accordion!');
    
    const btn = gui.button('innerBtn', 'Inner Button', { width: 280, height: 30 });
    if (btn.clicked) {
        console.log('Button inside accordion clicked');
    }
});
```

#### `rect(options)`
Draw a rectangle (non-interactive).

**Options:**
- `width` - Width (default: 100)
- `height` - Height (default: 100)
- `color` - Fill color (default: panel color)
- `borderColor` - Border color (default: null)
- `borderWidth` - Border width (default: 0)

**Returns:** `{ rect }`

```javascript
gui.rect({ 
    width: 200, 
    height: 150, 
    color: '#222',
    borderColor: '#666',
    borderWidth: 2 
});
```

#### `spacer(width, height)`
Add empty space in the layout.

```javascript
gui.spacer(0, 20); // 20px vertical space
```

### Constants

- `gui.VERTICAL` - Vertical layout mode
- `gui.HORIZONTAL` - Horizontal layout mode
- `gui.NONE` - No layout mode
- `gui.LEFT` - Left mouse button
- `gui.MIDDLE` - Middle mouse button
- `gui.RIGHT` - Right mouse button

## Design Philosophy

TinyGUI is designed to be:

1. **Simple** - Minimal API, easy to understand
2. **Small** - ~1100 lines of code total (core GUI + drawing utilities)
3. **Fast** - No object pooling needed, modern JS is fast
4. **Practical** - Solves real problems without over-engineering
5. **Flexible** - Theme support, scaling, and font customization built-in

## Differences from javascript-simpleui

| Feature | simpleui | TinyGUI |
|---------|----------|---------|
| Size | ~1500 lines | ~1100 lines |
| Object Pooling | Yes | No |
| Command Buffering | Yes | No |
| Multi-driver | Canvas + WebGL | Canvas only |
| Micro-optimizations | `\|0` everywhere | Clean code |
| Soft Buttons | Yes | No |
| Gradients | Yes | No |
| Theme Support | Limited | Full customization |
| Scaling | No | Fixed scale + auto-resize |
| Font Customization | No | Global + per-component |
| Advanced Components | No | Dropdown, ScrollBox, Accordion |

## Examples

See `theme-demo.html` for a complete working example with all components and theme switching.

## License

MIT

## Credits

Inspired by [javascript-simpleui](https://github.com/remzmike/simpleui) by remzmike.
