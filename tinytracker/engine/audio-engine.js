/**
 * TinyTracker Audio Engine
 * Simple chip-tune synth with 4 channels:
 * - Channel 0: Square wave (pulse)
 * - Channel 1: Sawtooth wave
 * - Channel 2: Sine wave
 * - Channel 3: Noise
 */

const SAMPLE_RATE = 48000;
const MAX_CHANNELS = 4;

// Channel types
export const CHANNEL_SQUARE = 0;
export const CHANNEL_SAW = 1;
export const CHANNEL_SINE = 2;
export const CHANNEL_NOISE = 3;

// Note frequencies (A4 = 440Hz, 12-TET)
const NOTE_FREQUENCIES = [];
for (let i = 0; i < 96; i++) {  // 8 octaves
    NOTE_FREQUENCIES[i] = 440 * Math.pow(2, (i - 57) / 12);  // A4 is index 57
}

/**
 * Simple instrument with ADSR envelope
 */
export class TinyInstrument {
    constructor() {
        this.name = 'New Instrument';
        
        // Volume envelope (in seconds)
        this.attack = 0.01;      // Attack time
        this.decay = 0.1;        // Decay time
        this.sustain = 0.7;      // Sustain level (0-1)
        this.release = 0.2;      // Release time
        
        // Waveform settings
        this.dutyCycle = 0.5;    // For square wave (0-1)
        this.noiseType = 0;      // 0=white, 1=periodic
        
        // Pitch envelope
        this.pitchSlide = 0;     // Pitch slide in semitones per second
        this.pitchSlideDuration = 0; // Duration of pitch slide
    }
    
    clone() {
        const inst = new TinyInstrument();
        inst.name = this.name;
        inst.attack = this.attack;
        inst.decay = this.decay;
        inst.sustain = this.sustain;
        inst.release = this.release;
        inst.dutyCycle = this.dutyCycle;
        inst.noiseType = this.noiseType;
        inst.pitchSlide = this.pitchSlide;
        inst.pitchSlideDuration = this.pitchSlideDuration;
        return inst;
    }
}

/**
 * Note structure
 */
export class TinyNote {
    constructor() {
        this.note = 0;          // 0-95 (8 octaves), 0 = C-0
        this.instrument = 0;    // 0-15
        this.effect = 0;        // Effect type (0-F)
        this.param = 0;         // Effect parameter (00-FF)
    }
    
    clone() {
        const n = new TinyNote();
        n.note = this.note;
        n.instrument = this.instrument;
        n.effect = this.effect;
        n.param = this.param;
        return n;
    }
}

/**
 * Pattern (32 rows × 4 channels)
 */
export class TinyPattern {
    constructor() {
        this.notes = [];
        for (let row = 0; row < 32; row++) {
            const rowNotes = [];
            for (let ch = 0; ch < MAX_CHANNELS; ch++) {
                rowNotes.push(new TinyNote());
            }
            this.notes.push(rowNotes);
        }
    }
    
    getNote(row, channel) {
        return this.notes[row][channel];
    }
}

/**
 * Song structure
 */
export class TinySong {
    constructor() {
        this.title = 'New Song';
        this.tempo = 6;              // Ticks per row
        this.bpm = 120;              // Beats per minute
        this.songLength = 1;
        this.patternOrder = [0];     // Max 256 positions
        this.patterns = [new TinyPattern()];  // Max 64 patterns
        this.instruments = [];
        
        // Create default instruments for each channel
        for (let i = 0; i < 16; i++) {
            const inst = new TinyInstrument();
            inst.name = `Instrument ${i + 1}`;
            this.instruments.push(inst);
        }
        
        // Set some defaults
        this.instruments[0].name = 'Square';
        this.instruments[0].dutyCycle = 0.5;
        
        this.instruments[1].name = 'Saw';
        
        this.instruments[2].name = 'Sine';
        
        this.instruments[3].name = 'Noise';
    }
}

/**
 * Audio Engine
 */
export class TinyEngine {
    constructor(sampleRate = SAMPLE_RATE) {
        this.sampleRate = sampleRate;
        this.song = new TinySong();
        
        // Playback state
        this.isPlaying = false;
        this.currentPosition = 0;
        this.currentRow = 0;
        this.playingRow = 0;
        this.tickCounter = 0;
        this.sampleCounter = 0;
        this.patternLoopMode = false;
        this.patternLoopStart = 0;
        
        // Timing
        this.tempo = 6;
        this.bpm = 120;
        this.samplesPerTick = 0;
        this.updateTiming();
        
        // Channel states
        this.channels = [];
        for (let i = 0; i < MAX_CHANNELS; i++) {
            this.channels.push({
                type: i,  // Channel type
                active: false,
                note: 0,
                instrument: 0,
                frequency: 0,
                volume: 1.0,
                phase: 0,
                
                // Envelope state
                envPhase: 0,  // 0=attack, 1=decay, 2=sustain, 3=release
                envTime: 0,
                envVolume: 0,
                
                // Effect state
                vibrato: { speed: 0, depth: 0, pos: 0 },
                slideTarget: 0,
                slideSpeed: 0,
                arpeggio: { note1: 0, note2: 0 },
                
                // Noise state (for noise channel)
                noiseValue: 0,
                noiseCounter: 0
            });
        }
        
        this.mutedChannels = [false, false, false, false];
    }
    
    setSong(song) {
        this.song = song;
        this.tempo = song.tempo;
        this.bpm = song.bpm;
        this.updateTiming();
    }
    
    updateTiming() {
        const ticksPerSecond = this.bpm / 2.5;
        this.samplesPerTick = Math.floor(this.sampleRate / ticksPerSecond);
    }
    
    play(position = 0, startRow = 0) {
        this.isPlaying = true;
        this.currentPosition = position;
        this.currentRow = startRow;
        this.tickCounter = 0;
        this.sampleCounter = 0;
        this.patternLoopStart = startRow;
    }
    
    stop() {
        this.isPlaying = false;
        this.currentPosition = 0;
        this.currentRow = 0;
        
        // Release all notes
        for (const ch of this.channels) {
            if (ch.active) {
                ch.envPhase = 3;  // Release
                ch.envTime = 0;
            }
        }
    }
    
    setPatternLoop(enabled) {
        this.patternLoopMode = enabled;
    }
    
    getState() {
        return {
            playing: this.isPlaying,
            position: this.currentPosition,
            row: this.playingRow,
            tempo: this.tempo,
            bpm: this.bpm
        };
    }
    
    toggleMute(channel) {
        this.mutedChannels[channel] = !this.mutedChannels[channel];
    }
    
    /**
     * Process a single tick
     */
    processTick() {
        if (this.tickCounter === 0) {
            this.processRow();
            this.playingRow = this.currentRow;
        }
        
        this.processEffects();
        
        this.tickCounter++;
        if (this.tickCounter >= this.tempo) {
            this.tickCounter = 0;
            this.currentRow++;
            
            if (this.currentRow >= 32) {
                if (this.patternLoopMode) {
                    // Loop back to pattern start
                    this.currentRow = this.patternLoopStart;
                } else {
                    // Advance to next pattern
                    this.currentRow = 0;
                    this.currentPosition++;
                    if (this.currentPosition >= this.song.songLength) {
                        this.currentPosition = 0;
                    }
                }
            }
        }
    }
    
    /**
     * Process row (trigger notes)
     */
    processRow() {
        const patternNum = this.song.patternOrder[this.currentPosition];
        const pattern = this.song.patterns[patternNum];
        if (!pattern) return;
        
        for (let ch = 0; ch < MAX_CHANNELS; ch++) {
            const note = pattern.getNote(this.currentRow, ch);
            const state = this.channels[ch];
            
            // Store effect
            state.effect = note.effect;
            state.param = note.param;
            
            // Handle effects that modify behavior
            if (note.effect === 0x0 && note.param > 0) {
                // Arpeggio
                const x = (note.param >> 4) & 0xF;
                const y = note.param & 0xF;
                state.arpeggio.note1 = x;
                state.arpeggio.note2 = y;
            }
            
            // Trigger note if present
            if (note.note > 0) {
                this.triggerNote(ch, note.note, note.instrument);
            }
        }
    }
    
    /**
     * Trigger a note on a channel
     */
    triggerNote(channel, noteNum, instrumentNum) {
        const state = this.channels[channel];
        const inst = this.song.instruments[instrumentNum] || this.song.instruments[0];
        
        state.active = true;
        state.note = noteNum;
        state.instrument = instrumentNum;
        state.frequency = NOTE_FREQUENCIES[noteNum];
        state.volume = 1.0;
        state.phase = 0;
        
        // Start envelope
        state.envPhase = 0;  // Attack
        state.envTime = 0;
        state.envVolume = 0;
    }
    
    /**
     * Process effects (runs every tick)
     */
    processEffects() {
        for (let ch = 0; ch < MAX_CHANNELS; ch++) {
            const state = this.channels[ch];
            if (!state.active) continue;
            
            const inst = this.song.instruments[state.instrument] || this.song.instruments[0];
            
            // Effect 0: Arpeggio
            if (state.effect === 0x0 && state.param > 0 && this.tickCounter > 0) {
                const tick = this.tickCounter % 3;
                const baseNote = state.note;
                let arpeggioNote = baseNote;
                
                if (tick === 1 && state.arpeggio.note1 > 0) {
                    arpeggioNote = baseNote + state.arpeggio.note1;
                } else if (tick === 2 && state.arpeggio.note2 > 0) {
                    arpeggioNote = baseNote + state.arpeggio.note2;
                }
                
                state.frequency = NOTE_FREQUENCIES[Math.min(95, arpeggioNote)];
            }
            
            // Effect 1: Pitch slide up
            if (state.effect === 0x1 && state.param > 0 && this.tickCounter > 0) {
                const slideAmount = state.param / 100.0;
                state.frequency *= Math.pow(2, slideAmount / 12);
            }
            
            // Effect 2: Pitch slide down
            if (state.effect === 0x2 && state.param > 0 && this.tickCounter > 0) {
                const slideAmount = state.param / 100.0;
                state.frequency /= Math.pow(2, slideAmount / 12);
            }
            
            // Effect 4: Vibrato
            if (state.effect === 0x4 && state.param > 0) {
                const speed = (state.param >> 4) & 0xF;
                const depth = state.param & 0xF;
                
                if (speed > 0) state.vibrato.speed = speed;
                if (depth > 0) state.vibrato.depth = depth;
                
                const delta = Math.sin(state.vibrato.pos * Math.PI / 32) * state.vibrato.depth * 2;
                state.frequency = NOTE_FREQUENCIES[state.note] * Math.pow(2, delta / 12);
                state.vibrato.pos = (state.vibrato.pos + state.vibrato.speed) & 0x3F;
            }
            
            // Effect C: Volume (Cxx sets volume 00-40 in hex, 0-64 in decimal)
            if (state.effect === 0xC && this.tickCounter === 0) {
                state.volume = Math.min(1.0, state.param / 64.0);
            }
            
            // Effect A: Volume slide (Axy: x=slide up, y=slide down)
            if (state.effect === 0xA && state.param > 0 && this.tickCounter > 0) {
                const slideUp = (state.param >> 4) & 0xF;
                const slideDown = state.param & 0xF;
                
                if (slideUp > 0) {
                    state.volume = Math.min(1.0, state.volume + slideUp / 64.0);
                } else if (slideDown > 0) {
                    state.volume = Math.max(0.0, state.volume - slideDown / 64.0);
                }
            }
        }
    }
    
    /**
     * Generate waveform sample for a channel
     */
    getChannelSample(channel) {
        const state = this.channels[channel];
        if (!state.active) return 0;
        
        const inst = this.song.instruments[state.instrument] || this.song.instruments[0];
        
        // Update envelope
        this.updateEnvelope(state, inst);
        
        if (state.envVolume <= 0) {
            state.active = false;
            return 0;
        }
        
        // Generate waveform
        let sample = 0;
        const phaseIncrement = state.frequency / this.sampleRate;
        
        switch (state.type) {
            case CHANNEL_SQUARE:
                sample = state.phase < inst.dutyCycle ? 1 : -1;
                break;
                
            case CHANNEL_SAW:
                sample = (state.phase * 2 - 1);
                break;
                
            case CHANNEL_SINE:
                sample = Math.sin(state.phase * Math.PI * 2);
                break;
                
            case CHANNEL_NOISE:
                // Simple white noise
                state.noiseCounter++;
                if (state.noiseCounter >= 10) {
                    state.noiseValue = Math.random() * 2 - 1;
                    state.noiseCounter = 0;
                }
                sample = state.noiseValue;
                break;
        }
        
        // Update phase
        state.phase = (state.phase + phaseIncrement) % 1.0;
        
        return sample * state.envVolume * state.volume;
    }
    
    /**
     * Update ADSR envelope
     */
    updateEnvelope(state, inst) {
        const dt = 1.0 / this.sampleRate;
        state.envTime += dt;
        
        switch (state.envPhase) {
            case 0:  // Attack
                if (inst.attack > 0) {
                    state.envVolume = Math.min(1.0, state.envTime / inst.attack);
                    if (state.envVolume >= 1.0) {
                        state.envPhase = 1;
                        state.envTime = 0;
                    }
                } else {
                    state.envVolume = 1.0;
                    state.envPhase = 1;
                }
                break;
                
            case 1:  // Decay
                if (inst.decay > 0) {
                    state.envVolume = 1.0 - (1.0 - inst.sustain) * (state.envTime / inst.decay);
                    if (state.envVolume <= inst.sustain) {
                        state.envPhase = 2;
                        state.envVolume = inst.sustain;
                    }
                } else {
                    state.envPhase = 2;
                    state.envVolume = inst.sustain;
                }
                break;
                
            case 2:  // Sustain
                state.envVolume = inst.sustain;
                break;
                
            case 3:  // Release
                if (inst.release > 0) {
                    state.envVolume = inst.sustain * (1.0 - state.envTime / inst.release);
                    if (state.envVolume <= 0) {
                        state.envVolume = 0;
                        state.active = false;
                    }
                } else {
                    state.envVolume = 0;
                    state.active = false;
                }
                break;
        }
    }
    
    /**
     * Mix audio buffer
     */
    mixAudio(numFrames) {
        const output = new Float32Array(numFrames * 2);
        
        if (!this.isPlaying) return output;
        
        for (let frame = 0; frame < numFrames; frame++) {
            // Process tick if needed
            if (this.sampleCounter >= this.samplesPerTick) {
                this.processTick();
                this.sampleCounter = 0;
            }
            this.sampleCounter++;
            
            // Mix channels
            let left = 0, right = 0;
            
            for (let ch = 0; ch < MAX_CHANNELS; ch++) {
                if (this.mutedChannels[ch]) continue;
                
                const sample = this.getChannelSample(ch);
                
                // Simple stereo panning
                if (ch === 0 || ch === 3) {
                    left += sample * 0.7;
                    right += sample * 0.3;
                } else {
                    left += sample * 0.3;
                    right += sample * 0.7;
                }
            }
            
            // Master volume and clipping
            output[frame * 2 + 0] = Math.max(-1, Math.min(1, left * 0.5));
            output[frame * 2 + 1] = Math.max(-1, Math.min(1, right * 0.5));
        }
        
        return output;
    }
}
