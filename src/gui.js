/**
 * Immediate Mode GUI System for Paula Tracker
 * Features automatic layout with containers (row, column, stack, wrap, grid)
 * Anchor-based and percentage-based positioning
 */

export class GUI {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // Disable font smoothing for crisp text
        this.ctx.textRendering = 'optimizeSpeed';
        
        // Track the scale ratio for mouse coordinates
        this.scaleX = 1;
        this.scaleY = 1;
        
        // Ultimate Sound Tracker color palette
        this.colors = {
            background: '#2A2A2A',
            panelBg: '#1A1A1A',
            text: '#D4B896',
            textBright: '#F5E6D3',
            textDim: '#8B7355',
            yellow: '#E8D4A0',
            orange: '#D4A574',
            red: '#C85050',
            green: '#88AA88',
            cyan: '#A0C8C8',
            border: '#6B5D4F',
            button: '#3A3A3A',
            buttonHover: '#4A4A4A',
            gridLine: '#2F2F2F',
            cursorBg: '#3F3932',
            patternBg: '#0F0F0F',
        };
        
        this.charWidth = 8;
        this.charHeight = 14;
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.lastMouseDown = false;
        this.rightMouseDown = false;
        this.lastRightMouseDown = false;
        
        // Layout state
        this.layoutStack = [];
        this.currentLayout = null;
        
        // Root layout container (full canvas)
        this.rootLayout = {
            type: 'root',
            x: 0,
            y: 0,
            width: this.width,
            height: this.height,
            padding: 0,
            gap: 0
        };
        
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            
            // Calculate the actual rendered size with object-fit: contain
            const canvasAspect = this.canvas.width / this.canvas.height;
            const rectAspect = rect.width / rect.height;
            
            let renderWidth, renderHeight, offsetX, offsetY;
            
            if (rectAspect > canvasAspect) {
                renderWidth = rect.height * canvasAspect;
                renderHeight = rect.height;
                offsetX = (rect.width - renderWidth) / 2;
                offsetY = 0;
            } else {
                renderWidth = rect.width;
                renderHeight = renderWidth / canvasAspect;
                offsetX = 0;
                offsetY = (rect.height - renderHeight) / 2;
            }
            
            this.scaleX = this.canvas.width / renderWidth;
            this.scaleY = this.canvas.height / renderHeight;
            
            this.mouseX = (e.clientX - rect.left - offsetX) * this.scaleX;
            this.mouseY = (e.clientY - rect.top - offsetY) * this.scaleY;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouseDown = true;
            else if (e.button === 2) this.rightMouseDown = true;
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouseDown = false;
            else if (e.button === 2) this.rightMouseDown = false;
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Begin frame - clear canvas and reset layout
     */
    beginFrame() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.layoutStack = [];
        this.currentLayout = this.rootLayout;
    }
    
    /**
     * End frame - update mouse state
     */
    endFrame() {
        this.lastMouseDown = this.mouseDown;
        this.lastRightMouseDown = this.rightMouseDown;
    }
    
    /**
     * Parse size value (can be number, percentage string, or 'auto')
     */
    parseSize(value, containerSize) {
        if (value === 'auto' || value === undefined) {
            return null; // Will be calculated based on content
        }
        if (typeof value === 'string' && value.endsWith('%')) {
            const percent = parseFloat(value) / 100;
            return containerSize * percent;
        }
        return value;
    }
    
    /**
     * Begin a panel container with optional title
     */
    beginPanel(options = {}) {
        const {
            width = '100%',
            height = '100%',
            padding = 8,
            title = null,
            anchor = { x: 0, y: 0 }, // 0 = left/top, 0.5 = center, 1 = right/bottom
            offset = { x: 0, y: 0 },
            bordered = true
        } = options;
        
        const parent = this.currentLayout;
        const w = this.parseSize(width, parent.width) || parent.width;
        const h = this.parseSize(height, parent.height) || parent.height;
        
        // Calculate position based on anchor
        const x = parent.x + offset.x + (parent.width - w) * anchor.x;
        const y = parent.y + offset.y + (parent.height - h) * anchor.y;
        
        // Draw panel background
        this.ctx.fillStyle = this.colors.panelBg;
        this.ctx.fillRect(x, y, w, h);
        
        // Draw border
        if (bordered) {
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, w, h);
        }
        
        // Draw title bar
        let contentY = y + padding;
        if (title) {
            const titleHeight = this.charHeight + 8;
            this.ctx.fillStyle = this.colors.button;
            this.ctx.fillRect(x + 2, y + 2, w - 4, titleHeight);
            
            this.ctx.font = `${this.charHeight}px "Courier New", monospace`;
            this.ctx.fillStyle = this.colors.textBright;
            this.ctx.textBaseline = 'top';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(title, x + 6, y + 6);
            
            contentY = y + titleHeight + padding;
        }
        
        // Create and push panel layout context
        const panelLayout = {
            type: 'panel',
            x: x + padding,
            y: contentY,
            width: w - padding * 2,
            height: h - (contentY - y) - padding,
            padding: 0,
            gap: 0
        };
        
        this.layoutStack.push(this.currentLayout);
        this.currentLayout = panelLayout;
        
        return panelLayout;
    }
    
    /**
     * End panel container
     */
    endPanel() {
        if (this.layoutStack.length > 0) {
            this.currentLayout = this.layoutStack.pop();
        }
    }
    
    /**
     * Begin a layout container
     */
    beginLayout(type, options = {}) {
        const {
            width = '100%',
            height = '100%',
            padding = 0,
            gap = 4,
            anchor = { x: 0, y: 0 },
            offset = { x: 0, y: 0 },
            align = 'start', // start, center, end, stretch
            justify = 'start', // start, center, end, space-between, space-around
            wrap = false,
            columns = 2, // for grid layout
        } = options;
        
        const parent = this.currentLayout;
        const w = this.parseSize(width, parent.width) || parent.width;
        const h = this.parseSize(height, parent.height) || parent.height;
        
        // Create the layout structure
        const layout = {
            type,
            x: 0, // Will be set by parent layout or calculated if top-level
            y: 0, // Will be set by parent layout or calculated if top-level
            width: w - padding * 2,
            height: h - padding * 2,
            padding,
            gap,
            align,
            justify,
            wrap,
            columns,
            children: [],
            currentX: 0,
            currentY: 0,
            rowHeight: 0,
            columnWidth: 0,
            // Store these for later calculation
            requestedWidth: w,
            requestedHeight: h,
            anchor,
            offset
        };
        
        this.layoutStack.push(this.currentLayout);
        this.currentLayout = layout;
        
        return layout;
    }
    
    /**
     * End current layout container
     */
    endLayout() {
        if (this.layoutStack.length > 0) {
            const layout = this.currentLayout;
            const parent = this.layoutStack[this.layoutStack.length - 1];
            
            // Debug logging
            if (layout.children && layout.children.length > 0) {
                console.log(`endLayout: ${layout.type} with ${layout.children.length} children`);
            }
            
            this.currentLayout = this.layoutStack.pop();
            
            // If the parent has a children array, add this layout as a child
            // Otherwise it's a top-level layout under a panel
            if (Array.isArray(parent.children)) {
                // Add this layout as a child of the parent layout
                this.addChild((x, y, w, h) => {
                    // Set the layout's position
                    layout.x = x + layout.padding;
                    layout.y = y + layout.padding;
                    layout.currentX = layout.x;
                    layout.currentY = layout.y;
                    
                    // Apply the layout to render its children
                    this.applyLayout(layout);
                }, layout.requestedWidth, layout.requestedHeight);
            } else {
                // Top-level layout under a panel - calculate position from parent
                const x = parent.x + layout.offset.x + (parent.width - layout.requestedWidth) * layout.anchor.x;
                const y = parent.y + layout.offset.y + (parent.height - layout.requestedHeight) * layout.anchor.y;
                
                layout.x = x + layout.padding;
                layout.y = y + layout.padding;
                layout.currentX = layout.x;
                layout.currentY = layout.y;
                
                // Apply the layout to render its children
                this.applyLayout(layout);
            }
        }
    }
    
    /**
     * Apply layout calculations to children
     */
    applyLayout(layout) {
        if (layout.children.length === 0) return;
        
        switch (layout.type) {
            case 'row':
                this.layoutRow(layout);
                break;
            case 'column':
                this.layoutColumn(layout);
                break;
            case 'stack':
                this.layoutStack(layout);
                break;
            case 'wrap':
                this.layoutWrap(layout);
                break;
            case 'grid':
                this.layoutGrid(layout);
                break;
        }
    }
    
    layoutRow(layout) {
        const { children, width, gap, justify, align } = layout;
        
        // Calculate total width needed
        let totalWidth = 0;
        let autoCount = 0;
        
        children.forEach(child => {
            if (child.width === null) autoCount++;
            else totalWidth += child.width;
        });
        
        totalWidth += (children.length - 1) * gap;
        
        // Calculate auto width
        const remainingWidth = width - totalWidth;
        const autoWidth = autoCount > 0 ? Math.max(0, remainingWidth / autoCount) : 0;
        
        // Calculate starting X based on justify
        let currentX = layout.x;
        if (justify === 'center') {
            currentX += (width - totalWidth) / 2;
        } else if (justify === 'end') {
            currentX += width - totalWidth;
        }
        
        // Position children
        children.forEach((child, i) => {
            const childWidth = child.width !== null ? child.width : autoWidth;
            const childHeight = child.height !== null ? child.height : layout.height;
            
            // Vertical alignment
            let y = layout.y;
            if (align === 'center') {
                y += (layout.height - childHeight) / 2;
            } else if (align === 'end') {
                y += layout.height - childHeight;
            }
            
            child.render(currentX, y, childWidth, childHeight);
            currentX += childWidth + gap;
        });
    }
    
    layoutColumn(layout) {
        const { children, height, gap, justify, align } = layout;
        
        // Calculate total height needed
        let totalHeight = 0;
        let autoCount = 0;
        
        children.forEach(child => {
            if (child.height === null) autoCount++;
            else totalHeight += child.height;
        });
        
        totalHeight += (children.length - 1) * gap;
        
        // Calculate auto height
        const remainingHeight = height - totalHeight;
        const autoHeight = autoCount > 0 ? Math.max(0, remainingHeight / autoCount) : 0;
        
        // Calculate starting Y based on justify
        let currentY = layout.y;
        if (justify === 'center') {
            currentY += (height - totalHeight) / 2;
        } else if (justify === 'end') {
            currentY += height - totalHeight;
        }
        
        // Position children
        children.forEach((child, i) => {
            const childWidth = child.width !== null ? child.width : layout.width;
            const childHeight = child.height !== null ? child.height : autoHeight;
            
            // Horizontal alignment
            let x = layout.x;
            if (align === 'center') {
                x += (layout.width - childWidth) / 2;
            } else if (align === 'end') {
                x += layout.width - childWidth;
            }
            
            child.render(x, currentY, childWidth, childHeight);
            currentY += childHeight + gap;
        });
    }
    
    layoutStack(layout) {
        // Stack places all children on top of each other
        const { children, width, height, align, justify } = layout;
        
        children.forEach(child => {
            const childWidth = child.width !== null ? child.width : width;
            const childHeight = child.height !== null ? child.height : height;
            
            let x = layout.x;
            let y = layout.y;
            
            if (align === 'center') {
                x += (width - childWidth) / 2;
            } else if (align === 'end') {
                x += width - childWidth;
            }
            
            if (justify === 'center') {
                y += (height - childHeight) / 2;
            } else if (justify === 'end') {
                y += height - childHeight;
            }
            
            child.render(x, y, childWidth, childHeight);
        });
    }
    
    layoutWrap(layout) {
        // Wrap is like column but wraps to next column when height is exceeded
        const { children, width, height, gap } = layout;
        
        let currentX = layout.x;
        let currentY = layout.y;
        let columnWidth = 0;
        
        children.forEach(child => {
            const childWidth = child.width !== null ? child.width : 100;
            const childHeight = child.height !== null ? child.height : 30;
            
            // Check if we need to wrap
            if (currentY + childHeight > layout.y + height && currentY > layout.y) {
                currentX += columnWidth + gap;
                currentY = layout.y;
                columnWidth = 0;
            }
            
            child.render(currentX, currentY, childWidth, childHeight);
            currentY += childHeight + gap;
            columnWidth = Math.max(columnWidth, childWidth);
        });
    }
    
    layoutGrid(layout) {
        const { children, width, gap, columns } = layout;
        
        // Calculate cell dimensions
        const totalGap = (columns - 1) * gap;
        const cellWidth = (width - totalGap) / columns;
        
        children.forEach((child, i) => {
            const col = i % columns;
            const row = Math.floor(i / columns);
            
            const x = layout.x + col * (cellWidth + gap);
            const y = layout.y + row * (child.height + gap);
            
            const childWidth = child.width !== null ? child.width : cellWidth;
            const childHeight = child.height !== null ? child.height : 30;
            
            child.render(x, y, childWidth, childHeight);
        });
    }
    
    /**
     * Add a child element to the current layout
     */
    addChild(renderFn, width = null, height = null) {
        // Only add to children array if current layout is a collecting layout (row, column, etc.)
        if (this.currentLayout && Array.isArray(this.currentLayout.children)) {
            this.currentLayout.children.push({
                render: renderFn,
                width: this.parseSize(width, this.currentLayout.width),
                height: this.parseSize(height, this.currentLayout.height)
            });
        } else {
            // If not in a collecting layout (e.g., in a panel), render immediately
            // This shouldn't happen in normal usage, but provides a fallback
            console.warn('addChild called outside of a layout container (row/column/grid/etc)');
        }
    }
    
    /**
     * Convenience methods for creating layouts
     */
    row(options) { return this.beginLayout('row', options); }
    column(options) { return this.beginLayout('column', options); }
    stack(options) { return this.beginLayout('stack', options); }
    wrap(options) { return this.beginLayout('wrap', options); }
    grid(options) { return this.beginLayout('grid', options); }
    
    /**
     * Draw a button
     */
    button(label, options = {}) {
        const {
            width = null,
            height = 30,
            centered = true,
            onClick = null,
            onHover = null,
            enabled = true
        } = options;
        
        const renderButton = (x, y, w, h) => {
            const hover = this.isMouseOver(x, y, w, h);
            const clicked = hover && this.mouseDown && !this.lastMouseDown;
            
            // Handle callbacks
            if (enabled) {
                if (hover && onHover) {
                    onHover();
                }
                if (clicked && onClick) {
                    onClick();
                }
            }
            
            // Button background
            const bgColor = !enabled ? 'gridLine' : (hover ? 'buttonHover' : 'button');
            this.ctx.fillStyle = this.colors[bgColor];
            this.ctx.fillRect(x, y, w, h);
            
            // Border
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, w, h);
            
            // Label
            this.ctx.font = `${this.charHeight}px "Courier New", monospace`;
            this.ctx.fillStyle = enabled ? this.colors.textBright : this.colors.textDim;
            this.ctx.textBaseline = 'top';
            
            if (centered) {
                this.ctx.textAlign = 'center';
                this.ctx.fillText(label, x + w / 2, y + (h - this.charHeight) / 2);
                this.ctx.textAlign = 'left';
            } else {
                this.ctx.textAlign = 'left';
                this.ctx.fillText(label, x + 4, y + (h - this.charHeight) / 2);
            }
        };
        
        this.addChild(renderButton, width, height);
    }
    
    /**
     * Draw text label
     */
    label(text, options = {}) {
        const {
            width = null,
            height = this.charHeight + 4,
            color = 'text',
            align = 'left',
            onClick = null,
            onHover = null
        } = options;
        
        const renderLabel = (x, y, w, h) => {
            const hover = onClick || onHover ? this.isMouseOver(x, y, w, h) : false;
            const clicked = hover && this.mouseDown && !this.lastMouseDown;
            
            // Handle callbacks
            if (hover && onHover) {
                onHover();
            }
            if (clicked && onClick) {
                onClick();
            }
            
            this.ctx.font = `${this.charHeight}px "Courier New", monospace`;
            this.ctx.fillStyle = this.colors[color] || color;
            this.ctx.textBaseline = 'top';
            this.ctx.textAlign = align;
            
            let textX = x;
            if (align === 'center') textX = x + w / 2;
            else if (align === 'right') textX = x + w;
            
            this.ctx.fillText(text, textX, y + (h - this.charHeight) / 2);
            this.ctx.textAlign = 'left';
        };
        
        this.addChild(renderLabel, width, height);
    }
    
    /**
     * Draw a spacer (empty space)
     */
    spacer(options = {}) {
        const { width = null, height = null } = options;
        this.addChild(() => {}, width, height);
    }
    
    /**
     * Draw a rectangle
     */
    rect(options = {}) {
        const {
            width = null,
            height = null,
            color = 'panelBg',
            bordered = false,
            borderColor = 'border',
            onClick = null,
            onHover = null
        } = options;
        
        const renderRect = (x, y, w, h) => {
            const hover = onClick || onHover ? this.isMouseOver(x, y, w, h) : false;
            const clicked = hover && this.mouseDown && !this.lastMouseDown;
            
            // Handle callbacks
            if (hover && onHover) {
                onHover();
            }
            if (clicked && onClick) {
                onClick();
            }
            
            this.ctx.fillStyle = this.colors[color] || color;
            this.ctx.fillRect(x, y, w, h);
            
            if (bordered) {
                this.ctx.strokeStyle = this.colors[borderColor] || borderColor;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, w, h);
            }
        };
        
        this.addChild(renderRect, width, height);
    }
    
    /**
     * Check if mouse is over a region
     */
    isMouseOver(x, y, w, h) {
        return this.mouseX >= x && this.mouseX <= x + w &&
               this.mouseY >= y && this.mouseY <= y + h;
    }
    
    /**
     * Draw a toggle button (checkbox/switch style)
     */
    toggle(label, value, options = {}) {
        const {
            width = null,
            height = 30,
            onChange = null
        } = options;
        
        const renderToggle = (x, y, w, h) => {
            const hover = this.isMouseOver(x, y, w, h);
            const clicked = hover && this.mouseDown && !this.lastMouseDown;
            
            if (clicked && onChange) {
                onChange(!value);
            }
            
            // Background
            const bgColor = hover ? 'buttonHover' : 'button';
            this.ctx.fillStyle = this.colors[bgColor];
            this.ctx.fillRect(x, y, w, h);
            
            // Border
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, w, h);
            
            // Toggle indicator
            const toggleSize = h - 8;
            const toggleX = x + 4;
            const toggleY = y + 4;
            
            this.ctx.fillStyle = value ? this.colors.green : this.colors.gridLine;
            this.ctx.fillRect(toggleX, toggleY, toggleSize, toggleSize);
            
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.strokeRect(toggleX, toggleY, toggleSize, toggleSize);
            
            // Label
            this.ctx.font = `${this.charHeight}px "Courier New", monospace`;
            this.ctx.fillStyle = this.colors.textBright;
            this.ctx.textBaseline = 'top';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(label, toggleX + toggleSize + 8, y + (h - this.charHeight) / 2);
        };
        
        this.addChild(renderToggle, width, height);
    }
    
    /**
     * Draw a slider
     */
    slider(value, min, max, options = {}) {
        const {
            width = null,
            height = 30,
            onChange = null,
            label = null
        } = options;
        
        const renderSlider = (x, y, w, h) => {
            const hover = this.isMouseOver(x, y, w, h);
            const dragging = hover && this.mouseDown;
            
            if (dragging && onChange) {
                const percent = Math.max(0, Math.min(1, (this.mouseX - x) / w));
                const newValue = min + (max - min) * percent;
                onChange(newValue);
            }
            
            // Background track
            const trackHeight = 4;
            const trackY = y + (h - trackHeight) / 2;
            this.ctx.fillStyle = this.colors.gridLine;
            this.ctx.fillRect(x, trackY, w, trackHeight);
            
            // Filled track
            const percent = (value - min) / (max - min);
            const fillWidth = w * percent;
            this.ctx.fillStyle = this.colors.cyan;
            this.ctx.fillRect(x, trackY, fillWidth, trackHeight);
            
            // Handle
            const handleSize = h - 8;
            const handleX = x + fillWidth - handleSize / 2;
            const handleY = y + 4;
            
            this.ctx.fillStyle = hover || dragging ? this.colors.buttonHover : this.colors.button;
            this.ctx.fillRect(handleX, handleY, handleSize, handleSize);
            
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(handleX, handleY, handleSize, handleSize);
            
            // Label
            if (label) {
                this.ctx.font = `${this.charHeight}px "Courier New", monospace`;
                this.ctx.fillStyle = this.colors.text;
                this.ctx.textBaseline = 'top';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(label, x, y + h + 2);
            }
        };
        
        this.addChild(renderSlider, width, height);
    }
    
    /**
     * Draw a dropdown/select (displays current value, clicking toggles a popup)
     */
    select(value, options, selectOptions = {}) {
        const {
            width = null,
            height = 30,
            onChange = null
        } = selectOptions;
        
        const renderSelect = (x, y, w, h) => {
            const hover = this.isMouseOver(x, y, w, h);
            const clicked = hover && this.mouseDown && !this.lastMouseDown;
            
            // Cycle to next option on click
            if (clicked && onChange) {
                const currentIndex = options.indexOf(value);
                const nextIndex = (currentIndex + 1) % options.length;
                onChange(options[nextIndex]);
            }
            
            // Background
            const bgColor = hover ? 'buttonHover' : 'button';
            this.ctx.fillStyle = this.colors[bgColor];
            this.ctx.fillRect(x, y, w, h);
            
            // Border
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, w, h);
            
            // Current value
            this.ctx.font = `${this.charHeight}px "Courier New", monospace`;
            this.ctx.fillStyle = this.colors.textBright;
            this.ctx.textBaseline = 'top';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(value, x + 4, y + (h - this.charHeight) / 2);
            
            // Dropdown arrow
            const arrowX = x + w - 20;
            this.ctx.fillStyle = this.colors.text;
            this.ctx.fillText('▼', arrowX, y + (h - this.charHeight) / 2);
        };
        
        this.addChild(renderSelect, width, height);
    }
    
    /**
     * Legacy compatibility methods (for gradual migration)
     */
    clear() {
        this.beginFrame();
    }
    
    text(str, x, y, color = 'text', align = 'left') {
        this.ctx.font = `${this.charHeight}px "Courier New", monospace`;
        this.ctx.fillStyle = this.colors[color] || color;
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = align;
        this.ctx.fillText(str, x, y);
        this.ctx.textAlign = 'left';
    }
    
    drawRect(x, y, w, h, color) {
        this.ctx.fillStyle = this.colors[color] || color;
        this.ctx.fillRect(x, y, w, h);
    }
    
    border(x, y, w, h, color, thickness = 1) {
        this.ctx.strokeStyle = this.colors[color] || color;
        this.ctx.lineWidth = thickness;
        this.ctx.strokeRect(x, y, w, h);
    }
    
    line(x1, y1, x2, y2, color, thickness = 1) {
        this.ctx.strokeStyle = this.colors[color] || color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    hex(value, x, y, digits = 2, color = 'text') {
        if (value === undefined || value === null) value = 0;
        const str = value.toString(16).toUpperCase().padStart(digits, '0');
        this.text(str, x, y, color);
    }
    
    update() {
        this.endFrame();
    }
}
