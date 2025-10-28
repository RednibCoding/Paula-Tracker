/**
 * Rendering module for Paula Tracker
 * Handles all UI drawing operations
 */

export class Renderer {
    constructor(tracker) {
        this.tracker = tracker;
        this.ui = tracker.ui;
        this.song = tracker.song;
    }
    
    /**
     * Draw title bar
     */
    drawTitle() {
        this.ui.panel(0, 0, 640, 30);
        this.ui.text('*** PAULA TRACKER ***', 240, 8, 'yellow');
    }
    
    /**
     * Draw control buttons
     */
    drawControls() {
        const y = 35;
        
        if (this.ui.button(10, y, 60, 20, 'PLAY')) {
            this.tracker.audio.play(this.tracker.song, 0);
        }
        if (this.ui.button(75, y, 60, 20, 'STOP')) {
            this.tracker.audio.stop();
        }
        if (this.ui.button(140, y, 60, 20, 'LOAD')) {
            this.tracker.fileInput.click();
        }
        
        // Pattern info
        this.ui.text(`PATTERN: `, 220, y + 3, 'text');
        this.ui.hex(this.tracker.currentPattern, 300, y + 3, 2, 'yellow');
        
        this.ui.text(`POS: `, 340, y + 3, 'text');
        this.ui.hex(this.tracker.audio.getState().position, 385, y + 3, 2, 'yellow');
        
        this.ui.text(`TEMPO: `, 425, y + 3, 'text');
        this.ui.hex(this.tracker.song.tempo, 495, y + 3, 2, 'yellow');
        
        this.ui.text(`BPM: `, 535, y + 3, 'text');
        this.ui.hex(this.tracker.song.bpm, 580, y + 3, 3, 'yellow');
    }
    
    /**
     * Draw pattern editor grid
     */
    drawPatternEditor() {
        const x = 10;
        const y = this.tracker.patternViewY;
        const width = this.tracker.patternViewWidth;
        const height = 280;
        
        // Background panel
        this.ui.rect(x, y, width, height, 'patternBg');
        this.ui.border(x, y, width, height, 'border', 2);
        
        // Column headers
        const colX = x + 40;
        const headerY = y + 5;
        const channelWidth = 95; // Wider channels with more space
        
        // Get mute state
        const playState = this.tracker.audio.getState();
        
        for (let ch = 0; ch < 4; ch++) {
            const cx = colX + ch * channelWidth;
            const isMuted = playState.mutedChannels[ch];
            const headerColor = isMuted ? 'red' : 'orange';
            const headerText = `-- CH ${ch + 1} --`;
            this.ui.text(headerText, cx, headerY, headerColor);
            
            // VU meter below channel header
            this.drawVUMeter(cx + 10, headerY + 14, playState.vuLevels[ch], isMuted);
        }
        
        // Pattern data
        const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
        const startRow = this.tracker.scrollOffset;
        const endRow = Math.min(64, startRow + this.tracker.visibleRows);
        const rowHeight = 14;
        const dataY = y + 25;
        
        for (let row = startRow; row < endRow; row++) {
            const ry = dataY + (row - startRow) * rowHeight;
            
            // Get playback state
            const playState = this.tracker.audio.getState();
            const isPlayingRow = playState.playing && row === playState.row && 
                                 this.tracker.currentPattern === this.tracker.song.patternOrder[playState.position];
            
            // Highlight playing row
            if (isPlayingRow) {
                this.ui.rect(x + 5, ry - 1, width - 10, rowHeight, 'button');
            }
            
            // Row number
            this.ui.hex(row, x + 10, ry, 2, 
                row === this.tracker.currentRow ? 'yellow' : (isPlayingRow ? 'textBright' : 'textDim'));
            
            // Draw each channel
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                const cx = colX + ch * channelWidth;
                const isCursor = (row === this.tracker.currentRow && ch === this.tracker.currentChannel);
                const isMuted = playState.mutedChannels[ch];
                
                // Cursor background (takes priority over playing row)
                if (isCursor) {
                    this.ui.rect(cx - 2, ry - 1, channelWidth - 4, rowHeight, 'cursorBg');
                }
                
                // Note - dim if channel is muted
                const noteName = note.period > 0 ? 
                    this.tracker.audio.periodToNoteName(note.period) : '---';
                let noteColor = isCursor && this.tracker.currentColumn === 0 ? 'textBright' : 
                    (note.period > 0 ? 'cyan' : 'textDim');
                if (isMuted && noteColor !== 'textBright') noteColor = 'textDim';
                this.ui.text(noteName, cx, ry, noteColor);
                
                // Instrument - show hex if value > 0 OR if cursor is on this field
                const showInst = note.instrument > 0 || (isCursor && this.tracker.currentColumn === 1);
                const instText = showInst ? 
                    note.instrument.toString(16).toUpperCase().padStart(2, '0') : '..';
                let instColor = isCursor && this.tracker.currentColumn === 1 ? 'textBright' : 
                    (note.instrument > 0 ? 'green' : 'textDim');
                if (isMuted && instColor !== 'textBright') instColor = 'textDim';
                this.ui.text(instText, cx + 28, ry, instColor);
                
                // Effect - show hex if value > 0 OR if cursor is on this field
                const showEff = note.effect > 0 || (isCursor && this.tracker.currentColumn === 2);
                const effText = showEff ? 
                    note.effect.toString(16).toUpperCase() : '.';
                let effColor = isCursor && this.tracker.currentColumn === 2 ? 'textBright' : 
                    (note.effect > 0 ? 'yellow' : 'textDim');
                if (isMuted && effColor !== 'textBright') effColor = 'textDim';
                this.ui.text(effText, cx + 50, ry, effColor);
                
                // Parameter - show hex if value > 0 OR if cursor is on this field
                const showParam = note.param > 0 || (isCursor && this.tracker.currentColumn === 3);
                const paramText = showParam ? 
                    note.param.toString(16).toUpperCase().padStart(2, '0') : '..';
                let paramColor = isCursor && this.tracker.currentColumn === 3 ? 'textBright' : 
                    (note.param > 0 ? 'yellow' : 'textDim');
                if (isMuted && paramColor !== 'textBright') paramColor = 'textDim';
                this.ui.text(paramText, cx + 62, ry, paramColor);
            }
        }
    }
    
    /**
     * Draw song sequencer (pattern order list)
     */
    drawSongSequencer() {
        const x = this.tracker.rightPanelX;
        const y = this.tracker.patternViewY;
        const width = this.tracker.rightPanelWidth;
        const height = this.tracker.sequencerHeight;
        
        this.ui.rect(x, y, width, height, 'panelBg');
        this.ui.border(x, y, width, height, 'border', 2);
        
        this.ui.text('SONG SEQUENCER', x + 8, y + 5, 'orange');
        
        // Column headers with song length
        this.ui.text('POS PAT', x + 10, y + 20, 'textDim');
        this.ui.text('LEN:', x + 80, y + 20, 'textDim');
        this.ui.hex(this.tracker.song.songLength, x + 115, y + 20, 2, 'yellow');
        
        // Show 8 positions at a time with scroll offset
        const visiblePositions = 8;
        const scrollOffset = this.tracker.sequencerScrollOffset;
        const endPos = Math.min(this.tracker.song.songLength, scrollOffset + visiblePositions);
        
        for (let pos = scrollOffset; pos < endPos; pos++) {
            const iy = y + 35 + (pos - scrollOffset) * 12;
            const pattern = this.tracker.song.patternOrder[pos];
            const isCurrent = (pos === this.tracker.currentSeqPos);
            
            // Get playback state
            const playState = this.tracker.audio.getState();
            const isPlaying = playState.playing && pos === playState.position;
            
            // Highlight current position
            if (isCurrent) {
                this.ui.rect(x + 5, iy - 1, width - 10, 12, 'cursorBg');
            }
            
            // Position number
            this.ui.hex(pos, x + 10, iy, 2, 
                isCurrent ? 'textBright' : (isPlaying ? 'cyan' : 'text'));
            
            // Pattern number
            this.ui.hex(pattern, x + 40, iy, 2, 
                isCurrent ? 'yellow' : (isPlaying ? 'cyan' : 'text'));
            
            // Playing indicator
            if (isPlaying) {
                this.ui.text('>', x + 70, iy, 'green');
            }
        }
    }
    
    /**
     * Draw instrument list
     */
    drawInstrumentList() {
        const x = this.tracker.rightPanelX;
        const y = this.tracker.patternViewY + this.tracker.sequencerHeight;
        const width = this.tracker.rightPanelWidth;
        const height = this.tracker.instrumentListHeight;
        
        this.ui.rect(x, y, width, height, 'panelBg');
        this.ui.border(x, y, width, height, 'border', 2);
        
        // Count loaded instruments (non-empty)
        let loadedCount = 0;
        for (let i = 1; i <= 31; i++) {
            if (!this.tracker.song.instruments[i].isEmpty()) {
                loadedCount++;
            }
        }
        
        this.ui.text('INSTRUMENTS', x + 8, y + 5, 'orange');
        this.ui.text('x', x + 103, y + 5, 'textDim');
        this.ui.hex(loadedCount, x + 111, y + 5, 2, 'textDim');
        
        const visibleInstruments = 8;
        const totalInstruments = 31;
        
        // List instruments with scrolling (31 total, show 8 at a time)
        for (let i = 0; i < visibleInstruments; i++) {
            const instrNum = i + 1 + this.tracker.instrumentScrollOffset;
            if (instrNum > totalInstruments) break;
            
            const iy = y + 25 + i * 14;
            const instr = this.tracker.song.instruments[instrNum];
            const selected = (instrNum === this.tracker.noteEntry.getInstrument());
            
            if (selected) {
                this.ui.rect(x + 2, iy - 1, width - 4, 14, 'cursorBg');
            }
            
            this.ui.hex(instrNum, x + 5, iy, 2, selected ? 'textBright' : 'text');
            
            const name = instr.name.substring(0, 14);
            this.ui.text(name, x + 30, iy, selected ? 'textBright' : 'textDim');
            
            // Show sample length indicator
            if (!instr.isEmpty()) {
                const lenK = Math.floor(instr.length / 500);
                if (lenK > 0) {
                    this.ui.text(`${lenK}k`, x + width - 25, iy, 'textDim');
                }
            }
        }
    }
    
    /**
     * Draw status bar
     */
    drawStatus() {
        const y = 350;
        
        // Song title
        const title = this.tracker.song.title || 'Paula Tracker v1.0';
        this.ui.text(title.substring(0, 20), 10, y, 'textDim');
        
        const state = this.tracker.audio.getState();
        const status = state.playing ? 'PLAYING' : 'STOPPED';
        const statusColor = state.playing ? 'green' : 'red';
        this.ui.text(status, 200, y, statusColor);
        
        // Pattern loop indicator
        if (state.patternLoop) {
            this.ui.text('[LOOP]', 280, y, 'yellow');
        }
        
        this.ui.text(`Row: ${this.tracker.currentRow.toString().padStart(2, '0')}`, 350, y, 'text');
        this.ui.text(`Ch: ${this.tracker.currentChannel + 1}`, 430, y, 'text');
        
        if (state.playing) {
            this.ui.text(`PlayRow: ${state.row.toString().padStart(2, '0')}`, 500, y, 'cyan');
        }
        
        // Current instrument and octave
        const y2 = y + 15;
        this.ui.text(`Inst: `, 10, y2, 'textDim');
        this.ui.hex(this.tracker.noteEntry.getInstrument(), 60, y2, 2, 'yellow');
        
        this.ui.text(`Octave: ${this.tracker.noteEntry.getOctave()}`, 120, y2, 'textDim');
        
        // Clipboard status
        if (this.tracker.clipboard.hasData()) {
            const clipType = this.tracker.clipboard.getType();
            const clipText = clipType === 'row' ? 'Row' : clipType === 'pattern' ? 'Pattern' : 'Cell';
            this.ui.text(`Clip: ${clipText}`, 380, y2, 'cyan');
        }
        
        // Help text
        const y3 = y + 30;
    }
    
    /**
     * Draw help overlay
     */
    drawHelp() {
        // Semi-transparent background
        this.ui.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ui.ctx.fillRect(0, 0, 640, 400);
        
        // Border - shifted left
        this.ui.border(15, 20, 610, 360, 'yellow', 2);
        
        // Title - shifted left
        this.ui.text('PAULA TRACKER - KEYBOARD SHORTCUTS', 175, 35, 'yellow');
        
        let y = 60;
        const col1 = 35;   // Shifted left
        const col2 = 345;  // Shifted left
        
        // Navigation section
        this.ui.text('=== NAVIGATION ===', col1, y, 'orange');
        y += 20;
        this.ui.text('Arrows       Navigate rows/columns', col1, y, 'text');
        y += 13;
        this.ui.text('Ctrl+Arrows  Page up/down, channels', col1, y, 'text');
        y += 13;
        this.ui.text('Shift+Arrows Change instrument', col1, y, 'text');
        y += 13;
        this.ui.text('Alt+Arrows   Navigate song positions', col1, y, 'text');
        y += 13;
        this.ui.text('Home/End     Jump to start/end', col1, y, 'text');
        y += 13;
        this.ui.text('Tab          Next column', col1, y, 'text');
        
        y += 20;
        this.ui.text('=== PLAYBACK ===', col1, y, 'orange');
        y += 20;
        this.ui.text('Space        Play/Stop', col1, y, 'text');
        y += 13;
        this.ui.text('L            Toggle pattern loop', col1, y, 'text');
        y += 13;
        this.ui.text('F5-F8        Mute channels 1-4', col1, y, 'text');
        y += 13;
        this.ui.text('F9           Preview instrument', col1, y, 'text');
        
        // Right column
        y = 60;
        this.ui.text('=== EDITING ===', col2, y, 'orange');
        y += 20;
        this.ui.text('Z-M, Q-P     Enter notes', col2, y, 'text');
        y += 13;
        this.ui.text('0-9, A-F     Enter hex values', col2, y, 'text');
        y += 13;
        this.ui.text('Delete       Clear cell', col2, y, 'text');
        y += 13;
        this.ui.text('Insert       Insert blank row', col2, y, 'text');
        y += 13;
        this.ui.text('Shift+Delete Delete row', col2, y, 'text');
        y += 13;
        this.ui.text('Ctrl+D       Duplicate pattern', col2, y, 'text');
        
        y += 20;
        this.ui.text('=== CLIPBOARD ===', col2, y, 'orange');
        y += 20;
        this.ui.text('Ctrl+C       Copy row', col2, y, 'text');
        y += 13;
        this.ui.text('Ctrl+Shift+C Copy pattern', col2, y, 'text');
        y += 13;
        this.ui.text('Ctrl+V       Paste', col2, y, 'text');
        y += 13;
        this.ui.text('Ctrl+X       Cut row', col2, y, 'text');
        y += 13;
        this.ui.text('Ctrl+Delete  Clear pattern', col2, y, 'text');
        
        y += 20;
        this.ui.text('=== FILES ===', col2, y, 'orange');
        y += 20;
        this.ui.text('Ctrl+L       Load MOD file', col2, y, 'text');
        y += 13;
        this.ui.text('Ctrl+S       Save MOD file', col2, y, 'text');
        y += 13;
        this.ui.text('Ctrl+E       Edit song title', col2, y, 'text');
        y += 13;
        this.ui.text('Shift+Insert Load WAV sample', col2, y, 'text');
        y += 13;
        this.ui.text('Shift+Home   Save WAV sample', col2, y, 'text');

        // Bottom
        y = 350;
        // this.ui.text('Press F1 to show/hide this help', 200, y, 'cyan');
    }
    
    /**
     * Draw VU meter for a channel
     * @param {number} x - X position
     * @param {number} y - Y position  
     * @param {number} level - Volume level (0-64)
     * @param {boolean} muted - Whether channel is muted
     */
    drawVUMeter(x, y, level, muted) {
        const width = 60;
        const height = 4;
        const segments = 12;
        const segmentWidth = width / segments;
        
        // Don't show any level if muted
        if (muted) {
            // Just draw border
            this.ui.ctx.strokeStyle = this.ui.colors.border;
            this.ui.ctx.lineWidth = 1;
            this.ui.ctx.strokeRect(x, y, width, height);
            return;
        }
        
        // Calculate filled segments (0-12 based on level 0-64)
        const filledSegments = Math.floor((level / 64) * segments);
        
        // Draw segments
        for (let i = 0; i < segments; i++) {
            if (i < filledSegments) {
                // Color gradient: green -> yellow -> red
                let color;
                if (i < 8) {
                    color = this.ui.colors.green;
                } else if (i < 10) {
                    color = this.ui.colors.yellow;
                } else {
                    color = this.ui.colors.red;
                }
                
                this.ui.ctx.fillStyle = color;
                this.ui.ctx.fillRect(x + i * segmentWidth + 1, y + 1, segmentWidth - 2, height - 2);
            }
        }
        
        // Border
        this.ui.ctx.strokeStyle = this.ui.colors.border;
        this.ui.ctx.lineWidth = 1;
        this.ui.ctx.strokeRect(x, y, width, height);
    }
}
