/**
 * TinyTracker Renderer - Simplified Modern UI
 * Beginner-friendly, mouse-driven interface
 */

const NOTE_NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
const CHANNEL_NAMES = ['Melody', 'Accompany', 'Bass', 'Drums'];

// Effect descriptions for beginners
const EFFECTS = [
    { id: 0, name: 'None', desc: 'No effect' },
    { id: 1, name: 'Slide Up', desc: 'Pitch slides up' },
    { id: 2, name: 'Slide Down', desc: 'Pitch slides down' },
    { id: 4, name: 'Vibrato', desc: 'Wobble effect' },
    { id: 10, name: 'Volume Slide', desc: 'Change volume' },
    { id: 12, name: 'Set Volume', desc: 'Set volume level' }
];

export class Renderer {
    constructor(ui) {
        this.ui = ui;
        this.selectedNote = 48; // C-4 by default
        this.selectedOctave = 4;
        this.selectedEffect = 0;
        this.hoveredCell = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.clickRegions = {}; // Store clickable regions
        this.pendingAction = null; // Store action to return from clicks
        this.sequencerArea = null; // Store sequencer bounds for wheel scrolling
        this.patternArea = null; // Store pattern grid bounds for wheel scrolling
        this.effectsScrollOffset = 0; // Scroll offset for effects list
        this.effectsArea = null; // Store effects bounds for wheel scrolling
        
        // Add mouse event listeners
        this.setupMouseEvents();
    }
    
    setupMouseEvents() {
        const canvas = this.ui.canvas;
        
        // Use UI's mouse coordinates (which handle scaling properly)
        // Track mouse position is already handled by UI class
        
        // Handle left clicks
        canvas.addEventListener('click', (e) => {
            // Use the UI's already-scaled mouse coordinates
            this.handleClick(this.ui.mouseX, this.ui.mouseY, 'left');
        });
        
        // Handle right clicks (context menu)
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent context menu from appearing
            // Use the UI's already-scaled mouse coordinates
            this.handleClick(this.ui.mouseX, this.ui.mouseY, 'right');
        });
        
        // Handle mouse wheel for scrolling sequencer, pattern grid, and effects
        canvas.addEventListener('wheel', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;
            
            // Check if mouse is over effects area
            if (this.effectsArea &&
                mouseX >= this.effectsArea.x && 
                mouseX <= this.effectsArea.x + this.effectsArea.w &&
                mouseY >= this.effectsArea.y && 
                mouseY <= this.effectsArea.y + this.effectsArea.h) {
                
                e.preventDefault();
                const delta = e.deltaY > 0 ? 1 : -1;
                this.effectsScrollOffset = Math.max(0, this.effectsScrollOffset + delta);
            }
            // Check if mouse is over sequencer area
            else if (this.sequencerArea &&
                mouseX >= this.sequencerArea.x && 
                mouseX <= this.sequencerArea.x + this.sequencerArea.w &&
                mouseY >= this.sequencerArea.y && 
                mouseY <= this.sequencerArea.y + this.sequencerArea.h) {
                
                e.preventDefault();
                const delta = e.deltaY > 0 ? 1 : -1;
                this.pendingAction = delta > 0 ? 'scrollSeqDown' : 'scrollSeqUp';
            }
            // Check if mouse is over pattern grid area
            else if (this.patternArea &&
                mouseX >= this.patternArea.x && 
                mouseX <= this.patternArea.x + this.patternArea.w &&
                mouseY >= this.patternArea.y && 
                mouseY <= this.patternArea.y + this.patternArea.h) {
                
                e.preventDefault();
                const delta = e.deltaY > 0 ? 1 : -1;
                this.pendingAction = delta > 0 ? 'scrollPatternDown' : 'scrollPatternUp';
            }
        }, { passive: false });
        
        // Add cursor pointer style for better UX
        canvas.style.cursor = 'pointer';
    }
    
    handleClick(x, y, button = 'left') {
        // Check all click regions
        for (const [name, region] of Object.entries(this.clickRegions)) {
            if (x >= region.x && x <= region.x + region.w &&
                y >= region.y && y <= region.y + region.h) {
                if (region.callback) {
                    const result = region.callback(button);
                    if (result) {
                        this.pendingAction = result; // Store action to return
                    }
                }
                break;
            }
        }
    }
    
    registerClickRegion(name, x, y, w, h, callback) {
        this.clickRegions[name] = { x, y, w, h, callback };
    }
    
    clearClickRegions() {
        this.clickRegions = {};
    }
    
    /**
     * Draw the entire tracker interface
     */
    draw(state) {
        this.ui.clear();
        this.clearClickRegions(); // Clear click regions from previous frame
        
        // Modern 3-column layout
        const leftPanelWidth = 140;   // Note palette (narrower)
        const rightPanelWidth = 160;  // Controls (narrower)
        const gridX = leftPanelWidth + 10;
        const gridWidth = this.ui.width - leftPanelWidth - rightPanelWidth - 20;
        
        let action = null;
        
        // Left panel: Note palette
        action = this.drawNotePalette(10, 10, leftPanelWidth, this.ui.height - 20, state) || action;
        
        // Center: Pattern grid
        action = this.drawPatternGrid(gridX, 10, gridWidth, this.ui.height - 60, state) || action;
        
        // Bottom bar: Playback controls
        action = this.drawPlaybackBar(gridX, this.ui.height - 50, gridWidth, 40, state) || action;
        
        // Right panel: Presets and effects
        action = this.drawControlPanel(this.ui.width - rightPanelWidth - 10, 10, rightPanelWidth, this.ui.height - 20, state) || action;
        
        // Check for pending action from mouse click
        if (this.pendingAction) {
            action = this.pendingAction;
            this.pendingAction = null;
        }
        
        return action;
    }
    
    /**
     * Draw note palette (left panel)
     */
    drawNotePalette(x, y, width, height, state) {
        this.ui.panel(x, y, width, height, 'Notes');
        
        let py = y + 30;
        const btnH = 25;
        
        // Octave selector
        // this.ui.text('Octave:', x + 8, py, 'textBright');
        // py += 18;
        
        for (let oct = 2; oct <= 6; oct++) {
            const selected = this.selectedOctave === oct;
            const color = selected ? 'cyan' : 'button';
            const bx = x + 8 + (oct - 2) * 25;  // Narrower spacing (24 instead of 30)
            const by = py;
            
            this.ui.rect(bx, by, 22, 20, color);  // Narrower buttons (22 instead of 25)
            this.ui.text(oct.toString(), bx + 6, by + 3, selected ? 'background' : 'text');
            
            // Register click region
            this.registerClickRegion(`octave_${oct}`, bx, by, 22, 20, () => {
                this.selectedOctave = oct;
                // Update selected note to match new octave
                this.selectedNote = oct * 12 + (this.selectedNote % 12);
            });
        }
        py += 30;
        
        // Piano-style note buttons
        this.ui.text('Notes:', x + 8, py, 'textDim');
        
        // Small erase button next to "Notes:" - right aligned
        const eraseX = x + width - 28;  // Right aligned to panel edge
        const eraseSelected = this.selectedNote === 0;
        this.ui.rect(eraseX, py - 2, 16, 12, eraseSelected ? 'cyan' : 'button');
        this.ui.border(eraseX, py - 2, 16, 12, eraseSelected ? 'yellow' : '#666', 1);
        
        // Register click region for erase
        this.registerClickRegion('erase', eraseX, py - 2, 16, 12, () => {
            this.selectedNote = 0; // 0 = erase mode
        });
        
        py += 16;
        
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        for (let i = 0; i < notes.length; i++) {
            const noteNum = this.selectedOctave * 12 + i;
            const selected = this.selectedNote === noteNum;
            const isSharp = notes[i].includes('#');
            
            // Highlight both white and black notes when selected
            let btnColor;
            if (selected) {
                btnColor = 'cyan';
            } else {
                btnColor = isSharp ? '#444' : '#888';
            }
            const by = py;
            
            this.ui.rect(x + 8, by, width - 16, 16, btnColor);  // Smaller height (16 instead of 20)
            this.ui.border(x + 8, by, width - 16, 16, selected ? 'yellow' : '#666', 1);
            
            const noteText = `${notes[i]}-${this.selectedOctave}`;
            this.ui.text(noteText, x + 12, by + 2, selected ? 'background' : 'textBright');
            
            // Register click region
            this.registerClickRegion(`note_${i}`, x + 8, by, width - 16, 16, async () => {
                this.selectedNote = noteNum;
                // Play the note when clicked
                if (state.audio) {
                    await state.audio.resume(); // Resume audio context if suspended
                    const engine = state.audio.getEngine();
                    const ch = engine.channels[0]; // Use channel 0 for preview
                    ch.effect = 0; // Clear any effects
                    ch.param = 0;
                    engine.triggerNote(0, noteNum, state.currentInstrument);
                    
                    // Auto-release after 300ms for preview
                    setTimeout(() => {
                        if (ch.active && ch.note === noteNum) {
                            ch.envPhase = 3; // Release phase
                            ch.envTime = 0;
                        }
                    }, 300);
                }
            });
            
            py += 17;  // Smaller spacing (17 instead of 21)
        }
        
        py += 8;
        
        // Effects section
        this.ui.text('Effects:', x + 8, py, 'textBright');
        
        // Small clear effect button next to "Effects:" - right aligned
        const clearEffectX = x + width - 28;  // Right aligned to panel edge
        const noEffectSelected = this.selectedEffect === 0;
        this.ui.rect(clearEffectX, py, 16, 12, noEffectSelected ? 'cyan' : 'button');
        this.ui.border(clearEffectX, py, 16, 12, noEffectSelected ? 'yellow' : '#666', 1);
        
        // Register click region for clear effect
        this.registerClickRegion('effect_none', clearEffectX, py - 2, 16, 12, () => {
            this.selectedEffect = 0; // 0 = no effect
        });
        
        py += 18;
        
        const effectsStartY = py;
        const effectsHeight = height - (py - y) - 8; // Remaining space in panel
        
        // Store effects area for wheel scrolling
        this.effectsArea = { x: x + 8, y: effectsStartY, w: width - 16, h: effectsHeight };
        
        // Extended effect list with new effects
        const effects = [
            { id: 1, name: 'Arpeggio', defaultParam: 0x37 },        // Major chord (3 + 7 semitones)
            { id: 2, name: 'Slide Up', defaultParam: 0x10 },        // Moderate slide up
            { id: 3, name: 'Slide Dn', defaultParam: 0x10 },        // Moderate slide down
            { id: 4, name: 'Vibrato', defaultParam: 0x44 },         // Speed 4, Depth 4
            { id: 5, name: 'Portamento', defaultParam: 0x20 },      // Slide to note (param = speed)
            { id: 10, name: 'Vol Slide', defaultParam: 0x0F },      // Slide down by F
            { id: 12, name: 'Set Vol', defaultParam: 0x40 },        // Full volume (64 in decimal)
            { id: 13, name: 'Note Cut', defaultParam: 0x08 },       // Cut after 8 ticks
            { id: 14, name: 'Retrigger', defaultParam: 0x04 },      // Retrigger every 4 ticks
            { id: 15, name: 'Duty Cycle', defaultParam: 0x80 }      // 50% duty cycle (128/255)
        ];
        
        // Calculate visible effects based on scroll
        const effectHeight = 16;
        const effectSpacing = 17;
        const maxVisibleEffects = Math.floor(effectsHeight / effectSpacing);
        
        // Clamp scroll offset
        this.effectsScrollOffset = Math.max(0, Math.min(this.effectsScrollOffset, effects.length - maxVisibleEffects));
        
        // Enable scissor to clip effects outside the area
        this.ui.ctx.save();
        this.ui.ctx.beginPath();
        this.ui.ctx.rect(x + 8, effectsStartY, width - 16, effectsHeight);
        this.ui.ctx.clip();
        
        for (let i = this.effectsScrollOffset; i < Math.min(effects.length, this.effectsScrollOffset + maxVisibleEffects + 1); i++) {
            const effect = effects[i];
            const selected = this.selectedEffect === effect.id;
            const by = effectsStartY + (i - this.effectsScrollOffset) * effectSpacing;
            
            // Skip if outside visible area
            if (by + effectHeight < effectsStartY || by > effectsStartY + effectsHeight) continue;
            
            this.ui.rect(x + 8, by, width - 16, effectHeight, selected ? 'cyan' : 'button');
            this.ui.border(x + 8, by, width - 16, effectHeight, selected ? 'yellow' : '#666', 1);
            this.ui.text(effect.name, x + 12, by + 2, selected ? 'background' : 'text');
            
            // Register click region
            this.registerClickRegion(`effect_${effect.id}`, x + 8, by, width - 16, effectHeight, () => {
                this.selectedEffect = effect.id;
                // Set default parameter for this effect
                state.effectParam = effect.defaultParam;
            });
        }
        
        this.ui.ctx.restore();
        
        return null;
    }
    
    /**
     * Draw pattern grid (center)
     */
    drawPatternGrid(x, y, width, height, state) {
        // Draw panel without title (we'll draw custom title bar)
        this.ui.rect(x, y, width, height, 'panelBg');
        this.ui.ctx.strokeStyle = this.ui.colors.border;
        this.ui.ctx.lineWidth = 2;
        this.ui.ctx.strokeRect(x, y, width, height);
        
        // Custom title bar with Save/Load buttons
        const titleBarHeight = this.ui.charHeight + 4;
        this.ui.rect(x + 2, y + 2, width - 4, titleBarHeight, 'button');
        this.ui.text('Pattern Editor', x + 6, y + 4, 'textBright');
        
        // Save and Load buttons (right-aligned)
        const buttonWidth = 50;
        const buttonHeight = 16;
        const buttonY = y + 5;
        const buttonSpacing = 4;
        
        // Save button
        const saveX = x + width - buttonWidth - 8;
        this.ui.text('SAVE', saveX + 10, buttonY, 'orange');
        this.registerClickRegion('save', saveX, buttonY, buttonWidth, buttonHeight, () => {
            return 'saveSong';
        });
        
        // Load button
        const loadX = saveX - buttonWidth - buttonSpacing;
        this.ui.text('LOAD', loadX + 10, buttonY, 'cyan');
        this.registerClickRegion('load', loadX, buttonY, buttonWidth, buttonHeight, () => {
            return 'loadSong';
        });
        
        const patternNum = state.song.patternOrder[state.currentPosition];
        let pattern = state.song.patterns[patternNum];
        
        // Auto-create pattern if it doesn't exist
        if (!pattern) {
            // Import TinyPattern class
            import('../engine/audio-engine.js').then(({ TinyPattern }) => {
                pattern = new TinyPattern();
                state.song.patterns[patternNum] = pattern;
            });
            return null; // Skip drawing this frame
        }
        
        const gridY = y + 30;
        const rowNumWidth = 28;  // Space for row numbers
        const gridStartX = x + rowNumWidth + 2;  // Small gap between numbers and grid
        const availableWidth = width - rowNumWidth - 8;  // Width for channels
        const cellWidth = 110;  // Better width per cell (was 60, now 90)
        const rowHeight = 16;
        const headerHeight = 20;
        
        // Calculate how many rows can fit in available space
        const availableHeight = height - 30 - 8; // Subtract title bar and padding
        const maxVisibleRows = Math.floor((availableHeight - headerHeight) / rowHeight);
        
        // Store pattern area for mouse wheel scrolling
        const gridWidth = cellWidth * 4;
        const gridHeight = availableHeight;
        this.patternArea = { x: x + 8, y: gridY, w: width - 16, h: gridHeight };
        
        // Channel headers
        for (let ch = 0; ch < 4; ch++) {
            const chX = gridStartX + ch * cellWidth;
            const isMuted = state.mutedChannels[ch];
            
            // Darken header if muted
            const headerColor = isMuted ? '#222' : '#334';
            this.ui.rect(chX, gridY, cellWidth - 1, headerHeight, headerColor);
            
            // Shorter channel names
            const shortNames = ['Mel', 'Acc', 'Bas', 'Drm'];
            const textColor = isMuted ? '#666' : 'yellow';
            this.ui.text(shortNames[ch], chX + 3, gridY + 4, textColor);
            
            // Show mute indicator
            if (isMuted) {
                this.ui.text('M', chX + cellWidth - 16, gridY + 4, 'red');
            }
            
            // Register click region for muting
            this.registerClickRegion(`channel_header_${ch}`, chX, gridY, cellWidth - 1, headerHeight, () => {
                return `toggleMute_${ch}`;
            });
        }
        
        // Pattern rows - dynamically calculated to fill available space
        const halfVisible = Math.floor(maxVisibleRows / 2);
        const startRow = Math.max(0, Math.min(state.currentRow - halfVisible, 32 - maxVisibleRows));
        const endRow = Math.min(32, startRow + maxVisibleRows);
        
        for (let row = startRow; row < endRow; row++) {
            const rowY = gridY + headerHeight + (row - startRow) * rowHeight;
            const isCurrent = row === state.currentRow;
            const isPlaying = state.playing && row === state.playingRow;
            
            // Row number - compact
            this.ui.text(row.toString().padStart(2, '0'), x + 8, rowY + 2, isCurrent ? 'yellow' : 'textDim');
            
            // Cells for each channel
            for (let ch = 0; ch < 4; ch++) {
                const chX = gridStartX + ch * cellWidth;
                const note = pattern.getNote(row, ch);
                
                // Cell background
                let cellBg = '#222';
                if (isPlaying) cellBg = '#2a4';
                else if (isCurrent && ch === state.currentChannel) cellBg = '#446';
                else if (isCurrent) cellBg = '#334';
                
                this.ui.rect(chX, rowY, cellWidth - 1, rowHeight, cellBg);
                this.ui.border(chX, rowY, cellWidth - 1, rowHeight, isCurrent ? 'cyan' : '#444', 1);
                
                // Cell is split: left side = note, right side = effect
                const noteSectionWidth = 60;  // Width for note + instrument
                const effectSectionWidth = cellWidth - noteSectionWidth - 1;
                
                // Note display - compact format
                if (note.note > 0) {
                    const noteStr = this.getNoteString(note.note);
                    this.ui.text(noteStr, chX + 2, rowY + 2, 'textBright');
                    
                    // Preset number - single digit or compact (increased spacing)
                    const presetNum = note.instrument + 1;
                    this.ui.text(presetNum.toString(), chX + 40, rowY + 2, 'green');
                } else {
                    this.ui.text('---', chX + 2, rowY + 2, 'textDim');
                }
                
                // Separator between note and effect
                this.ui.rect(chX + noteSectionWidth, rowY + 1, 1, rowHeight - 2, '#555');
                
                // Effect display
                const effectX = chX + noteSectionWidth + 3;
                if (note.effect > 0) {
                    const effectStr = note.effect.toString(16).toUpperCase();
                    const paramStr = note.param.toString(16).padStart(2, '0').toUpperCase();
                    this.ui.text(`${effectStr}-${paramStr}`, effectX, rowY + 2, 'orange');
                } else {
                    this.ui.text('---', effectX, rowY + 2, 'textDim');
                }
                
                // Register click region for note section
                this.registerClickRegion(`cell_note_${row}_${ch}`, chX, rowY, noteSectionWidth, rowHeight, async (button) => {
                    if (button === 'right') {
                        // Right click: delete note
                        note.note = 0;
                        note.instrument = 0;
                    } else {
                        // Left click: place the selected note
                        note.note = this.selectedNote;
                        note.instrument = state.currentInstrument;
                        
                        // Play the note when placing it
                        if (this.selectedNote > 0 && state.audio) {
                            await state.audio.resume();
                            const engine = state.audio.getEngine();
                            const channelState = engine.channels[ch];
                            channelState.effect = 0; // Clear any effects for preview
                            channelState.param = 0;
                            engine.triggerNote(ch, this.selectedNote, state.currentInstrument);
                            
                            // Auto-release after 300ms for preview
                            setTimeout(() => {
                                if (channelState.active && channelState.note === this.selectedNote) {
                                    channelState.envPhase = 3; // Release phase
                                    channelState.envTime = 0;
                                }
                            }, 300);
                        }
                    }
                    
                    // Update channel but don't scroll
                    state.currentChannel = ch;
                });
                
                // Register click region for effect section
                this.registerClickRegion(`cell_effect_${row}_${ch}`, chX + noteSectionWidth, rowY, effectSectionWidth, rowHeight, (button) => {
                    if (button === 'right') {
                        // Right click: delete effect
                        note.effect = 0;
                        note.param = 0;
                    } else {
                        // Left click: apply selected effect
                        note.effect = this.selectedEffect;
                        note.param = state.effectParam || 0x10; // Default param
                    }
                    
                    // Update channel but don't scroll
                    state.currentChannel = ch;
                });
            }
        }
        
        return null;
    }
    
    /**
     * Draw playback bar (bottom)
     */
    drawPlaybackBar(x, y, width, height, state) {
        this.ui.rect(x, y, width, height, '#333');
        this.ui.border(x, y, width, height, '#666', 2);
        
        let bx = x + 10;
        
        // Play/Stop button
        const playLabel = state.playing ? 'STOP' : 'PLAY';
        const playColor = state.playing ? 'red' : 'green';
        const playX = bx;
        const playY = y + 5;
        
        this.ui.rect(playX, playY, 80, 30, playColor);
        this.ui.border(playX, playY, 80, 30, 'border', 2);
        this.ui.text(playLabel, playX + 18, playY + 8, 'textBright');
        
        // Register click region for play button
        this.registerClickRegion('play', playX, playY, 80, 30, () => {
            return 'togglePlay';  // RETURN the action
        });
        
        bx += 90;
        
        // Loop checkbox
        const loopColor = state.patternLoopMode ? 'green' : 'button';
        const loopX = bx;
        const loopY = y + 5;
        
        this.ui.rect(loopX, loopY, 30, 30, loopColor);
        this.ui.border(loopX, loopY, 30, 30, 'border', 2);
        if (state.patternLoopMode) {
            this.ui.text('✓', loopX + 10, loopY + 8, 'textBright');
        }
        this.ui.text('Loop', loopX + 40, loopY + 8, 'text');
        
        // Register click region for loop checkbox
        this.registerClickRegion('loop', loopX, loopY, 30, 30, () => {
            return 'togglePatternLoop';  // RETURN the action
        });
        
        bx += 90;
        
        // Follow checkbox
        const followColor = state.followPlayback ? 'green' : 'button';
        const followX = bx;
        const followY = y + 5;
        
        this.ui.rect(followX, followY, 30, 30, followColor);
        this.ui.border(followX, followY, 30, 30, 'border', 2);
        if (state.followPlayback) {
            this.ui.text('✓', followX + 10, followY + 8, 'textBright');
        }
        this.ui.text('Follow', followX + 40, followY + 8, 'text');
        
        // Register click region for follow checkbox
        this.registerClickRegion('follow', followX, followY, 30, 30, () => {
            return 'toggleFollow';  // RETURN the action
        });
        
        bx += 110;
        
        // Position display
        this.ui.text(`Pos: ${state.currentPosition}  Pat: ${state.song.patternOrder[state.currentPosition]}`, bx, y + 13, 'cyan');
        
        return null;
    }
    
    /**
     * Draw control panel (right)
     */
    drawControlPanel(x, y, width, height, state) {
        this.ui.panel(x, y, width, height, 'Controls');
        
        let py = y + 30;
        
        // Preset selector
        this.ui.text('Preset:', x + 8, py, 'textBright');
        py += 18;
        
        for (let i = 0; i < 8; i++) {
            const selected = i === state.currentInstrument;
            const color = selected ? 'cyan' : 'button';
            const px = x + 8 + (i % 4) * 38;  // Narrower spacing (38 instead of 45)
            const ppy = py + Math.floor(i / 4) * 28;  // Tighter vertical spacing
            
            this.ui.rect(px, ppy, 35, 23, color);  // Smaller buttons
            this.ui.border(px, ppy, 35, 23, selected ? 'yellow' : '#666', 1);
            this.ui.text((i + 1).toString(), px + 12, ppy + 5, selected ? 'background' : 'text');
            
            // Register click region for preset
            this.registerClickRegion(`preset_${i}`, px, ppy, 35, 23, () => {
                state.currentInstrument = i;
            });
        }
        py += 65;
        
        // Preset parameters with +/- controls
        const inst = state.song.instruments[state.currentInstrument];
        this.ui.text('Envelope:', x + 8, py, 'yellow');
        py += 16;
        
        // Attack
        this.ui.text(`A:`, x + 8, py, 'text');
        this.ui.text(`${(inst.attack * 1000).toFixed(0)}ms`, x + 30, py, 'textBright');
        // - button
        this.ui.rect(x + width - 45, py - 2, 18, 12, '#555');
        this.ui.text('-', x + width - 41, py-3, 'text');
        this.registerClickRegion('attack_dec', x + width - 45, py - 2, 18, 12, () => {
            inst.attack = Math.max(0.001, inst.attack - 0.01);
        });
        // + button
        this.ui.rect(x + width - 24, py - 2, 18, 12, '#555');
        this.ui.text('+', x + width - 19, py-3, 'text');
        this.registerClickRegion('attack_inc', x + width - 24, py - 2, 18, 12, () => {
            inst.attack = Math.min(1.0, inst.attack + 0.01);
        });
        py += 13;
        
        // Decay
        this.ui.text(`D:`, x + 8, py, 'text');
        this.ui.text(`${(inst.decay * 1000).toFixed(0)}ms`, x + 30, py, 'textBright');
        // - button
        this.ui.rect(x + width - 45, py - 2, 18, 12, '#555');
        this.ui.text('-', x + width - 41, py - 3, 'text');
        this.registerClickRegion('decay_dec', x + width - 45, py - 2, 18, 12, () => {
            inst.decay = Math.max(0.001, inst.decay - 0.01);
        });
        // + button
        this.ui.rect(x + width - 24, py - 2, 18, 12, '#555');
        this.ui.text('+', x + width - 19, py - 3, 'text');
        this.registerClickRegion('decay_inc', x + width - 24, py - 2, 18, 12, () => {
            inst.decay = Math.min(1.0, inst.decay + 0.01);
        });
        py += 13;
        
        // Sustain
        this.ui.text(`S:`, x + 8, py, 'text');
        this.ui.text(`${(inst.sustain * 100).toFixed(0)}%`, x + 30, py, 'textBright');
        // - button
        this.ui.rect(x + width - 45, py - 2, 18, 12, '#555');
        this.ui.text('-', x + width - 41, py - 3, 'text');
        this.registerClickRegion('sustain_dec', x + width - 45, py - 2, 18, 12, () => {
            inst.sustain = Math.max(0.0, inst.sustain - 0.05);
        });
        // + button
        this.ui.rect(x + width - 24, py - 2, 18, 12, '#555');
        this.ui.text('+', x + width - 19, py - 3, 'text');
        this.registerClickRegion('sustain_inc', x + width - 24, py - 2, 18, 12, () => {
            inst.sustain = Math.min(1.0, inst.sustain + 0.05);
        });
        py += 13;
        
        // Release
        this.ui.text(`R:`, x + 8, py, 'text');
        this.ui.text(`${(inst.release * 1000).toFixed(0)}ms`, x + 30, py, 'textBright');
        // - button
        this.ui.rect(x + width - 45, py - 2, 18, 12, '#555');
        this.ui.text('-', x + width - 41, py - 3, 'text');
        this.registerClickRegion('release_dec', x + width - 45, py - 2, 18, 12, () => {
            inst.release = Math.max(0.001, inst.release - 0.01);
        });
        // + button
        this.ui.rect(x + width - 24, py - 2, 18, 12, '#555');
        this.ui.text('+', x + width - 19, py - 3, 'text');
        this.registerClickRegion('release_inc', x + width - 24, py - 2, 18, 12, () => {
            inst.release = Math.min(1.0, inst.release + 0.01);
        });
        py += 25;
        
        // Effect Parameter
        this.ui.text('Effect Param:', x + 8, py, 'yellow');
        py += 18;
        this.ui.text(`Value:`, x + 8, py, 'text');
        const paramHex = state.effectParam.toString(16).padStart(2, '0').toUpperCase();
        this.ui.text(`0x${paramHex}`, x + 69, py, 'textBright');
        // - button (decrease by 1)
        this.ui.rect(x + width - 45, py, 18, 12, '#555');
        this.ui.text('-', x + width - 41, py -1, 'text');
        this.registerClickRegion('param_dec', x + width - 45, py, 18, 12, () => {
            state.effectParam = Math.max(0, state.effectParam - 1);
        });
        // + button (increase by 1)
        this.ui.rect(x + width - 24, py, 18, 12, '#555');
        this.ui.text('+', x + width - 19, py - 1, 'text');
        this.registerClickRegion('param_inc', x + width - 24, py, 18, 12, () => {
            state.effectParam = Math.min(255, state.effectParam + 1);
        });
        py += 25;
        
        // Song Sequencer
        this.ui.text('Song Order:', x + 8, py, 'yellow');
        py += 16;
        
        const seqHeight = y + height - py - 30;  // Reserve 30px for buttons at bottom
        const seqY = py;
        
        // Store sequencer area for mouse wheel scrolling
        this.sequencerArea = { x: x + 8, y: seqY, w: width - 16, h: seqHeight };
        
        // Background for sequencer
        this.ui.rect(x + 8, seqY, width - 16, seqHeight, '#1a1a1a');
        this.ui.border(x + 8, seqY, width - 16, seqHeight, '#666', 1);
        
        // Draw pattern order positions (scrollable)
        const rowH = 16;
        const visibleRows = Math.floor((seqHeight - 4) / rowH);
        const startPos = Math.max(0, state.currentPosition - Math.floor(visibleRows / 2));
        const endPos = Math.min(state.song.songLength, startPos + visibleRows);
        
        for (let pos = startPos; pos < endPos; pos++) {
            const rowY = seqY + 2 + (pos - startPos) * rowH;
            const isCurrent = pos === state.currentPosition;
            
            // Highlight current position
            if (isCurrent) {
                this.ui.rect(x + 10, rowY, width - 20, rowH, '#334');
            }
            
            // Position number
            this.ui.text(pos.toString().padStart(2, '0'), x + 12, rowY + 2, isCurrent ? 'yellow' : 'textDim');
            
            // Pattern number
            const pattern = state.song.patternOrder[pos];
            this.ui.text(`P${pattern.toString().padStart(2, '00')}`, x + 35, rowY + 2, isCurrent ? 'cyan' : 'text');
            
            // -/+ buttons for this position
            const btnY = rowY + 2;
            
            // - button (decrease pattern)
            const minusBtnX = x + width - 45;
            this.ui.rect(minusBtnX, btnY, 15, 12, '#444');
            this.ui.text('-', minusBtnX + 2, btnY - 2, 'text');
            this.registerClickRegion(`seq_dec_${pos}`, minusBtnX, btnY, 15, 12, () => {
                const newPattern = Math.max(0, state.song.patternOrder[pos] - 1);
                state.song.patternOrder[pos] = newPattern;
            });
            
            // + button (increase pattern)
            const plusBtnX = x + width - 28;
            this.ui.rect(plusBtnX, btnY, 15, 12, '#444');
            this.ui.text('+', plusBtnX + 3, btnY - 1, 'text');
            this.registerClickRegion(`seq_inc_${pos}`, plusBtnX, btnY, 15, 12, () => {
                const newPattern = Math.min(15, state.song.patternOrder[pos] + 1);
                state.song.patternOrder[pos] = newPattern;
            });
            
            // Click region to select position
            this.registerClickRegion(`seq_pos_${pos}`, x + 12, rowY, 50, rowH, () => {
                state.currentPosition = pos;
            });
        }
        
        // Add/Remove position buttons at bottom
        const btnY = seqY + seqHeight + 5;
        
        // Insert position button
        this.ui.rect(x + 8, btnY, 70, 20, 'green');
        this.ui.border(x + 8, btnY, 70, 20, 'border', 1);
        this.ui.text('Insert', x + 15, btnY + 3, 'textBright');
        this.registerClickRegion('insert_pos', x + 8, btnY, 70, 20, () => {
            return 'insertPosition';
        });
        
        // Delete position button
        this.ui.rect(x + 82, btnY, 70, 20, 'red');
        this.ui.border(x + 82, btnY, 70, 20, 'border', 1);
        this.ui.text('Delete', x + 89, btnY + 3, 'textBright');
        this.registerClickRegion('delete_pos', x + 82, btnY, 70, 20, () => {
            return 'deletePosition';
        });
        
        return null;
    }
    
    /**
     * Convert note number to string (C-4, D#5, etc)
     */
    getNoteString(noteNum) {
        const octave = Math.floor(noteNum / 12);
        const note = noteNum % 12;
        return NOTE_NAMES[note] + octave;
    }
}
