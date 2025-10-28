/**
 * PaulaTracker - Main Application
 * Old-school 4-channel tracker in the style of Ultimate Sound Tracker
 */

import { UI } from './ui.js';
import { Song, Note } from './data.js';
import { AudioEngine, PERIOD_TABLE, NOTE_NAMES } from './audio.js';
import { ModLoader } from './modloader.js';
import { NoteEntry } from './noteentry.js';
import { Clipboard } from './clipboard.js';
import { SampleLoader } from './sampleloader.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './inputhandler.js';
import { InstrumentManager } from './instrumentmanager.js';

class PaulaTracker {
    constructor(canvas) {
        this.ui = new UI(canvas);
        this.song = new Song();
        this.audio = new AudioEngine();
        this.noteEntry = new NoteEntry(this.audio);
        this.clipboard = new Clipboard();
        this.sampleLoader = new SampleLoader();
        this.keyboard = { getHexDigit: (key) => {
            const hex = '0123456789ABCDEF';
            const upper = key.toUpperCase();
            const index = hex.indexOf(upper);
            return index >= 0 ? index : null;
        }};
        
        // Create subsystems
        this.renderer = new Renderer(this);
        this.inputHandler = new InputHandler(this);
        this.instrumentManager = new InstrumentManager(this);
        
        // Editor state
        this.currentPattern = 0;
        this.currentRow = 0;
        this.currentChannel = 0;
        this.currentColumn = 0; // 0=note, 1=inst, 2=effect, 3=param
        this.scrollOffset = 0;
        this.currentSeqPos = 0; // Current position in song sequence
        this.sequencerScrollOffset = 0; // Scroll offset for song sequencer
        this.instrumentScrollOffset = 0; // Scroll offset for instrument list
        
        // UI layout - ProTracker style with right panel
        this.patternViewY = 60;
        this.patternViewWidth = 450;  // More room for pattern editor
        this.visibleRows = 18;
        
        // Right panel layout
        this.rightPanelX = 460;
        this.rightPanelWidth = 170;
        this.sequencerHeight = 140;
        this.instrumentListHeight = 140;
        
        // Initialize
        this.setupKeyboard();
        this.setupFileInput();
        this.generateTestInstrument();
        this.generateTestPattern();
        
        // Start render loop
        this.render();
    }
    
    /**
     * Setup file input for loading MOD files
     */
    setupFileInput() {
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.mod,.MOD';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    this.song = await ModLoader.loadFromFile(file);
                    this.currentPattern = 0;
                    this.currentRow = 0;
                    this.scrollOffset = 0;
                    this.audio.stop();
                } catch (err) {
                    console.error('Error loading MOD:', err);
                    alert('Error loading MOD file: ' + err.message);
                }
            }
        });
        
        this.fileInput = fileInput;
    }
    
    /**
     * Generate a simple test instrument
     */
    generateTestInstrument() {
        const instr = this.song.instruments[1];
        instr.name = 'Test Saw';
        instr.volume = 64;
        instr.finetune = 0;
        
        // Generate a simple sawtooth wave
        const length = 8000;
        instr.length = length;
        instr.sampleData = new Float32Array(length);
        
        for (let i = 0; i < length; i++) {
            instr.sampleData[i] = ((i % 100) / 50 - 1) * 0.3;
        }
        
        // Set loop
        instr.repeatStart = 0;
        instr.repeatLength = 100;
    }
    
    /**
     * Generate a test pattern
     */
    generateTestPattern() {
        const pattern = this.song.patterns[0];
        
        // Add some test notes
        const testNotes = [
            { row: 0, ch: 0, period: 856, inst: 1 },   // C-1
            { row: 4, ch: 0, period: 762, inst: 1 },   // D-1
            { row: 8, ch: 0, period: 678, inst: 1 },   // E-1
            { row: 12, ch: 0, period: 640, inst: 1 },  // F-1
            { row: 16, ch: 1, period: 508, inst: 1 },  // A-1
            { row: 20, ch: 1, period: 453, inst: 1 },  // B-1
            { row: 24, ch: 2, period: 428, inst: 1 },  // C-2
        ];
        
        testNotes.forEach(({ row, ch, period, inst }) => {
            const note = pattern.getNote(row, ch);
            note.period = period;
            note.instrument = inst;
        });
    }
    
    /**
     * Setup keyboard input
     */
    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.inputHandler.handleKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    /**
     * Handle key press
     */
    handleKeyDown(e) {
        // Octave controls
        if (e.key === '<' || e.key === ',') {
            this.noteEntry.changeOctave(-1);
            e.preventDefault();
            return;
        } else if (e.key === '>' || e.key === '.') {
            this.noteEntry.changeOctave(1);
            e.preventDefault();
            return;
        }
        
        // Instrument controls
        else if (e.key === 'F1') {
            this.noteEntry.changeInstrument(-1);
            this.updateInstrumentScroll();
            e.preventDefault();
            return;
        } else if (e.key === 'F2') {
            this.noteEntry.changeInstrument(1);
            this.updateInstrumentScroll();
            e.preventDefault();
            return;
        } else if (e.key === 'F9') {
            // Preview selected instrument
            this.previewInstrument();
            e.preventDefault();
            return;
        } else if (e.key === 'F11') {
            // Export/save selected instrument as WAV
            this.exportInstrument(this.noteEntry.getInstrument());
            e.preventDefault();
            return;
        } else if (e.key === 'F12') {
            // Load WAV sample for selected instrument
            this.loadSampleForInstrument(this.noteEntry.getInstrument());
            e.preventDefault();
            return;
        }
        
        // Clipboard operations
        else if (e.ctrlKey && e.key === 'c') {
            // Ctrl+C: Copy row
            const pattern = this.song.patterns[this.currentPattern];
            this.clipboard.copyRow(pattern, this.currentRow);
            e.preventDefault();
            return;
        } else if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            // Ctrl+Shift+C: Copy entire pattern
            const pattern = this.song.patterns[this.currentPattern];
            this.clipboard.copyPattern(pattern);
            e.preventDefault();
            return;
        } else if (e.ctrlKey && e.key === 'v') {
            // Ctrl+V: Paste
            const pattern = this.song.patterns[this.currentPattern];
            this.clipboard.paste(pattern, this.currentRow, this.currentChannel);
            e.preventDefault();
            return;
        } else if (e.ctrlKey && e.key === 'x') {
            // Ctrl+X: Cut row
            const pattern = this.song.patterns[this.currentPattern];
            this.clipboard.copyRow(pattern, this.currentRow);
            this.clipboard.clearRow(pattern, this.currentRow);
            e.preventDefault();
            return;
        }
        
        // Pattern editing operations
        else if (e.key === 'Insert') {
            // Insert blank row
            const pattern = this.song.patterns[this.currentPattern];
            this.clipboard.insertRow(pattern, this.currentRow);
            e.preventDefault();
            return;
        } else if (e.shiftKey && e.key === 'Delete') {
            // Shift+Delete: Delete row (shift up)
            const pattern = this.song.patterns[this.currentPattern];
            this.clipboard.deleteRow(pattern, this.currentRow);
            e.preventDefault();
            return;
        } else if (e.ctrlKey && e.key === 'Delete') {
            // Ctrl+Delete: Clear entire pattern
            if (confirm('Clear entire pattern?')) {
                const pattern = this.song.patterns[this.currentPattern];
                this.clipboard.clearPattern(pattern);
            }
            e.preventDefault();
            return;
        }
        
        // Song sequencer controls
        else if (e.key === '+' || e.key === '=') {
            // Next position in song
            this.currentSeqPos = Math.min(this.song.songLength - 1, this.currentSeqPos + 1);
            this.currentPattern = this.song.patternOrder[this.currentSeqPos];
            this.updateSequencerScroll();
            e.preventDefault();
            return;
        } else if (e.key === '-' || e.key === '_') {
            // Previous position in song
            this.currentSeqPos = Math.max(0, this.currentSeqPos - 1);
            this.currentPattern = this.song.patternOrder[this.currentSeqPos];
            this.updateSequencerScroll();
            e.preventDefault();
            return;
        }
        
        // Pattern selection in sequencer (F3/F4)
        else if (e.key === 'F3') {
            // Change pattern number at current position (decrease)
            const currentPattern = this.song.patternOrder[this.currentSeqPos];
            this.song.patternOrder[this.currentSeqPos] = Math.max(0, currentPattern - 1);
            this.currentPattern = this.song.patternOrder[this.currentSeqPos];
            e.preventDefault();
            return;
        } else if (e.key === 'F4') {
            // Change pattern number at current position (increase)
            const currentPattern = this.song.patternOrder[this.currentSeqPos];
            this.song.patternOrder[this.currentSeqPos] = Math.min(63, currentPattern + 1);
            this.currentPattern = this.song.patternOrder[this.currentSeqPos];
            e.preventDefault();
            return;
        }
        
        // Navigation
        if (e.key === 'ArrowUp') {
            this.currentRow = Math.max(0, this.currentRow - 1);
            this.updateScroll();
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            this.currentRow = Math.min(63, this.currentRow + 1);
            this.updateScroll();
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            this.currentColumn--;
            if (this.currentColumn < 0) {
                this.currentChannel = Math.max(0, this.currentChannel - 1);
                this.currentColumn = 3;
            }
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            this.currentColumn++;
            if (this.currentColumn > 3) {
                this.currentChannel = Math.min(3, this.currentChannel + 1);
                this.currentColumn = 0;
            }
            e.preventDefault();
        }
        
        // Playback
        else if (e.key === ' ') {
            this.audio.togglePlay(this.song);
            e.preventDefault();
        }
        
        // Page up/down
        else if (e.key === 'PageUp') {
            this.currentRow = Math.max(0, this.currentRow - 16);
            this.updateScroll();
            e.preventDefault();
        } else if (e.key === 'PageDown') {
            this.currentRow = Math.min(63, this.currentRow + 16);
            this.updateScroll();
            e.preventDefault();
        }
        
        // Home/End
        else if (e.key === 'Home') {
            this.currentRow = 0;
            this.updateScroll();
            e.preventDefault();
        } else if (e.key === 'End') {
            this.currentRow = 63;
            this.updateScroll();
            e.preventDefault();
        }
        
        // Delete note
        else if (e.key === 'Delete') {
            const pattern = this.song.patterns[this.currentPattern];
            const note = pattern.getNote(this.currentRow, this.currentChannel);
            
            // Clear based on current column
            if (this.currentColumn === 0) {
                note.period = 0;
            } else if (this.currentColumn === 1) {
                note.instrument = 0;
            } else if (this.currentColumn === 2) {
                note.effect = 0;
            } else if (this.currentColumn === 3) {
                note.param = 0;
            }
            e.preventDefault();
        }
        
        // Backspace - clear and go to previous row
        else if (e.key === 'Backspace') {
            if (this.currentRow > 0) {
                this.currentRow--;
                this.updateScroll();
            }
            e.preventDefault();
        }
        
        // Note input
        else if (this.currentColumn === 0) {
            const noteData = this.noteEntry.createNoteFromKey(e.code);
            if (noteData) {
                const pattern = this.song.patterns[this.currentPattern];
                const note = pattern.getNote(this.currentRow, this.currentChannel);
                note.period = noteData.period;
                note.instrument = noteData.instrument;
                
                // Advance to next row
                this.currentRow = Math.min(63, this.currentRow + 1);
                this.updateScroll();
                
                e.preventDefault();
            }
        }
        
        // Instrument number input (decimal, 01-31)
        else if (this.currentColumn === 1) {
            const pattern = this.song.patterns[this.currentPattern];
            const note = pattern.getNote(this.currentRow, this.currentChannel);
            
            // Enter first digit (tens place)
            const digit = this.noteEntry.enterInstrumentDigit(note.instrument, e.key, false);
            if (digit !== note.instrument) {
                note.instrument = digit;
                // Don't advance yet, wait for second digit
                e.preventDefault();
            } else if (e.key >= '0' && e.key <= '9') {
                // Second digit (ones place)
                note.instrument = this.noteEntry.enterInstrumentDigit(note.instrument, e.key, true);
                this.currentColumn++;
                e.preventDefault();
            }
        }
        
        // Effect input (single hex digit)
        else if (this.currentColumn === 2) {
            const pattern = this.song.patterns[this.currentPattern];
            const note = pattern.getNote(this.currentRow, this.currentChannel);
            const digit = this.noteEntry.keyboard.getHexDigit(e.key);
            
            if (digit !== null) {
                note.effect = digit;
                this.currentColumn++;
                e.preventDefault();
            }
        }
        
        // Parameter input (two hex digits)
        else if (this.currentColumn === 3) {
            const pattern = this.song.patterns[this.currentPattern];
            const note = pattern.getNote(this.currentRow, this.currentChannel);
            
            const newParam = this.noteEntry.enterHexDigit(note.param, e.key, false);
            if (newParam !== note.param) {
                note.param = newParam;
                
                // Advance to next row after entering param
                this.currentColumn = 0;
                this.currentRow = Math.min(63, this.currentRow + 1);
                this.updateScroll();
                
                e.preventDefault();
            }
        }
    }
    
    /**
     * Update scroll offset
     */
    updateScroll() {
        const halfVisible = Math.floor(this.visibleRows / 2);
        this.scrollOffset = Math.max(0, Math.min(64 - this.visibleRows, 
            this.currentRow - halfVisible));
    }
    
    /**
     * Update sequencer scroll to keep current position visible
     */
    updateSequencerScroll() {
        const visiblePositions = 8;
        const halfVisible = Math.floor(visiblePositions / 2);
        
        // Keep current position centered when scrolling
        if (this.currentSeqPos >= halfVisible) {
            this.sequencerScrollOffset = Math.max(0, 
                Math.min(this.song.songLength - visiblePositions, 
                    this.currentSeqPos - halfVisible));
        } else {
            this.sequencerScrollOffset = 0;
        }
    }
    
    /**
     * Auto-scroll instrument list to keep selected instrument visible
     */
    updateInstrumentScroll() {
        const currentInstr = this.noteEntry.getInstrument();
        const visibleInstruments = 8;
        
        // Scroll down if instrument is below visible area
        if (currentInstr > this.instrumentScrollOffset + visibleInstruments) {
            this.instrumentScrollOffset = currentInstr - visibleInstruments;
        }
        // Scroll up if instrument is above visible area
        else if (currentInstr < this.instrumentScrollOffset + 1) {
            this.instrumentScrollOffset = Math.max(0, currentInstr - 1);
        }
    }
    
    /**
     * Main render loop
     */
    render() {
        // Auto-follow playback: switch to the pattern being played
        const playState = this.audio.getState();
        if (playState.playing) {
            const playingPattern = this.song.patternOrder[playState.position];
            this.currentPattern = playingPattern;
            this.currentSeqPos = playState.position;
            
            // Center the playing row (start scrolling after row 9)
            const centerRow = Math.floor(this.visibleRows / 2);
            if (playState.row > centerRow) {
                this.scrollOffset = Math.max(0, Math.min(64 - this.visibleRows, 
                    playState.row - centerRow));
            } else {
                this.scrollOffset = 0;
            }
            
            // Auto-scroll sequencer to keep playing position visible
            this.updateSequencerScroll();
        }
        
        this.ui.clear();
        this.drawTitle();
        this.drawControls();
        this.drawPatternEditor();
        this.drawSongSequencer();
        this.drawInstrumentList();
        this.drawStatus();
        
        this.ui.update();
        requestAnimationFrame(() => this.render());
    }
    
    /**
     * Draw title bar
     */
    drawTitle() {
        this.ui.panel(0, 0, 640, 30);
        this.ui.text('*** THE ULTIMATE SOUND TRACKER ***', 160, 8, 'yellow');
    }
    
    /**
     * Draw control buttons
     */
    drawControls() {
        const y = 35;
        
        if (this.ui.button(10, y, 60, 20, 'PLAY')) {
            this.audio.play(this.song, 0);
        }
        if (this.ui.button(75, y, 60, 20, 'STOP')) {
            this.audio.stop();
        }
        if (this.ui.button(140, y, 60, 20, 'LOAD')) {
            this.fileInput.click();
        }
        
        // Pattern info
        this.ui.text(`PATTERN: `, 220, y + 3, 'text');
        this.ui.hex(this.currentPattern, 300, y + 3, 2, 'yellow');
        
        this.ui.text(`POS: `, 340, y + 3, 'text');
        this.ui.hex(this.audio.getState().position, 385, y + 3, 2, 'yellow');
        
        this.ui.text(`TEMPO: `, 425, y + 3, 'text');
        this.ui.hex(this.song.tempo, 495, y + 3, 2, 'yellow');
        
        this.ui.text(`BPM: `, 535, y + 3, 'text');
        this.ui.hex(this.song.bpm, 580, y + 3, 3, 'yellow');
    }
    
    /**
     * Draw pattern editor grid
     */
    drawPatternEditor() {
        const x = 10;
        const y = this.patternViewY;
        const width = this.patternViewWidth;
        const height = 280;
        
        // Background panel
        this.ui.rect(x, y, width, height, 'patternBg');
        this.ui.border(x, y, width, height, 'border', 2);
        
        // Column headers
        const colX = x + 40;
        const headerY = y + 5;
        const channelWidth = 95; // Wider channels with more space
        
        for (let ch = 0; ch < 4; ch++) {
            const cx = colX + ch * channelWidth;
            this.ui.text(`-- CH ${ch + 1} --`, cx, headerY, 'orange');
        }
        
        // Pattern data
        const pattern = this.song.patterns[this.currentPattern];
        const startRow = this.scrollOffset;
        const endRow = Math.min(64, startRow + this.visibleRows);
        const rowHeight = 14;
        const dataY = y + 25;
        
        for (let row = startRow; row < endRow; row++) {
            const ry = dataY + (row - startRow) * rowHeight;
            
            // Get playback state
            const playState = this.audio.getState();
            const isPlayingRow = playState.playing && row === playState.row && 
                                 this.currentPattern === this.song.patternOrder[playState.position];
            
            // Highlight playing row
            if (isPlayingRow) {
                this.ui.rect(x + 5, ry - 1, width - 10, rowHeight, 'button');
            }
            
            // Row number
            this.ui.hex(row, x + 10, ry, 2, 
                row === this.currentRow ? 'yellow' : (isPlayingRow ? 'textBright' : 'textDim'));
            
            // Draw each channel
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                const cx = colX + ch * channelWidth;
                const isCursor = (row === this.currentRow && ch === this.currentChannel);
                
                // Cursor background (takes priority over playing row)
                if (isCursor) {
                    this.ui.rect(cx - 2, ry - 1, channelWidth - 4, rowHeight, 'cursorBg');
                }
                
                // Note
                const noteName = note.period > 0 ? 
                    this.audio.periodToNoteName(note.period) : '---';
                const noteColor = isCursor && this.currentColumn === 0 ? 'textBright' : 
                    (note.period > 0 ? 'cyan' : 'textDim');
                this.ui.text(noteName, cx, ry, noteColor);
                
                // Instrument
                const instText = note.instrument > 0 ? 
                    note.instrument.toString(16).toUpperCase().padStart(2, '0') : '..';
                const instColor = isCursor && this.currentColumn === 1 ? 'textBright' : 
                    (note.instrument > 0 ? 'green' : 'textDim');
                this.ui.text(instText, cx + 28, ry, instColor);
                
                // Effect
                const effText = note.effect > 0 ? 
                    note.effect.toString(16).toUpperCase() : '.';
                const effColor = isCursor && this.currentColumn === 2 ? 'textBright' : 
                    (note.effect > 0 ? 'yellow' : 'textDim');
                this.ui.text(effText, cx + 50, ry, effColor);
                
                // Parameter
                const paramText = note.param > 0 ? 
                    note.param.toString(16).toUpperCase().padStart(2, '0') : '..';
                const paramColor = isCursor && this.currentColumn === 3 ? 'textBright' : 
                    (note.param > 0 ? 'yellow' : 'textDim');
                this.ui.text(paramText, cx + 62, ry, paramColor);
            }
        }
    }
    
    /**
     * Draw song sequencer (pattern order list)
     */
    drawSongSequencer() {
        const x = this.rightPanelX;
        const y = this.patternViewY;
        const width = this.rightPanelWidth;
        const height = this.sequencerHeight;
        
        this.ui.rect(x, y, width, height, 'panelBg');
        this.ui.border(x, y, width, height, 'border', 2);
        
        this.ui.text('SONG SEQUENCER', x + 8, y + 5, 'orange');
        
        // Column headers with song length
        this.ui.text('POS PAT', x + 10, y + 20, 'textDim');
        this.ui.text('LEN:', x + 80, y + 20, 'textDim');
        this.ui.hex(this.song.songLength, x + 115, y + 20, 2, 'yellow');
        
        // Show 8 positions at a time with scroll offset
        const visiblePositions = 8;
        const scrollOffset = this.sequencerScrollOffset;
        const endPos = Math.min(this.song.songLength, scrollOffset + visiblePositions);
        
        for (let pos = scrollOffset; pos < endPos; pos++) {
            const iy = y + 35 + (pos - scrollOffset) * 12;
            const pattern = this.song.patternOrder[pos];
            const isCurrent = (pos === this.currentSeqPos);
            
            // Get playback state
            const playState = this.audio.getState();
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
        const x = this.rightPanelX;
        const y = this.patternViewY + this.sequencerHeight;
        const width = this.rightPanelWidth;
        const height = this.instrumentListHeight;
        
        this.ui.rect(x, y, width, height, 'panelBg');
        this.ui.border(x, y, width, height, 'border', 2);
        
        // Count loaded instruments (non-empty)
        let loadedCount = 0;
        for (let i = 1; i <= 31; i++) {
            if (!this.song.instruments[i].isEmpty()) {
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
            const instrNum = i + 1 + this.instrumentScrollOffset;
            if (instrNum > totalInstruments) break;
            
            const iy = y + 25 + i * 14;
            const instr = this.song.instruments[instrNum];
            const selected = (instrNum === this.noteEntry.getInstrument());
            
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
     * Load sample file for instrument
     */
    async loadSampleForInstrument(instrumentNumber) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.wav,.WAV';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const instrument = await this.sampleLoader.loadWAV(file);
                    
                    // Replace the instrument
                    this.song.instruments[instrumentNumber] = instrument;
                    
                    // Select this instrument
                    this.noteEntry.setInstrument(instrumentNumber);
                } catch (err) {
                    console.error('Error loading sample:', err);
                    alert('Error loading sample: ' + err.message);
                }
            }
        };
        
        input.click();
    }
    
    /**
     * Export instrument as WAV file
     */
    exportInstrument(instrumentNumber) {
        const instrument = this.song.instruments[instrumentNumber];
        
        if (instrument.isEmpty()) {
            return; // Silently ignore empty instruments
        }
        
        // Create a clean filename from instrument name
        let filename = instrument.name.trim();
        if (!filename) {
            filename = `Instrument_${instrumentNumber.toString(16).toUpperCase().padStart(2, '0')}`;
        }
        
        // Remove invalid filename characters
        filename = filename.replace(/[^a-zA-Z0-9_\-]/g, '_');
        filename = `${filename}.wav`;
        
        this.sampleLoader.exportWAV(instrument, filename);
    }
    
    /**
     * Preview selected instrument (play at middle C)
     */
    previewInstrument() {
        const instrNum = this.noteEntry.getInstrument();
        const instrument = this.song.instruments[instrNum];
        
        if (instrument.isEmpty()) {
            return; // Can't preview empty instrument
        }
        
        // Create audio context if needed
        if (!window.previewAudioContext) {
            window.previewAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const context = window.previewAudioContext;
        
        // Play directly using Web Audio API
        const source = context.createBufferSource();
        const gainNode = context.createGain();
        
        // Create buffer from instrument data
        const buffer = context.createBuffer(
            1,
            instrument.sampleData.length,
            context.sampleRate
        );
        buffer.copyToChannel(instrument.sampleData, 0);
        source.buffer = buffer;
        
        // Set loop if instrument has one
        if (instrument.hasLoop()) {
            source.loop = true;
            source.loopStart = instrument.repeatStart / context.sampleRate;
            source.loopEnd = (instrument.repeatStart + instrument.repeatLength) / context.sampleRate;
        }
        
        // Play at middle C (period 428 = C-2)
        // Amiga period formula: rate = 7093789.2 / (period * 2)
        const period = 428;
        const playbackRate = (7093789.2 / 2 / period) / context.sampleRate;
        source.playbackRate.value = playbackRate;
        
        // Set volume
        gainNode.gain.value = instrument.volume / 64;
        
        // Connect and play
        source.connect(gainNode);
        gainNode.connect(context.destination);
        source.start();
        
        // Stop after 2 seconds (or when loop completes)
        if (!instrument.hasLoop()) {
            source.stop(context.currentTime + 2);
        } else {
            source.stop(context.currentTime + 1);
        }
    }
    
    /**
     * Draw status bar
     */
    drawStatus() {
        const y = 350;
        
        // Song title
        const title = this.song.title || 'PaulaTracker v0.1';
        this.ui.text(title.substring(0, 20), 10, y, 'textDim');
        
        const state = this.audio.getState();
        const status = state.playing ? 'PLAYING' : 'STOPPED';
        const statusColor = state.playing ? 'green' : 'red';
        this.ui.text(status, 200, y, statusColor);
        
        this.ui.text(`Row: ${this.currentRow.toString().padStart(2, '0')}`, 300, y, 'text');
        this.ui.text(`Ch: ${this.currentChannel + 1}`, 380, y, 'text');
        
        if (state.playing) {
            this.ui.text(`PlayRow: ${state.row.toString().padStart(2, '0')}`, 450, y, 'cyan');
        }
        
        // Current instrument and octave
        const y2 = y + 15;
        this.ui.text(`Inst: `, 10, y2, 'textDim');
        this.ui.hex(this.noteEntry.getInstrument(), 60, y2, 2, 'yellow');
        
        this.ui.text(`Octave: ${this.noteEntry.getOctave()}`, 120, y2, 'textDim');
        
        // Clipboard status
        if (this.clipboard.hasData()) {
            const clipType = this.clipboard.getType();
            const clipText = clipType === 'row' ? 'Row' : clipType === 'pattern' ? 'Pattern' : 'Cell';
            this.ui.text(`Clip: ${clipText}`, 210, y2, 'cyan');
        }
        
        // Help text
        this.ui.text(`[F9]Preview [F11]Save [F12]Load`, 320, y2, 'textDim');
    }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tracker');
    const tracker = new PaulaTracker(canvas);
    
    // Make it global for debugging
    window.tracker = tracker;
});
