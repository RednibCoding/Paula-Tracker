/**
 * Core data structures for Paula Tracker
 * Note, Pattern, Instrument, and Song models
 */

// Note class - represents a single note event in a pattern
export class Note {
    constructor() {
        this.period = 0;        // Amiga period (0 = no note)
        this.instrument = 0;    // Instrument number (0 = no instrument)
        this.effect = 0;        // Effect command (0-F)
        this.param = 0;         // Effect parameter (00-FF)
    }
    
    clear() {
        this.period = 0;
        this.instrument = 0;
        this.effect = 0;
        this.param = 0;
    }
    
    isEmpty() {
        return this.period === 0 && this.instrument === 0 && 
               this.effect === 0 && this.param === 0;
    }
    
    clone() {
        const note = new Note();
        note.period = this.period;
        note.instrument = this.instrument;
        note.effect = this.effect;
        note.param = this.param;
        return note;
    }
}

// Pattern class - 64 steps x 4 channels
export class Pattern {
    constructor(length = 64) {
        this.length = length;
        this.data = [];
        
        // Initialize pattern data
        for (let step = 0; step < length; step++) {
            this.data[step] = [];
            for (let channel = 0; channel < 4; channel++) {
                this.data[step][channel] = new Note();
            }
        }
    }
    
    getNote(step, channel) {
        return this.data[step][channel];
    }
    
    setNote(step, channel, note) {
        this.data[step][channel] = note.clone();
    }
    
    clear() {
        for (let step = 0; step < this.length; step++) {
            for (let channel = 0; channel < 4; channel++) {
                this.data[step][channel].clear();
            }
        }
    }
    
    clone() {
        const pattern = new Pattern(this.length);
        for (let step = 0; step < this.length; step++) {
            for (let channel = 0; channel < 4; channel++) {
                pattern.data[step][channel] = this.data[step][channel].clone();
            }
        }
        return pattern;
    }
}

// Instrument/Sample class
export class Instrument {
    constructor() {
        this.name = 'untitled';
        this.length = 0;            // Sample length in bytes
        this.finetune = 0;          // Finetune value (-8 to 7)
        this.volume = 64;           // Default volume (0-64)
        this.repeatStart = 0;       // Loop start point
        this.repeatLength = 0;      // Loop length (0 = no loop)
        this.sampleData = null;     // Float32Array or null
    }
    
    hasLoop() {
        return this.repeatLength > 2;
    }
    
    isEmpty() {
        return this.length === 0 || !this.sampleData;
    }
}

// Song class - holds complete tracker module
export class Song {
    constructor() {
        this.title = 'untitled';
        this.tempo = 6;             // Speed (1-31, default 6)
        this.bpm = 125;             // BPM (32-255, default 125)
        this.songLength = 1;        // Number of positions in song
        this.restartPosition = 0;   // Restart position
        
        // Pattern order (which pattern plays at each position)
        this.patternOrder = new Array(128).fill(0);
        
        // Instruments (31 instruments, index 0 is empty)
        this.instruments = [];
        for (let i = 0; i < 32; i++) {
            this.instruments.push(new Instrument());
        }
        
        // Patterns (64 patterns max)
        this.patterns = [];
        for (let i = 0; i < 64; i++) {
            this.patterns.push(new Pattern());
        }
    }
    
    getPattern(index) {
        return this.patterns[index] || this.patterns[0];
    }
    
    getInstrument(index) {
        return this.instruments[index] || this.instruments[0];
    }
    
    getCurrentPattern(position) {
        const patternIndex = this.patternOrder[position];
        return this.getPattern(patternIndex);
    }
}
