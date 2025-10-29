/**
 * Example usage of the new GUI system
 * This demonstrates the layout capabilities and callbacks
 */

import { GUI } from './gui.js';

// Initialize GUI
const canvas = document.getElementById('canvas');
const gui = new GUI(canvas);

// App state
let currentFile = 'untitled.mod';
let isPlaying = false;
let volume = 0.7;
let tempo = 125;
let selectedInstrument = 0;

// Example: Complex layout with callbacks
function renderUI() {
    gui.beginFrame();
    
    // Create a main panel
    gui.beginPanel({
        width: '90%',
        height: '80%',
        anchor: { x: 0.5, y: 0.5 },
        title: 'Paula Tracker - ' + currentFile,
        padding: 10
    });
    
    // Main column layout
    gui.column({ gap: 8 });
    
        // Top toolbar row
        gui.row({ height: 40, gap: 4 });
            gui.button('New', { 
                width: 80,
                onClick: () => {
                    currentFile = 'untitled.mod';
                    console.log('New file created');
                }
            });
            gui.button('Open', { 
                width: 80,
                onClick: () => {
                    console.log('Open file dialog');
                }
            });
            gui.button('Save', { 
                width: 80,
                onClick: () => {
                    console.log('Saving:', currentFile);
                }
            });
            gui.button(isPlaying ? 'Stop' : 'Play', { 
                width: 80,
                onClick: () => {
                    isPlaying = !isPlaying;
                    console.log('Playback:', isPlaying ? 'started' : 'stopped');
                }
            });
            gui.spacer();
            gui.button('Help', { 
                width: 80,
                onClick: () => {
                    console.log('Help requested');
                }
            });
        gui.endLayout();
        
        // Content area with two columns
        gui.row({ gap: 8 });
        
            // Left sidebar
            gui.column({ width: 200, gap: 4 });
                gui.label('Instruments', { color: 'textBright' });
                
                // Instrument buttons
                gui.column({ height: 150, gap: 2 });
                    for (let i = 0; i < 8; i++) {
                        const isSelected = selectedInstrument === i;
                        gui.button(`${i}: Instrument ${i}`, { 
                            height: 18,
                            onClick: () => {
                                selectedInstrument = i;
                                console.log('Selected instrument:', i);
                            },
                            enabled: true
                        });
                    }
                gui.endLayout();
                
                gui.spacer({ height: 8 });
                
                // Volume slider
                gui.label('Volume', { color: 'textBright' });
                gui.slider(volume, 0, 1, {
                    height: 25,
                    onChange: (v) => {
                        volume = v;
                        console.log('Volume:', Math.round(v * 100) + '%');
                    }
                });
                
                // Tempo control
                gui.label(`Tempo: ${tempo} BPM`, { color: 'textBright' });
                gui.slider(tempo, 60, 200, {
                    height: 25,
                    onChange: (t) => {
                        tempo = Math.round(t);
                        console.log('Tempo:', tempo, 'BPM');
                    }
                });
            gui.endLayout();
            
            // Main pattern editor
            gui.column({ gap: 4 });
                gui.label('Pattern Editor', { 
                    color: 'textBright', 
                    align: 'center' 
                });
                gui.rect({ 
                    color: 'patternBg', 
                    bordered: true,
                    onClick: () => {
                        console.log('Pattern clicked at:', gui.mouseX, gui.mouseY);
                    }
                });
            gui.endLayout();
            
        gui.endLayout();
        
        // Bottom status bar
        gui.row({ height: 30, gap: 8 });
            gui.label(`BPM: ${tempo}`, { width: 100 });
            gui.label('Pattern: 01', { width: 120 });
            gui.label('Row: 00', { width: 100 });
            gui.spacer();
            gui.label(`Channel: ${selectedInstrument + 1}`, { width: 120 });
        gui.endLayout();
        
    gui.endLayout();
    
    gui.endPanel();
    
    gui.endFrame();
}

// Example: Interactive controls demo
function renderControlsDemo() {
    gui.beginFrame();
    
    gui.beginPanel({
        width: '70%',
        height: '80%',
        anchor: { x: 0.5, y: 0.5 },
        title: 'Interactive Controls Demo',
        padding: 10
    });
    
    gui.column({ gap: 12 });
        
        // Buttons section
        gui.label('Buttons with Callbacks', { color: 'textBright' });
        gui.row({ height: 40, gap: 8 });
            gui.button('Click Me!', { 
                width: 120,
                onClick: () => alert('Button clicked!')
            });
            gui.button('Hover Me', { 
                width: 120,
                onHover: () => {
                    // Visual feedback happens automatically
                }
            });
            gui.button('Disabled', { 
                width: 120,
                enabled: false
            });
        gui.endLayout();
        
        // Sliders section
        gui.spacer({ height: 10 });
        gui.label('Sliders', { color: 'textBright' });
        
        gui.slider(0.5, 0, 1, {
            height: 25,
            label: 'Volume',
            onChange: (v) => console.log('Volume:', v)
        });
        
        gui.slider(128, 0, 255, {
            height: 25,
            label: 'Brightness',
            onChange: (v) => console.log('Brightness:', v)
        });
        
        // Select/Dropdown section
        gui.spacer({ height: 10 });
        gui.label('Select (Click to cycle)', { color: 'textBright' });
        
        gui.select('Option 1', ['Option 1', 'Option 2', 'Option 3'], {
            height: 30,
            onChange: (v) => console.log('Selected:', v)
        });
        
        // Clickable labels
        gui.spacer({ height: 10 });
        gui.label('Click this text!', { 
            color: 'cyan',
            onClick: () => console.log('Label clicked!')
        });
        
    gui.endLayout();
    
    gui.endPanel();
    
    gui.endFrame();
}

// Example: Grid with callbacks
function renderGridWithCallbacks() {
    gui.beginFrame();
    
    gui.beginPanel({
        width: '80%',
        height: '70%',
        anchor: { x: 0.5, y: 0.5 },
        title: 'Pattern Grid',
        padding: 10
    });
    
    gui.grid({ columns: 8, gap: 4 });
        for (let i = 0; i < 32; i++) {
            gui.button(`${i.toString(16).toUpperCase()}`, { 
                height: 40,
                onClick: () => {
                    console.log('Pattern', i, 'selected');
                }
            });
        }
    gui.endLayout();
    
    gui.endPanel();
    
    gui.endFrame();
}

// Example: Settings panel with toggles
let settingFlags = {
    autoSave: true,
    showGrid: true,
    snapToGrid: false,
    loopPlayback: true
};

function renderSettings() {
    gui.beginFrame();
    
    gui.beginPanel({
        width: 400,
        height: 300,
        anchor: { x: 0.5, y: 0.5 },
        title: 'Settings',
        padding: 16
    });
    
    gui.column({ gap: 8 });
        
        gui.column({ gap: 10 });
        
        gui.toggle('Auto-save', settingFlags.autoSave, {
            height: 32,
            onChange: (v) => {
                settingFlags.autoSave = v;
                console.log('Auto-save:', v);
            }
        });
        
        gui.toggle('Show Grid', settingFlags.showGrid, {
            height: 32,
            onChange: (v) => {
                settingFlags.showGrid = v;
                console.log('Show grid:', v);
            }
        });
        
        gui.toggle('Snap to Grid', settingFlags.snapToGrid, {
            height: 32,
            onChange: (v) => {
                settingFlags.snapToGrid = v;
                console.log('Snap to grid:', v);
            }
        });
        
        gui.toggle('Loop Playback', settingFlags.loopPlayback, {
            height: 32,
            onChange: (v) => {
                settingFlags.loopPlayback = v;
                console.log('Loop playback:', v);
            }
        });
        
        gui.spacer();
        
        gui.row({ height: 40, gap: 8, justify: 'center' });
            gui.button('Reset Defaults', { 
                width: 150,
                onClick: () => {
                    settingFlags = {
                        autoSave: true,
                        showGrid: true,
                        snapToGrid: false,
                        loopPlayback: true
                    };
                    console.log('Settings reset');
                }
            });
            gui.button('Close', { 
                width: 100,
                onClick: () => {
                    console.log('Settings closed');
                }
            });
        gui.endLayout();
        
    gui.endLayout();
    
    gui.currentLayout = gui.layoutStack.pop();
    
    gui.endFrame();
}

// Animation loop
function animate() {
    // Choose which example to render
    renderUI(); // Main UI with all features
    // renderControlsDemo(); // Interactive controls
    // renderGridWithCallbacks(); // Grid example
    // renderSettings(); // Settings with toggles
    
    requestAnimationFrame(animate);
}

animate();


// Example: Grid layout
function renderGridExample() {
    gui.beginFrame();
    
    const panel = gui.panel({
        width: '80%',
        height: '70%',
        anchor: { x: 0.5, y: 0.5 },
        title: 'Grid Layout Example',
        padding: 10
    });
    
    gui.layoutStack.push(gui.currentLayout);
    gui.currentLayout = panel;
    
    gui.grid({ columns: 4, gap: 8 });
        for (let i = 1; i <= 12; i++) {
            gui.button(`Btn ${i}`, { height: 40 });
        }
    gui.endLayout();
    
    gui.currentLayout = gui.layoutStack.pop();
    
    gui.endFrame();
}

// Example: Wrap layout
function renderWrapExample() {
    gui.beginFrame();
    
    const panel = gui.panel({
        width: '60%',
        height: '80%',
        anchor: { x: 0.5, y: 0.5 },
        title: 'Wrap Layout Example',
        padding: 10
    });
    
    gui.layoutStack.push(gui.currentLayout);
    gui.currentLayout = panel;
    
    gui.wrap({ gap: 8 });
        for (let i = 1; i <= 20; i++) {
            gui.button(`Item ${i}`, { width: 100, height: 30 });
        }
    gui.endLayout();
    
    gui.currentLayout = gui.layoutStack.pop();
    
    gui.endFrame();
}

// Example: Centered dialog
function renderDialogExample() {
    gui.beginFrame();
    
    const dialog = gui.panel({
        width: 400,
        height: 200,
        anchor: { x: 0.5, y: 0.5 }, // Center
        title: 'Confirm Action',
        padding: 16
    });
    
    gui.layoutStack.push(gui.currentLayout);
    gui.currentLayout = dialog;
    
    gui.column({ gap: 16, justify: 'space-between' });
        
        gui.label('Are you sure you want to proceed?', { 
            align: 'center',
            color: 'textBright'
        });
        
        gui.row({ height: 40, gap: 8, justify: 'center' });
            gui.button('Cancel', { width: 100 });
            gui.button('OK', { width: 100 });
        gui.endLayout();
        
    gui.endLayout();
    
    gui.endPanel();
    
    gui.endFrame();
}

// Example: Dashboard with mixed layouts
function renderDashboard() {
    gui.beginFrame();
    
    gui.beginPanel({
        width: '95%',
        height: '90%',
        anchor: { x: 0.5, y: 0.5 },
        title: 'Dashboard',
        padding: 10
    });
    
    gui.column({ gap: 10 });
        
        // Top stats row
        gui.row({ height: 60, gap: 10 });
            gui.column({ align: 'center', justify: 'center' });
                gui.label('Patterns', { color: 'textDim', align: 'center' });
                gui.label('16', { color: 'cyan', align: 'center' });
            gui.endLayout();
            
            gui.column({ align: 'center', justify: 'center' });
                gui.label('Channels', { color: 'textDim', align: 'center' });
                gui.label('4', { color: 'green', align: 'center' });
            gui.endLayout();
            
            gui.column({ align: 'center', justify: 'center' });
                gui.label('Instruments', { color: 'textDim', align: 'center' });
                gui.label('8', { color: 'orange', align: 'center' });
            gui.endLayout();
            
            gui.column({ align: 'center', justify: 'center' });
                gui.label('Tempo', { color: 'textDim', align: 'center' });
                gui.label('125 BPM', { color: 'yellow', align: 'center' });
            gui.endLayout();
        gui.endLayout();
        
        // Main content in 2 columns
        gui.row({ gap: 10 });
            
            // Left: Pattern list
            gui.column({ width: '30%', gap: 8 });
                gui.label('Patterns', { color: 'textBright' });
                gui.grid({ columns: 2, gap: 4 });
                    for (let i = 0; i < 8; i++) {
                        gui.button(`${i.toString(16).toUpperCase()}`, { height: 30 });
                    }
                gui.endLayout();
            gui.endLayout();
            
            // Right: Visualization
            gui.column({ gap: 8 });
                gui.label('Waveform', { color: 'textBright', align: 'center' });
                gui.rect({ color: 'patternBg', bordered: true });
            gui.endLayout();
            
        gui.endLayout();
        
    gui.endLayout();
    
    gui.endPanel();
    
    gui.endFrame();
}

// Animation loop
function animate() {
    // Choose which example to render
    renderUI(); // or renderGridExample(), renderWrapExample(), etc.
    
    requestAnimationFrame(animate);
}

animate();
