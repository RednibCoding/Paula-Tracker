/**
 * Paula Tracker - Main Application
 * Old-school 4-channel tracker for Amiga Paula chip
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
        this.showHelp = false; // F1 help screen
        this.hexEntryState = 0; // 0=first digit, 1=second digit for multi-digit entry
        
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
        this.generateTestSineInstrument();
        this.generateTestPattern();
        
        // Start render loop
        this.startRenderLoop();
    }
    
    /**
     * Setup keyboard input
     */
    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            // F1 shows help
            if (e.key === 'F1') {
                this.showHelp = true;
                e.preventDefault();
            }
            this.inputHandler.handleKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            // F1 release hides help
            if (e.key === 'F1') {
                this.showHelp = false;
                e.preventDefault();
            }
        });
    }
    
    /**
     * Setup file input for loading MOD files
     */
    setupFileInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mod,.MOD';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    this.song = await ModLoader.loadFromFile(file);
                    this.currentPattern = 0;
                    this.currentRow = 0;
                    this.scrollOffset = 0;
                    this.audio.stop();
                } catch (err) {
                    console.error('Failed to load MOD file:', err);
                    alert('Error loading MOD file: ' + err.message);
                }
            }
        });
        
        this.fileInput = input;
    }
    
    /**
     * Load MOD file
     */
    loadModFile() {
        this.fileInput.click();
    }
    
    /**
     * Save MOD file
     */
    async saveModFile() {
        const filename = (this.song.title || 'untitled').trim().replace(/[^a-zA-Z0-9_-]/g, '_') + '.mod';
        await ModLoader.saveToFile(this.song, filename);
    }
    
    /**
     * Duplicate current pattern to next available slot
     */
    duplicatePattern() {
        // Find the next empty pattern slot (or use the next sequential number)
        let targetPattern = this.currentPattern + 1;
        
        // MOD format supports up to 64 patterns (0-63)
        if (targetPattern >= 64) {
            return; // Can't duplicate, already at max
        }
        
        // Clone the current pattern
        const sourcePattern = this.song.patterns[this.currentPattern];
        this.song.patterns[targetPattern] = sourcePattern.clone();
        
        // Switch to the new pattern
        this.currentPattern = targetPattern;
        
        console.log(`Duplicated pattern to slot ${targetPattern}`);
    }
    
    /**
     * Edit song title
     */
    editSongTitle() {
        const currentTitle = this.song.title || 'Paula Tracker v1.0';
        const newTitle = prompt('Enter song title (max 20 chars):', currentTitle);
        
        if (newTitle !== null) {
            // Limit to 20 characters (MOD format limitation)
            this.song.title = newTitle.substring(0, 20);
        }
    }
    
    /**
     * Generate a simple test instrument
     */
    generateTestSineInstrument() {
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
    }    /**
     * Generate test pattern
     */
    generateTestPattern() {
        const pattern = this.song.patterns[0];
        
        // Some test notes
        const testNotes = [
            { row: 0, ch: 0, period: 428, inst: 1 },   // C-2
            { row: 4, ch: 1, period: 381, inst: 1 },   // D-2
            { row: 8, ch: 2, period: 340, inst: 1 },   // E-2
            { row: 12, ch: 3, period: 428, inst: 1 },  // C-2
            { row: 16, ch: 0, period: 381, inst: 1 },  // D-2
            { row: 20, ch: 1, period: 340, inst: 1 },  // E-2
            { row: 24, ch: 2, period: 428, inst: 1 },  // C-2
        ];
        
        testNotes.forEach(({ row, ch, period, inst }) => {
            const note = pattern.getNote(row, ch);
            note.period = period;
            note.instrument = inst;
        });
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
            
            // Only auto-scroll if NOT in pattern loop mode
            // This allows editing while listening in loop mode
            if (!playState.patternLoop) {
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
        }
        
        this.ui.clear();
        this.renderer.drawTitle();
        this.renderer.drawControls();
        this.renderer.drawPatternEditor();
        this.renderer.drawSongSequencer();
        this.renderer.drawInstrumentList();
        this.renderer.drawStatus();
        
        // Draw help overlay if F1 is held
        if (this.showHelp) {
            this.renderer.drawHelp();
        }
        
        this.ui.update();
        requestAnimationFrame(() => this.render());
    }
    
    /**
     * Start the render loop
     */
    startRenderLoop() {
        this.render();
    }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tracker');
    const tracker = new PaulaTracker(canvas);
    
    // Make it global for debugging
    window.tracker = tracker;
});
