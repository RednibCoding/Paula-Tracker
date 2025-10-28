/**
 * TinyTracker Renderer
 * Draws pattern view, instrument list, and playback info
 */

const NOTE_NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
const CHANNEL_NAMES = ['Square', 'Saw', 'Sine', 'Noise'];

export class Renderer {
    constructor(ui) {
        this.ui = ui;
    }
    
    /**
     * Draw the entire tracker interface
     */
    draw(state) {
        this.ui.clear();
        
        // Layout - optimized for 640x400
        const topBarHeight = 50;
        const instrumentPanelWidth = 160;
        const patternY = topBarHeight;
        const patternHeight = this.ui.height - topBarHeight;
        
        // Draw top bar
        const action = this.drawTopBar(state, topBarHeight);
        
        // Draw instrument list (right side)
        this.drawInstrumentList(
            this.ui.width - instrumentPanelWidth,
            patternY,
            instrumentPanelWidth,
            patternHeight,
            state
        );
        
        // Draw pattern editor (left side)
        this.drawPatternEditor(
            0,
            patternY,
            this.ui.width - instrumentPanelWidth,
            patternHeight,
            state
        );
        
        // Draw help overlay if F1 is pressed
        if (state.showHelp) {
            this.drawHelpOverlay();
        }
        
        return action;
    }
    
    /**
     * Draw help overlay
     */
    drawHelpOverlay() {
        const w = 500;
        const h = 360;
        const x = (this.ui.width - w) / 2;
        const y = (this.ui.height - h) / 2;
        
        // Semi-transparent background
        this.ui.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ui.ctx.fillRect(x, y, w, h);
        this.ui.border(x, y, w, h, 'cyan', 2);
        
        let ty = y + 10;
        const tx = x + 16;
        const lh = 14;
        
        this.ui.text('TINYTRACKER HELP (Press F1 to close)', tx, ty, 'cyan');
        ty += lh * 2;
        
        this.ui.text('=== EFFECTS ===', tx, ty, 'yellow');
        ty += lh;
        this.ui.text('0xy - Arpeggio (x,y = semitones)', tx, ty, 'text');
        ty += lh;
        this.ui.text('      Example: 047 = major chord', tx, ty, 'textDim');
        ty += lh;
        this.ui.text('1xx - Pitch slide up (speed)', tx, ty, 'text');
        ty += lh;
        this.ui.text('2xx - Pitch slide down (speed)', tx, ty, 'text');
        ty += lh;
        this.ui.text('4xy - Vibrato (x=speed, y=depth)', tx, ty, 'text');
        ty += lh;
        this.ui.text('Axy - Volume slide (x=up, y=down)', tx, ty, 'text');
        ty += lh;
        this.ui.text('Cxx - Set volume (00-40)', tx, ty, 'text');
        ty += lh * 2;
        
        this.ui.text('=== PATTERN FORMAT ===', tx, ty, 'yellow');
        ty += lh;
        this.ui.text('NOTE | INST | EFFECT', tx, ty, 'text');
        ty += lh;
        this.ui.text('C-4  |  2   |  047    ', tx, ty, 'textDim');
        ty += lh * 2;
        
        this.ui.text('=== INSTRUMENT EDITING ===', tx, ty, 'yellow');
        ty += lh;
        this.ui.text('Shift+A/D/S/R - Adjust ADSR', tx, ty, 'text');
        ty += lh;
        this.ui.text('Shift+W - Duty cycle (square)', tx, ty, 'text');
        ty += lh;
        this.ui.text('Ctrl+1-8 - Select instrument', tx, ty, 'text');
        ty += lh * 2;
        
        this.ui.text('=== PLAYBACK ===', tx, ty, 'yellow');
        ty += lh;
        this.ui.text('L - Toggle pattern loop', tx, ty, 'text');
        ty += lh;
        this.ui.text('F - Toggle follow playback', tx, ty, 'text');
        ty += lh;
        this.ui.text('F5-F8 - Mute channels', tx, ty, 'text');
        ty += lh * 2;
        
        this.ui.text('=== CHORDS (Arpeggio 0xy) ===', tx, ty, 'yellow');
        ty += lh;
        this.ui.text('Major: 047   Minor: 037', tx, ty, 'text');
        ty += lh;
        this.ui.text('Dim:   036   Aug:   048', tx, ty, 'text');
        ty += lh;
        this.ui.text('Oct:   00C   Fifth: 007', tx, ty, 'text');
        ty += lh * 2;
        
        this.ui.text('Press F1 to close', tx + 150, y + h - 24, 'green');
    }
    
    /**
     * Draw top info bar
     */
    drawTopBar(state, height) {
        this.ui.panel(0, 0, this.ui.width, height, 'TINYTRACKER');
        
        const y = 20;
        const col1X = 10;
        const col2X = 150;
        const col3X = 300;
        
        // Song info
        this.ui.text(`Song: ${state.song.title}`, col1X, y, 'textBright');
        this.ui.text(`BPM: ${state.song.bpm}`, col1X, y + 14, 'cyan');
        
        // Position info
        this.ui.text(`Pos: ${state.currentPosition.toString().padStart(2, '0')}/${state.song.songLength.toString().padStart(2, '0')}`, col2X, y, 'yellow');
        this.ui.text(`Row: ${state.currentRow.toString().padStart(2, '0')}/32`, col2X, y + 14, 'yellow');
        
        // Playback controls
        const btnY = y;
        const btnWidth = 45;
        const btnHeight = 18;
        const btnSpacing = 5;
        
        let btnX = col3X;
        
        if (this.ui.button(btnX, btnY, btnWidth, btnHeight, state.playing ? 'STOP' : 'PLAY')) {
            return 'togglePlay';
        }
        
        btnX += btnWidth + btnSpacing;
        if (this.ui.button(btnX, btnY, btnWidth, btnHeight, 'EDIT')) {
            return 'toggleEdit';
        }
        
        btnX += btnWidth + btnSpacing;
        if (this.ui.button(btnX, btnY, btnWidth, btnHeight, 'LOOP')) {
            return 'togglePatternLoop';
        }
        
        btnX += btnWidth + btnSpacing;
        if (this.ui.button(btnX, btnY, btnWidth, btnHeight, 'FOLLOW')) {
            return 'toggleFollow';
        }
        
        // Edit mode indicator
        if (state.editMode) {
            this.ui.rect(col3X + btnWidth + btnSpacing, btnY + btnHeight + 3, btnWidth, 3, 'green');
        }
        
        // Pattern loop indicator
        if (state.patternLoopMode) {
            this.ui.rect(col3X + (btnWidth + btnSpacing) * 2, btnY + btnHeight + 3, btnWidth, 3, 'cyan');
        }
        
        // Follow mode indicator
        if (state.followPlayback) {
            this.ui.rect(col3X + (btnWidth + btnSpacing) * 3, btnY + btnHeight + 3, btnWidth, 3, 'yellow');
        }
        
        return null;
    }
    
    /**
     * Draw pattern editor
     */
    drawPatternEditor(x, y, width, height, state) {
        this.ui.panel(x, y, width, height);
        
        const patternNum = state.song.patternOrder[state.currentPosition];
        const pattern = state.song.patterns[patternNum];
        if (!pattern) return;
        
        const headerHeight = 20;
        const rowHeight = 16;
        const visibleRows = Math.floor((height - headerHeight - 10) / rowHeight);
        
        // Determine which row to center on
        let centerRow = state.currentRow;
        if (state.playing && state.followPlayback) {
            // When following playback, center on the playing row
            centerRow = state.playingRow;
        }
        
        const startRow = Math.max(0, centerRow - Math.floor(visibleRows / 2));
        const endRow = Math.min(32, startRow + visibleRows);
        
        // Draw channel headers
        const channelWidth = (width - 50) / 4;
        for (let ch = 0; ch < 4; ch++) {
            const chX = x + 40 + ch * channelWidth;
            this.ui.text(CHANNEL_NAMES[ch], chX + 8, y + 6, 'cyan');
            
            // Mute indicator
            if (state.mutedChannels[ch]) {
                this.ui.text('M', chX + channelWidth - 20, y + 6, 'red');
            }
        }
        
        // Draw rows
        let rowY = y + headerHeight;
        for (let row = startRow; row < endRow; row++) {
            const isCursor = row === state.currentRow;
            const isPlayPos = state.playing && row === state.playingRow;
            
            // Row highlight
            if (isPlayPos) {
                // Green highlight for playing position
                this.ui.rect(x + 38, rowY - 1, width - 42, rowHeight, '#1A3A1A');
            } else if (isCursor && state.editMode) {
                // Cursor highlight
                this.ui.rect(x + 38, rowY - 1, width - 42, rowHeight, 'cursorBg');
            }
            
            // Row number
            const rowNumColor = isPlayPos ? 'green' : (isCursor ? 'yellow' : 'textDim');
            this.ui.text(row.toString().padStart(2, '0'), x + 8, rowY, rowNumColor);
            
            // Draw notes for each channel
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                const chX = x + 40 + ch * channelWidth;
                
                const isCursorChannel = isCursor && ch === state.currentChannel;
                
                // Note
                if (note.note > 0) {
                    const noteName = this.getNoteString(note.note);
                    this.ui.text(noteName, chX + 4, rowY, isCursorChannel ? 'textBright' : 'text');
                } else {
                    this.ui.text('---', chX + 4, rowY, 'textDim');
                }
                
                // Instrument
                this.ui.hex(note.instrument, chX + 28, rowY, 1, isCursorChannel ? 'orange' : 'textDim');
                
                // Effect
                if (note.effect > 0 || note.param > 0) {
                    this.ui.hex(note.effect, chX + 40, rowY, 1, 'cyan');
                    this.ui.hex(note.param, chX + 48, rowY, 2, 'cyan');
                } else {
                    this.ui.text('...', chX + 40, rowY, 'textDim');
                }
            }
            
            rowY += rowHeight;
        }
        
        // Draw column cursor indicator
        if (state.editMode) {
            const chX = x + 40 + state.currentChannel * channelWidth;
            const cursorY = y + headerHeight + (state.currentRow - startRow) * rowHeight - 1;
            
            let cursorX = chX + 4;
            let cursorWidth = 20;
            
            if (state.cursorColumn === 1) {
                // Instrument column
                cursorX = chX + 28;
                cursorWidth = 10;
            } else if (state.cursorColumn === 2) {
                // Effect column - show which of the 3 digits
                cursorX = chX + 40;
                
                if (state.effectInputPos === 0) {
                    // Effect type (first digit)
                    cursorWidth = 10;
                } else if (state.effectInputPos === 1) {
                    // Param high nibble (second digit)
                    cursorX = chX + 48;
                    cursorWidth = 10;
                } else if (state.effectInputPos === 2) {
                    // Param low nibble (third digit)
                    cursorX = chX + 56;
                    cursorWidth = 10;
                }
            }
            
            // Draw cursor underline
            this.ui.line(cursorX, cursorY + rowHeight - 2, cursorX + cursorWidth, cursorY + rowHeight - 2, 'yellow', 2);
        }
    }
    
    /**
     * Draw instrument list
     */
    drawInstrumentList(x, y, width, height, state) {
        this.ui.panel(x, y, width, height, 'INSTRUMENTS');
        
        const listY = y + 24;
        const rowHeight = 14;
        
        // Draw 8 instruments
        for (let i = 0; i < 8; i++) {
            const inst = state.song.instruments[i];
            const instY = listY + i * rowHeight;
            const isCurrent = i === state.currentInstrument;
            
            // Highlight current instrument
            if (isCurrent) {
                this.ui.rect(x + 4, instY - 1, width - 8, rowHeight, 'cursorBg');
            }
            
            // Instrument number
            this.ui.hex(i, x + 8, instY, 1, isCurrent ? 'yellow' : 'textDim');
            
            // Instrument name
            const nameColor = isCurrent ? 'textBright' : 'text';
            this.ui.text(inst.name.substring(0, 14), x + 22, instY, nameColor);
        }
        
        // Draw instrument parameters (for current instrument)
        const inst = state.song.instruments[state.currentInstrument];
        const paramsY = listY + 8 * rowHeight + 12;
        
        this.ui.text('-- Params --', x + 8, paramsY, 'cyan');
        
        let py = paramsY + 14;
        this.ui.text('Atk:', x + 8, py, 'textDim');
        this.ui.text((inst.attack * 1000).toFixed(0) + 'ms', x + 100, py, 'text');
        
        py += 14;
        this.ui.text('Dec:', x + 8, py, 'textDim');
        this.ui.text((inst.decay * 1000).toFixed(0) + 'ms', x + 100, py, 'text');
        
        py += 14;
        this.ui.text('Sus:', x + 8, py, 'textDim');
        this.ui.text((inst.sustain * 100).toFixed(0) + '%', x + 100, py, 'text');
        
        py += 14;
        this.ui.text('Rel:', x + 8, py, 'textDim');
        this.ui.text((inst.release * 1000).toFixed(0) + 'ms', x + 100, py, 'text');
        
        // Wave-specific parameters
        if (state.currentChannel === 0) {
            py += 14;
            this.ui.text('Duty:', x + 8, py, 'textDim');
            this.ui.text((inst.dutyCycle * 100).toFixed(0) + '%', x + 100, py, 'text');
        }
        
        // Help text
        const helpY = this.ui.height - 120;
        this.ui.text('-- Keys --', x + 8, helpY, 'cyan');
        this.ui.text('F1: Help', x + 8, helpY + 14, 'green');
        this.ui.text('Spc: Play', x + 8, helpY + 28, 'textDim');
        this.ui.text('L: Loop', x + 8, helpY + 42, 'textDim');
        this.ui.text('F: Follow', x + 8, helpY + 56, 'textDim');
        
        const helpY2 = helpY + 70;
        this.ui.text('Shft+A/D/', x + 8, helpY2, 'textDim');
        this.ui.text('S/R: ADSR', x + 8, helpY2 + 14, 'textDim');
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
