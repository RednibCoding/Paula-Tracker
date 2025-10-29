/**
 * TinyGUI - Simple Immediate Mode GUI for Canvas
 * 
 * Core concepts:
 * - Components are functions that return state
 * - Layout stack for automatic positioning
 * - Hotspot system for automatic mouse handling
 * - Per-component state management
 */

import * as draw from './drawing.js';

// Layout modes
export const VERTICAL = 1;
export const HORIZONTAL = 2;
export const NONE = 0;

// Mouse buttons
export const LEFT = 0;
export const MIDDLE = 1;
export const RIGHT = 2;

// --- Core State ---

const state = {
    // Canvas
    canvas: null,
    ctx: null,
    canvasScale: 1,
    autoResize: false,
    baseWidth: 800,
    baseHeight: 600,
    
    // Text settings
    fontSize: 14,
    fontFamily: 'monospace',
    
    // Mouse
    mouseX: 0,
    mouseY: 0,
    mouseWheelDelta: 0,
    
    // Hotspots (clickable regions)
    hotspots: [],
    
    // Interaction state
    itemHovered: null,
    itemHeld: null,
    itemWentDown: null,
    itemWentDownUp: null,
    mouseWentUp: false,
    
    // Layout stack
    layoutStack: [],
    
    // Component state storage
    componentState: {},
    
    // Draw queue (for drawing overlays on top)
    drawQueue: [],
    
    // Colors
    colors: {
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
};

// --- Helper Functions ---

function applyCanvasScale() {
    if (!state.canvas) return;
    
    if (state.autoResize) {
        // Calculate scale to fit window
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const scaleX = windowWidth / state.baseWidth;
        const scaleY = windowHeight / state.baseHeight;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 95% to leave some margin
        
        state.canvas.style.width = `${state.baseWidth * scale}px`;
        state.canvas.style.height = `${state.baseHeight * scale}px`;
    } else {
        // Use fixed scale
        state.canvas.style.width = `${state.baseWidth * state.canvasScale}px`;
        state.canvas.style.height = `${state.baseHeight * state.canvasScale}px`;
    }
    
    // Keep canvas resolution at base size (for crisp pixels)
    state.canvas.width = state.baseWidth;
    state.canvas.height = state.baseHeight;
    
    // Re-apply font after canvas resize (canvas resize resets context)
    updateFont();
}

function updateFont() {
    if (!state.ctx) return;
    state.ctx.font = `${state.fontSize}px ${state.fontFamily}`;
}

// --- Initialization ---

export function initialize(canvas, customColors = null, options = {}) {
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');
    
    // Store base dimensions
    state.baseWidth = canvas.width;
    state.baseHeight = canvas.height;
    
    // Apply scaling options
    const {
        scale = 1,
        autoResize = false,
        fontSize = 14,
        fontFamily = 'monospace'
    } = options;
    
    state.canvasScale = scale;
    state.autoResize = autoResize;
    state.fontSize = fontSize;
    state.fontFamily = fontFamily;
    
    // Apply initial scale
    applyCanvasScale();
    
    // Set up auto-resize if enabled
    if (autoResize) {
        window.addEventListener('resize', () => applyCanvasScale());
        applyCanvasScale(); // Initial sizing
    }
    
    // Set up canvas rendering
    state.ctx.imageSmoothingEnabled = false;
    updateFont();
    
    // Apply custom colors if provided
    if (customColors) {
        state.colors = { ...state.colors, ...customColors };
    }
    
    // Mouse event handlers
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // Calculate mouse position relative to canvas
        let x = (e.clientX - rect.left) * scaleX;
        let y = (e.clientY - rect.top) * scaleY;
        
        state.mouseX = Math.floor(x);
        state.mouseY = Math.floor(y);
    });
    
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === LEFT) {
            state.itemWentDown = state.itemHovered;
            state.itemHeld = state.itemHovered;
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        if (e.button === LEFT) {
            if (state.itemHeld === state.itemHovered) {
                state.itemWentDownUp = state.itemHovered;
            }
            state.mouseWentUp = true;
            state.itemHeld = null;
        }
    });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        state.mouseWheelDelta = e.deltaY;
    }, { passive: false });
    
    // Pass canvas to drawing module
    draw.initialize(canvas);
}

// --- Frame Lifecycle ---

export function begin() {
    // Clear canvas
    draw.clear(state.colors.background);
    
    // Reset hotspots (these are rebuilt each frame)
    state.hotspots = [];
    
    // Reset draw queue
    state.drawQueue = [];
    
    // Root layout
    state.layoutStack = [];
}

export function end() {
    // Execute draw queue (overlays drawn on top)
    for (const drawFn of state.drawQueue) {
        drawFn();
    }
    
    // Update hovered item based on hotspots
    state.itemHovered = null;
    
    // Reverse iterate for z-index (last drawn = on top)
    for (let i = state.hotspots.length - 1; i >= 0; i--) {
        const hotspot = state.hotspots[i];
        if (rectangleContains(hotspot.rect, state.mouseX, state.mouseY)) {
            state.itemHovered = hotspot.id;
            break;
        }
    }
    
    // Update cursor
    if (state.itemHeld) {
        state.canvas.style.cursor = 'grabbing';
    } else if (state.itemHovered) {
        state.canvas.style.cursor = 'pointer';
    } else {
        state.canvas.style.cursor = 'default';
    }
    
    // Reset frame events AFTER components have been drawn
    // This ensures components can check these events during their draw
    state.itemWentDown = null;
    state.itemWentDownUp = null;
    state.mouseWentUp = false;
    state.mouseWheelDelta = 0;
}

// --- Helpers ---

export function getColors() {
    return state.colors;
}

export function setScale(scale) {
    state.canvasScale = scale;
    state.autoResize = false;
    applyCanvasScale();
}

export function setAutoResize(enabled) {
    state.autoResize = enabled;
    applyCanvasScale();
}

export function setFontSize(size) {
    state.fontSize = size;
    updateFont();
}

export function setFontFamily(family) {
    state.fontFamily = family;
    updateFont();
}

// --- Layout System ---

export function pushLayout(mode, options = {}) {
    const {
        x = 0,
        y = 0,
        padding = 0,
        gap = 0
    } = options;
    
    // Inherit position from parent if not specified
    const parent = peekLayout();
    const actualX = (options.x !== undefined) ? x : (parent ? parent.x : 0);
    const actualY = (options.y !== undefined) ? y : (parent ? parent.y : 0);
    
    const layout = {
        mode,
        x: actualX,
        y: actualY,
        ox: actualX,  // Origin X (where layout started)
        oy: actualY,  // Origin Y (where layout started)
        padding,
        gap,
        maxW: 0,
        maxH: 0
    };
    
    state.layoutStack.push(layout);
    return layout;
}

export function popLayout() {
    if (state.layoutStack.length === 0) {
        console.warn('popLayout called with empty stack');
        return null;
    }
    
    const child = state.layoutStack.pop();
    const parent = peekLayout();
    
    // Update parent layout with child dimensions
    if (parent && child.mode !== NONE) {
        if (parent.mode === HORIZONTAL) {
            parent.x += child.maxW + parent.gap;
            parent.maxW += child.maxW + parent.gap;
            parent.maxH = Math.max(parent.maxH, child.maxH);
        } else if (parent.mode === VERTICAL) {
            parent.y += child.maxH + parent.gap;
            parent.maxH += child.maxH + parent.gap;
            parent.maxW = Math.max(parent.maxW, child.maxW);
        }
    }
    
    return child;
}

export function peekLayout() {
    return state.layoutStack.length > 0 
        ? state.layoutStack[state.layoutStack.length - 1] 
        : null;
}

function layoutIncrement(w, h) {
    const layout = peekLayout();
    if (!layout) return;
    
    if (layout.mode === VERTICAL) {
        layout.y += h + layout.gap;
        layout.maxW = Math.max(layout.maxW, w);
        layout.maxH += h + layout.gap;
    } else if (layout.mode === HORIZONTAL) {
        layout.x += w + layout.gap;
        layout.maxH = Math.max(layout.maxH, h);
        layout.maxW += w + layout.gap;
    }
}

function layoutTranslate(x, y) {
    const layout = peekLayout();
    if (layout) {
        return {
            x: layout.x + x,
            y: layout.y + y
        };
    }
    return { x, y };
}

// --- Hotspot System ---

function addHotspot(id, rect) {
    state.hotspots.push({ id, rect });
}

// --- Component State ---

export function getState(id) {
    return state.componentState[id];
}

export function setState(id, componentState) {
    state.componentState[id] = componentState;
    return componentState;
}

// --- Utility Functions ---

function rectangleContains(rect, x, y) {
    return x >= rect.x && x < rect.x + rect.w &&
           y >= rect.y && y < rect.y + rect.h;
}

function calcDrawState(id) {
    return {
        hovered: state.itemHovered === id,
        held: state.itemHeld === id
    };
}

// --- Components ---

export function label(id, text, options = {}) {
    const {
        width = 100,
        height = 20,
        color = state.colors.text,
        fontSize = null
    } = options;
    
    const pos = layoutTranslate(0, 0);
    const rect = { x: pos.x, y: pos.y, w: width, h: height };
    
    // Apply custom font size if provided
    if (fontSize !== null) {
        const oldFont = state.ctx.font;
        state.ctx.font = `${fontSize}px ${state.fontFamily}`;
        draw.text(text, rect.x + 4, rect.y + height - 5, color);
        state.ctx.font = oldFont;
    } else {
        draw.text(text, rect.x + 4, rect.y + height - 5, color);
    }
    
    layoutIncrement(width, height);
    
    return { rect };
}

export function button(id, text, options = {}) {
    const {
        width = 100,
        height = 30,
        color = state.colors.button,
        fontSize = null
    } = options;
    
    const pos = layoutTranslate(0, 0);
    const rect = { x: pos.x, y: pos.y, w: width, h: height };
    
    addHotspot(id, rect);
    
    const drawState = calcDrawState(id);
    let bgColor = color;
    
    if (drawState.held) {
        bgColor = state.colors.buttonHeld;
    } else if (drawState.hovered) {
        bgColor = state.colors.buttonHover;
    }
    
    // Draw button
    draw.rect(rect, bgColor);
    draw.border(rect, state.colors.border, 2);
    
    // Center text with optional custom font size
    const textY = rect.y + (height / 2) + 5;
    if (fontSize !== null) {
        const oldFont = state.ctx.font;
        state.ctx.font = `${fontSize}px ${state.fontFamily}`;
        draw.text(text, rect.x + 8, textY, state.colors.text);
        state.ctx.font = oldFont;
    } else {
        draw.text(text, rect.x + 8, textY, state.colors.text);
    }
    
    layoutIncrement(width, height);
    
    // Component state
    let compState = getState(id);
    if (!compState) {
        compState = setState(id, { clicked: false });
    }
    compState.clicked = state.itemWentDownUp === id;
    
    return compState;
}

export function slider(id, options = {}, value) {
    const {
        width = 200,
        height = 30,
        min = 0,
        max = 100,
        label = ''
    } = options;
    
    const pos = layoutTranslate(0, 0);
    const rect = { x: pos.x, y: pos.y, w: width, h: height };
    
    addHotspot(id, rect);
    
    const drawState = calcDrawState(id);
    let changed = false;
    
    // Update value if being dragged
    if (drawState.held) {
        const localX = state.mouseX - rect.x;
        const clamped = Math.max(0, Math.min(width, localX));
        const newValue = Math.floor((clamped / width) * (max - min) + min);
        if (newValue !== value) {
            value = newValue;
            changed = true;
        }
    }
    
    // Draw slider background
    draw.rect(rect, state.colors.button);
    draw.border(rect, state.colors.border, 2);
    
    // Draw filled portion
    const fillWidth = ((value - min) / (max - min)) * width;
    if (fillWidth > 0) {
        draw.rect(
            { x: rect.x, y: rect.y, w: fillWidth, h: height },
            drawState.held ? state.colors.accent : state.colors.buttonHover
        );
    }
    
    // Draw label and value
    const labelText = label ? `${label}: ${value}` : `${value}`;
    const textY = rect.y + (height / 2) + 5;
    draw.text(labelText, rect.x + 8, textY, state.colors.text);
    
    layoutIncrement(width, height);
    
    // Component state
    let compState = getState(id);
    if (!compState) {
        compState = setState(id, { changed: false, value });
    }
    compState.changed = changed;
    compState.value = value;
    
    return compState;
}

export function checkbox(id, options = {}, value) {
    const {
        width = 30,
        height = 30
    } = options;
    
    const pos = layoutTranslate(0, 0);
    const rect = { x: pos.x, y: pos.y, w: width, h: height };
    
    addHotspot(id, rect);
    
    // Get or initialize component state
    let compState = getState(id);
    if (!compState) {
        // First time - initialize with provided value
        compState = setState(id, { changed: false, value });
    }
    
    // Always use stored state value (ignore parameter after first init)
    let currentValue = compState.value;
    let changed = false;
    
    // Toggle on click
    if (state.itemWentDownUp === id) {
        currentValue = !currentValue;
        changed = true;
    }
    
    const drawState = calcDrawState(id);
    
    // Draw checkbox
    const bgColor = drawState.hovered ? state.colors.buttonHover : state.colors.button;
    draw.rect(rect, bgColor);
    draw.border(rect, state.colors.border, 2);
    
    // Draw checkmark if checked
    if (currentValue) {
        const checkRect = {
            x: rect.x + 4,
            y: rect.y + 4,
            w: width - 8,
            h: height - 8
        };
        draw.rect(checkRect, state.colors.accent);
    }
    
    layoutIncrement(width, height);
    
    // Update state
    compState.changed = changed;
    compState.value = currentValue;
    
    return compState;
}

export function dropdown(id, options = {}, selectedIndex = 0) {
    const {
        width = 200,
        height = 30,
        items = [],
        label = null
    } = options;
    
    // Get or initialize component state
    let compState = getState(id);
    if (!compState) {
        compState = setState(id, { 
            changed: false, 
            selectedIndex,
            isOpen: false
        });
    }
    
    let currentIndex = compState.selectedIndex;
    let isOpen = compState.isOpen;
    let changed = false;
    
    const pos = layoutTranslate(0, 0);
    
    // Draw label if provided
    let labelHeight = 0;
    if (label) {
        labelHeight = 20;
        draw.text(label, pos.x, pos.y + 15, state.colors.text);
    }
    
    // Main dropdown box
    const mainRect = { 
        x: pos.x, 
        y: pos.y + labelHeight, 
        w: width, 
        h: height 
    };
    
    addHotspot(id, mainRect);
    
    const mainDrawState = calcDrawState(id);
    const bgColor = mainDrawState.hovered ? state.colors.buttonHover : state.colors.button;
    
    draw.rect(mainRect, bgColor);
    draw.border(mainRect, state.colors.border, 2);
    
    // Draw selected item text
    const selectedText = items[currentIndex] || '';
    draw.text(selectedText, mainRect.x + 8, mainRect.y + height - 8, state.colors.text);
    
    // Draw dropdown arrow
    const arrowX = mainRect.x + width - 20;
    const arrowY = mainRect.y + height / 2;
    const arrowSize = 5;
    
    if (isOpen) {
        // Up arrow
        draw.line(arrowX - arrowSize, arrowY + 2, arrowX, arrowY - 3, state.colors.text);
        draw.line(arrowX, arrowY - 3, arrowX + arrowSize, arrowY + 2, state.colors.text);
    } else {
        // Down arrow
        draw.line(arrowX - arrowSize, arrowY - 2, arrowX, arrowY + 3, state.colors.text);
        draw.line(arrowX, arrowY + 3, arrowX + arrowSize, arrowY - 2, state.colors.text);
    }
    
    // Toggle dropdown on click
    if (state.itemWentDownUp === id) {
        isOpen = !isOpen;
    }
    
    // Increment layout BEFORE drawing menu (menu is an overlay)
    layoutIncrement(width, height + labelHeight);
    
    // Process dropdown menu logic if open (hotspots and interaction)
    if (isOpen && items.length > 0) {
        const menuHeight = items.length * 25;
        const menuRect = {
            x: mainRect.x,
            y: mainRect.y + height,
            w: width,
            h: menuHeight
        };
        
        // Check if mouse is over the menu area (to consume clicks)
        const mouseOverMenu = rectangleContains(menuRect, state.mouseX, state.mouseY);
        
        // Add hotspots and handle clicks IMMEDIATELY (before draw queue)
        for (let i = 0; i < items.length; i++) {
            const itemRect = {
                x: menuRect.x,
                y: menuRect.y + i * 25,
                w: width,
                h: 25
            };
            
            const itemId = `${id}_item${i}`;
            addHotspot(itemId, itemRect);
            
            // Select item on click
            if (state.itemWentDownUp === itemId) {
                currentIndex = i;
                changed = true;
                isOpen = false;
                // Consume the click event so it doesn't affect other elements
                state.itemWentDownUp = null;
            }
        }
        
        // If clicking on the menu background (but not an item), consume the click
        if (mouseOverMenu && state.mouseWentUp) {
            state.itemWentDownUp = null;
        }
        
        // Queue ONLY the drawing to happen later (on top of everything)
        state.drawQueue.push(() => {
            // Draw menu background
            draw.rect(menuRect, state.colors.panel);
            draw.border(menuRect, state.colors.border, 2);
            
            // Draw menu items
            for (let i = 0; i < items.length; i++) {
                const itemRect = {
                    x: menuRect.x,
                    y: menuRect.y + i * 25,
                    w: width,
                    h: 25
                };
                
                const itemId = `${id}_item${i}`;
                const itemDrawState = calcDrawState(itemId);
                
                // Highlight hovered or selected item
                if (itemDrawState.hovered) {
                    draw.rect(itemRect, state.colors.buttonHover);
                } else if (i === currentIndex) {
                    draw.rect(itemRect, state.colors.buttonHeld);
                }
                
                // Draw item text
                const textColor = i === currentIndex ? state.colors.accent : state.colors.text;
                draw.text(items[i], itemRect.x + 8, itemRect.y + 18, textColor);
            }
        });
    }
    
    // Close dropdown if clicking outside
    if (isOpen && state.mouseWentUp && !state.itemHovered?.startsWith(id)) {
        isOpen = false;
    }
    
    // Update state
    compState.changed = changed;
    compState.selectedIndex = currentIndex;
    compState.isOpen = isOpen;
    
    return {
        ...compState,
        selectedItem: items[currentIndex] || null
    };
}

export function scrollBox(id, options = {}, contentDrawFn) {
    const {
        width = 200,
        height = 200,
        contentHeight = 400,
        scrollbarWidth = 12,
        label = null
    } = options;
    
    // Get or initialize component state
    let compState = getState(id);
    if (!compState) {
        compState = setState(id, { 
            scrollY: 0
        });
    }
    
    let scrollY = compState.scrollY;
    const maxScroll = Math.max(0, contentHeight - height);
    
    const pos = layoutTranslate(0, 0);
    
    // Draw label if provided
    let labelHeight = 0;
    if (label) {
        labelHeight = 20;
        draw.text(label, pos.x, pos.y + 15, state.colors.text);
    }
    
    // Main scroll box area
    const boxRect = { 
        x: pos.x, 
        y: pos.y + labelHeight, 
        w: width, 
        h: height 
    };
    
    // Check if mouse is over the box
    const mouseOverBox = rectangleContains(boxRect, state.mouseX, state.mouseY);
    
    // Handle mouse wheel scrolling
    if (mouseOverBox && state.mouseWheelDelta !== 0) {
        scrollY += state.mouseWheelDelta * 0.5;
        scrollY = Math.max(0, Math.min(maxScroll, scrollY));
    }
    
    // Draw background
    draw.rect(boxRect, state.colors.panel);
    draw.border(boxRect, state.colors.border, 2);
    
    // Set up clipping for content area
    const contentAreaWidth = width - scrollbarWidth - 4;
    const contentAreaRect = {
        x: boxRect.x + 2,
        y: boxRect.y + 2,
        w: contentAreaWidth,
        h: height - 4
    };
    
    // Save context state and set clipping
    state.ctx.save();
    state.ctx.beginPath();
    state.ctx.rect(contentAreaRect.x, contentAreaRect.y, contentAreaRect.w, contentAreaRect.h);
    state.ctx.clip();
    
    // Push a layout for the scrolled content
    pushLayout(VERTICAL, { 
        x: contentAreaRect.x, 
        y: contentAreaRect.y - scrollY,
        gap: 0 
    });
    
    // Call the content draw function
    if (contentDrawFn) {
        contentDrawFn();
    }
    
    popLayout();
    
    // Restore context (remove clipping)
    state.ctx.restore();
    
    // Draw scrollbar if content is larger than box
    if (contentHeight > height) {
        const scrollbarX = boxRect.x + width - scrollbarWidth - 2;
        const scrollbarY = boxRect.y + 2;
        const scrollbarHeight = height - 4;
        
        // Scrollbar track
        const trackRect = {
            x: scrollbarX,
            y: scrollbarY,
            w: scrollbarWidth,
            h: scrollbarHeight
        };
        draw.rect(trackRect, state.colors.button);
        
        // Scrollbar thumb
        const thumbHeight = Math.max(20, (height / contentHeight) * scrollbarHeight);
        const thumbY = scrollbarY + (scrollY / maxScroll) * (scrollbarHeight - thumbHeight);
        const thumbRect = {
            x: scrollbarX,
            y: thumbY,
            w: scrollbarWidth,
            h: thumbHeight
        };
        
        const thumbId = `${id}_thumb`;
        addHotspot(thumbId, thumbRect);
        
        const thumbDrawState = calcDrawState(thumbId);
        const thumbColor = thumbDrawState.held ? state.colors.accent : 
                          thumbDrawState.hovered ? state.colors.buttonHover : 
                          state.colors.border;
        
        draw.rect(thumbRect, thumbColor);
        
        // Drag scrollbar
        if (state.itemHeld === thumbId) {
            // Calculate drag position
            const dragY = state.mouseY - thumbHeight / 2 - scrollbarY;
            const scrollRatio = dragY / (scrollbarHeight - thumbHeight);
            scrollY = scrollRatio * maxScroll;
            scrollY = Math.max(0, Math.min(maxScroll, scrollY));
        }
    }
    
    layoutIncrement(width, height + labelHeight);
    
    // Update state
    compState.scrollY = scrollY;
    
    return {
        ...compState,
        maxScroll
    };
}

export function accordion(id, options = {}, isExpanded = false, contentDrawFn) {
    const {
        width = 200,
        height = 30,
        label = 'Accordion',
        contentHeight = 100,
        showBorder = true,
        fontSize = null
    } = options;
    
    // Get or initialize component state
    let compState = getState(id);
    if (!compState) {
        compState = setState(id, { 
            isExpanded,
            changed: false
        });
    }
    
    let currentExpanded = compState.isExpanded;
    
    const pos = layoutTranslate(0, 0);
    
    // Header button
    const headerRect = { x: pos.x, y: pos.y, w: width, h: height };
    addHotspot(id, headerRect);
    
    const drawState = calcDrawState(id);
    const headerColor = drawState.held ? state.colors.buttonHeld : 
                       drawState.hovered ? state.colors.buttonHover : 
                       state.colors.button;
    
    draw.rect(headerRect, headerColor);
    
    if (showBorder) {
        draw.border(headerRect, state.colors.border, 1);
    }
    
    // Draw arrow indicator
    const arrowX = pos.x + 10;
    const arrowY = pos.y + height / 2;
    const arrowSize = 6;
    
    if (currentExpanded) {
        // Down arrow (▼)
        draw.line(arrowX, arrowY - 2, arrowX + arrowSize, arrowY - 2, state.colors.text, 2);
        draw.line(arrowX, arrowY - 2, arrowX + arrowSize / 2, arrowY + 3, state.colors.text, 2);
        draw.line(arrowX + arrowSize, arrowY - 2, arrowX + arrowSize / 2, arrowY + 3, state.colors.text, 2);
    } else {
        // Right arrow (▶)
        draw.line(arrowX, arrowY - arrowSize / 2, arrowX, arrowY + arrowSize / 2, state.colors.text, 2);
        draw.line(arrowX, arrowY - arrowSize / 2, arrowX + arrowSize, arrowY, state.colors.text, 2);
        draw.line(arrowX, arrowY + arrowSize / 2, arrowX + arrowSize, arrowY, state.colors.text, 2);
    }
    
    // Draw label text
    if (fontSize !== null) {
        const prevFont = state.ctx.font;
        updateFont(fontSize);
        draw.text(label, pos.x + 25, pos.y + height / 2 + 5, state.colors.text);
        state.ctx.font = prevFont;
    } else {
        draw.text(label, pos.x + 25, pos.y + height / 2 + 5, state.colors.text);
    }
    
    // Handle click to toggle
    let changed = false;
    if (state.itemWentDownUp === id) {
        currentExpanded = !currentExpanded;
        changed = true;
    }
    
    let totalHeight = height;
    
    // Draw content if expanded
    if (currentExpanded && contentDrawFn) {
        // Save current layout position before drawing content
        const contentStartY = pos.y + height;
        
        // Draw content with layout set to NONE mode so it doesn't affect parent
        pushLayout(NONE, { 
            x: pos.x + 5, 
            y: contentStartY + 5
        });
        
        // Create a vertical sublayout inside for the content
        pushLayout(VERTICAL, { gap: 5 });
        
        contentDrawFn();
        
        const contentLayout = popLayout(); // Pop the VERTICAL layout
        popLayout(); // Pop the NONE layout
        
        // Calculate actual content height based on what was drawn
        const actualContentHeight = contentLayout.maxH;
        
        // Now draw the background with the correct height
        const contentRect = { 
            x: pos.x, 
            y: contentStartY, 
            w: width, 
            h: actualContentHeight + 10 // +10 for padding (5 top + 5 bottom)
        };
        
        // Draw background behind content (draw order matters)
        state.ctx.save();
        state.ctx.globalCompositeOperation = 'destination-over';
        draw.rect(contentRect, state.colors.panel);
        
        if (showBorder) {
            draw.border(contentRect, state.colors.border, 1);
        }
        state.ctx.restore();
        
        totalHeight += actualContentHeight + 10;
    }
    
    layoutIncrement(width, totalHeight);
    
    // Update state
    compState.isExpanded = currentExpanded;
    compState.changed = changed;
    
    return {
        ...compState
    };
}

export function rect(options = {}) {
    const {
        width = 100,
        height = 100,
        color = state.colors.panel,
        borderColor = null,
        borderWidth = 0
    } = options;
    
    const pos = layoutTranslate(0, 0);
    const rectObj = { x: pos.x, y: pos.y, w: width, h: height };
    
    draw.rect(rectObj, color);
    
    if (borderColor && borderWidth > 0) {
        draw.border(rectObj, borderColor, borderWidth);
    }
    
    layoutIncrement(width, height);
    
    return { rect: rectObj };
}

export function spacer(width = 0, height = 0) {
    layoutIncrement(width, height);
}

// --- Export state for debugging ---
export function getDebugState() {
    return {
        mouseX: state.mouseX,
        mouseY: state.mouseY,
        itemHovered: state.itemHovered,
        itemHeld: state.itemHeld,
        hotspotCount: state.hotspots.length,
        layoutDepth: state.layoutStack.length
    };
}
