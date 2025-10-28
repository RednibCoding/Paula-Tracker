/**
 * Immediate Mode UI System for Paula Tracker
 * Inspired by Ultimate Sound Tracker color scheme
 */

export class UI {
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
        
        // Ultimate Sound Tracker color palette (from screenshot)
        // Beige/tan tones with dark gray - like Dune
        this.colors = {
            background: '#2A2A2A',      // Dark gray background
            panelBg: '#1A1A1A',         // Darker panel background
            text: '#D4B896',            // Beige/tan text
            textBright: '#F5E6D3',      // Bright beige/cream
            textDim: '#8B7355',         // Dim brown/tan
            yellow: '#E8D4A0',          // Sandy yellow
            orange: '#D4A574',          // Tan/orange
            red: '#C85050',             // Muted red
            green: '#88AA88',           // Muted green
            cyan: '#A0C8C8',            // Muted cyan/teal
            border: '#6B5D4F',          // Brown border
            button: '#3A3A3A',          // Gray button background
            buttonHover: '#4A4A4A',     // Lighter gray hover
            gridLine: '#2F2F2F',        // Grid lines
            cursorBg: '#3F3932',        // Subtle gray-brown cursor background
            patternBg: '#0F0F0F',       // Very dark pattern area
        };
        
        this.charWidth = 8;
        this.charHeight = 14;
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.lastMouseDown = false;
        this.rightMouseDown = false;
        this.lastRightMouseDown = false;
        
        // Event handling
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            
            // Calculate the actual rendered size with object-fit: contain
            const canvasAspect = this.canvas.width / this.canvas.height;
            const rectAspect = rect.width / rect.height;
            
            let renderWidth, renderHeight, offsetX, offsetY;
            
            if (rectAspect > canvasAspect) {
                // Letterboxing on sides
                renderHeight = rect.height;
                renderWidth = renderHeight * canvasAspect;
                offsetX = (rect.width - renderWidth) / 2;
                offsetY = 0;
            } else {
                // Letterboxing on top/bottom
                renderWidth = rect.width;
                renderHeight = renderWidth / canvasAspect;
                offsetX = 0;
                offsetY = (rect.height - renderHeight) / 2;
            }
            
            // Calculate scale factors based on actual rendered size
            this.scaleX = this.canvas.width / renderWidth;
            this.scaleY = this.canvas.height / renderHeight;
            
            // Adjust mouse coordinates for scaling and offset
            this.mouseX = (e.clientX - rect.left - offsetX) * this.scaleX;
            this.mouseY = (e.clientY - rect.top - offsetY) * this.scaleY;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.mouseDown = true;
            } else if (e.button === 2) { // Right click
                this.rightMouseDown = true;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
            } else if (e.button === 2) {
                this.rightMouseDown = false;
            }
        });
        
        // Prevent context menu on right-click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    /**
     * Draw text using a bitmap-style font
     */
    text(str, x, y, color = 'text', align = 'left') {
        this.ctx.font = `${this.charHeight}px "Courier New", monospace`;
        this.ctx.fillStyle = this.colors[color] || color;
        this.ctx.textBaseline = 'top';
        
        if (align === 'center') {
            this.ctx.textAlign = 'center';
        } else if (align === 'right') {
            this.ctx.textAlign = 'right';
        } else {
            this.ctx.textAlign = 'left';
        }
        
        this.ctx.fillText(str, x, y);
        this.ctx.textAlign = 'left';
    }
    
    /**
     * Draw a filled rectangle
     */
    rect(x, y, w, h, color) {
        this.ctx.fillStyle = this.colors[color] || color;
        this.ctx.fillRect(x, y, w, h);
    }
    
    /**
     * Draw a rectangle border
     */
    border(x, y, w, h, color, thickness = 1) {
        this.ctx.strokeStyle = this.colors[color] || color;
        this.ctx.lineWidth = thickness;
        this.ctx.strokeRect(x, y, w, h);
    }
    
    /**
     * Draw a panel with border
     */
    panel(x, y, w, h, title = null) {
        // Background
        this.rect(x, y, w, h, 'panelBg');
        
        // Border (3D effect)
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, w, h);
        
        // Title bar if provided
        if (title) {
            this.rect(x + 2, y + 2, w - 4, this.charHeight + 4, 'button');
            this.text(title, x + 6, y + 4, 'textBright');
        }
    }
    
    /**
     * Draw a button with optional hover state
     */
    button(x, y, w, h, label, centered = true) {
        const hover = this.isMouseOver(x, y, w, h);
        const clicked = hover && this.mouseDown && !this.lastMouseDown;
        
        // Button background
        this.rect(x, y, w, h, hover ? 'buttonHover' : 'button');
        
        // Border
        this.border(x, y, w, h, 'border', 1);
        
        // Label
        const textX = centered ? x + w / 2 : x + 4;
        const textY = y + (h - this.charHeight) / 2;
        this.text(label, textX, textY, 'textBright', centered ? 'center' : 'left');
        
        return clicked;
    }
    
    /**
     * Check if mouse is over a region
     */
    isMouseOver(x, y, w, h) {
        return this.mouseX >= x && this.mouseX <= x + w &&
               this.mouseY >= y && this.mouseY <= y + h;
    }
    
    /**
     * Draw a horizontal line
     */
    line(x1, y1, x2, y2, color, thickness = 1) {
        this.ctx.strokeStyle = this.colors[color] || color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    /**
     * Draw hex number with padding
     */
    hex(value, x, y, digits = 2, color = 'text') {
        const str = value.toString(16).toUpperCase().padStart(digits, '0');
        this.text(str, x, y, color);
    }
    
    /**
     * Update mouse state
     */
    update() {
        this.lastMouseDown = this.mouseDown;
        this.lastRightMouseDown = this.rightMouseDown;
    }
}
