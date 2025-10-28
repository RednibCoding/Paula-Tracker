/**
 * Pure Paula Audio Engine
 * Platform-independent audio mixing and playback logic
 * No browser or Node.js dependencies - just pure JavaScript
 */

// Amiga period table for arpeggio (C-1 to B-3)
// Array index = semitone, value = period
// ProTracker vibrato sine table (32 entries, values 0-255)
// This is the authentic Amiga ProTracker vibrato waveform
const VIBRATO_TABLE = [
    0, 24, 49, 74, 97, 120, 141, 161, 180, 197, 212, 224, 235, 244, 250, 253,
    255, 253, 250, 244, 235, 224, 212, 197, 180, 161, 141, 120, 97, 74, 49, 24
];

// ProTracker period table with finetune support
// Each note has base period (finetune 0) and array of 16 finetuned periods (finetune -8 to +7)
// Index 8 in tune array = finetune 0 (no finetune)
// Note: Using octave 1-3 numbering to match BassoonTracker convention
export const PERIOD_TABLE_WITH_FINETUNE = [
    {period: 856, name: "C-1", tune: [907,900,894,887,881,875,868,862,856,850,844,838,832,826,820,814]},
    {period: 808, name: "C#1", tune: [856,850,844,838,832,826,820,814,808,802,796,791,785,779,774,768]},
    {period: 762, name: "D-1", tune: [808,802,796,791,785,779,774,768,762,757,752,746,741,736,730,725]},
    {period: 720, name: "D#1", tune: [762,757,752,746,741,736,730,725,720,715,709,704,699,694,689,684]},
    {period: 678, name: "E-1", tune: [720,715,709,704,699,694,689,684,678,674,670,665,660,655,651,646]},
    {period: 640, name: "F-1", tune: [678,675,670,665,660,655,651,646,640,637,632,628,623,619,614,610]},
    {period: 604, name: "F#1", tune: [640,636,632,628,623,619,614,610,604,601,597,592,588,584,580,575]},
    {period: 570, name: "G-1", tune: [604,601,597,592,588,584,580,575,570,567,563,559,555,551,547,543]},
    {period: 538, name: "G#1", tune: [570,567,563,559,555,551,547,543,538,535,532,528,524,520,516,513]},
    {period: 508, name: "A-1", tune: [538,535,532,528,524,520,516,513,508,505,502,498,495,491,487,484]},
    {period: 480, name: "A#1", tune: [508,505,502,498,494,491,487,484,480,477,474,470,467,463,460,457]},
    {period: 453, name: "B-1", tune: [480,477,474,470,467,463,460,457,453,450,447,444,441,437,434,431]},
    {period: 428, name: "C-2", tune: [453,450,447,444,441,437,434,431,428,425,422,419,416,413,410,407]},
    {period: 404, name: "C#2", tune: [428,425,422,419,416,413,410,407,404,401,398,395,392,390,387,384]},
    {period: 381, name: "D-2", tune: [404,401,398,395,392,390,387,384,381,379,376,373,370,368,365,363]},
    {period: 360, name: "D#2", tune: [381,379,376,373,370,368,365,363,360,357,355,352,350,347,345,342]},
    {period: 339, name: "E-2", tune: [360,357,355,352,350,347,345,342,339,337,335,332,330,328,325,323]},
    {period: 320, name: "F-2", tune: [339,337,335,332,330,328,325,323,320,318,316,314,312,309,307,305]},
    {period: 302, name: "F#2", tune: [320,318,316,314,312,309,307,305,302,300,298,296,294,292,290,288]},
    {period: 285, name: "G-2", tune: [302,300,298,296,294,292,290,288,285,284,282,280,278,276,274,272]},
    {period: 269, name: "G#2", tune: [285,284,282,280,278,276,274,272,269,268,266,264,262,260,258,256]},
    {period: 254, name: "A-2", tune: [269,268,266,264,262,260,258,256,254,253,251,249,247,245,244,242]},
    {period: 240, name: "A#2", tune: [254,253,251,249,247,245,244,242,240,239,237,235,233,232,230,228]},
    {period: 226, name: "B-2", tune: [240,238,237,235,233,232,230,228,226,225,224,222,220,219,217,216]},
    {period: 214, name: "C-3", tune: [226,225,223,222,220,219,217,216,214,213,211,209,208,206,205,204]},
    {period: 202, name: "C#3", tune: [214,212,211,209,208,206,205,203,202,201,199,198,196,195,193,192]},
    {period: 190, name: "D-3", tune: [202,200,199,198,196,195,193,192,190,189,188,187,185,184,183,181]},
    {period: 180, name: "D#3", tune: [190,189,188,187,185,184,183,181,180,179,177,176,175,174,172,171]},
    {period: 170, name: "E-3", tune: [180,179,177,176,175,174,172,171,170,169,167,166,165,164,163,161]},
    {period: 160, name: "F-3", tune: [170,169,167,166,165,164,163,161,160,159,158,157,156,155,154,152]},
    {period: 151, name: "F#3", tune: [160,159,158,157,156,155,154,152,151,150,149,148,147,146,145,144]},
    {period: 143, name: "G-3", tune: [151,150,149,148,147,146,145,144,143,142,141,140,139,138,137,136]},
    {period: 135, name: "G#3", tune: [143,142,141,140,139,138,137,136,135,134,133,132,131,130,129,128]},
    {period: 127, name: "A-3", tune: [135,134,133,132,131,130,129,128,127,126,125,125,124,123,122,121]},
    {period: 120, name: "A#3", tune: [127,126,125,125,123,123,122,121,120,119,118,118,117,116,115,114]},
    {period: 113, name: "B-3", tune: [120,119,118,118,117,116,115,114,113,113,112,111,110,109,109,108]}
];

// Simple period table (no finetune) for backwards compatibility
export const PERIOD_TABLE = PERIOD_TABLE_WITH_FINETUNE.map(n => n.period);

// Note names for display
export const NOTE_NAMES = PERIOD_TABLE_WITH_FINETUNE.map(n => n.name);

// Period to note name lookup
const PERIOD_TO_NOTE = {
    856:'C-1',808:'C#1',762:'D-1',720:'D#1',678:'E-1',640:'F-1',
    604:'F#1',570:'G-1',538:'G#1',508:'A-1',480:'A#1',453:'B-1',
    428:'C-2',404:'C#2',381:'D-2',360:'D#2',339:'E-2',320:'F-2',
    302:'F#2',285:'G-2',269:'G#2',254:'A-2',240:'A#2',226:'B-2',
    214:'C-3',202:'C#3',190:'D-3',180:'D#3',170:'E-3',160:'F-3',
    151:'F#3',143:'G-3',135:'G#3',127:'A-3',120:'A#3',113:'B-3',
};

/**
 * Pure Paula audio engine
 * Handles all mixing, playback, and effect processing
 * Platform-independent - doesn't touch any audio APIs
 */
export class PaulaEngine {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        this.PAULA_FREQUENCY = 7093789.2 / 2;  // PAL
        
        // Playback state
        this.isPlaying = false;
        this.currentPosition = 0;
        this.currentRow = 0;
        this.playingRow = 0;
        this.tempo = 6;
        this.bpm = 125;
        this.tickCounter = 0;
        this.samplesPerTick = 0;
        this.sampleCounter = 0;
        
        // Channel states (4 channels)
        this.channelStates = [];
        this.vuLevels = [0, 0, 0, 0];
        this.vuPeaks = [0, 0, 0, 0];  // Peak values for VU meter display
        this.vuDecay = 0.95;  // Decay rate for VU meters (higher = slower decay)
        for (let i = 0; i < 4; i++) {
            this.channelStates.push({
                period: 0,
                instrument: 0,
                volume: 64,
                effect: 0,
                param: 0,
                samplePos: 0,
                sampleRate: 0,
                vibratoPos: 0,
                vibratoSpeed: 4,
                vibratoDepth: 4,
                tremoloPos: 0,
                tremoloSpeed: 4,
                tremoloDepth: 4,
                tremoloValue: 0,
                slideTarget: 0,
                slideSpeed: 0,
                arpeggioNote1: 0,
                arpeggioNote2: 0,
                finetune: 0,
                // Note delay (EDx)
                noteDelayTicks: 0,
                delayedNote: null,
                delayedSample: 0,
                delayedPeriod: 0,
            });
        }
        
        this.song = null;
        this.patternLoopMode = false;
        this.mutedChannels = [false, false, false, false];
        
        // Pattern break/jump control
        this.patternBreak = false;
        this.patternBreakRow = 0;
        this.positionJump = false;
        this.positionJumpTarget = 0;
        
        this.updateTiming();
    }
    
    /**
     * Set the song to play
     */
    setSong(song) {
        this.song = song;
        this.tempo = song.tempo;
        this.bpm = song.bpm;
        this.updateTiming();
    }
    
    /**
     * Update timing calculations
     */
    updateTiming() {
        // Calculate samples per tick
        // ProTracker: 1 tick = (2.5 / BPM) seconds
        const ticksPerSecond = (this.bpm * 2) / 5;
        this.samplesPerTick = this.sampleRate / ticksPerSecond;
    }
    
    /**
     * Start playback
     */
    play(position = 0, startRow = 0) {
        this.isPlaying = true;
        this.currentPosition = position;
        this.currentRow = startRow;
        this.tickCounter = 0;
        this.sampleCounter = 0;
    }
    
    /**
     * Stop playback
     */
    stop() {
        this.isPlaying = false;
        this.currentPosition = 0;
        this.currentRow = 0;
        this.tickCounter = 0;
        
        // Reset channels
        for (let state of this.channelStates) {
            state.samplePos = 0;
        }
    }
    
    /**
     * Get current playback state
     */
    getState() {
        return {
            playing: this.isPlaying,
            position: this.currentPosition,
            row: this.playingRow,
            tempo: this.tempo,
            bpm: this.bpm,
            patternLoop: this.patternLoopMode,
            vuLevels: [...this.vuLevels],
            mutedChannels: [...this.mutedChannels],
        };
    }
    
    /**
     * Calculate sample playback rate from Amiga period
     */
    periodToRate(period) {
        if (period === 0) return 0;
        return this.PAULA_FREQUENCY / (period * this.sampleRate);
    }
    
    /**
     * Get note name from period
     */
    periodToNoteName(period) {
        return PERIOD_TO_NOTE[period] || '---';
    }
    
    /**
     * Process a tick
     */
    processTick() {
        if (this.tickCounter === 0) {
            // Process new row
            this.processRow();
            this.playingRow = this.currentRow;
        }
        
        // Process effects on all ticks (including tick 0)
        // This is needed for effects like arpeggio that need to run continuously
        this.processEffects();
        
        this.tickCounter++;
        if (this.tickCounter >= this.tempo) {
            this.tickCounter = 0;
            this.currentRow++;
            
            // Check for pattern break or position jump
            if (this.positionJump) {
                this.currentPosition = this.positionJumpTarget;
                this.currentRow = 0;
                this.positionJump = false;
                this.patternBreak = false;
                
                // Bounds check
                if (this.currentPosition >= this.song.songLength) {
                    this.currentPosition = 0;
                }
            } else if (this.patternBreak) {
                this.currentRow = this.patternBreakRow;
                this.patternBreak = false;
                
                if (!this.patternLoopMode) {
                    this.currentPosition++;
                    if (this.currentPosition >= this.song.songLength) {
                        this.currentPosition = 0;
                    }
                }
            } else if (this.currentRow >= 64) {
                this.currentRow = 0;
                
                if (!this.patternLoopMode) {
                    this.currentPosition++;
                    
                    if (this.currentPosition >= this.song.songLength) {
                        this.currentPosition = 0;
                    }
                }
            }
        }
    }
    
    /**
     * Process a row - trigger notes and effects
     */
    processRow() {
        if (!this.song) return;
        
        const patternIdx = this.song.patternOrder[this.currentPosition];
        const pattern = this.song.patterns[patternIdx];
        
        // Safety check - pattern might be undefined
        if (!pattern) return;
        
        for (let ch = 0; ch < 4; ch++) {
            const note = pattern.getNote(this.currentRow, ch);
            const state = this.channelStates[ch];
            
            // Store effect for tick processing
            state.effect = note.effect;
            state.param = note.param;
            
            // Reset note delay for this row
            state.noteDelayTicks = 0;
            state.delayedNote = null;
            
            // Check for EDx (Note Delay) FIRST
            if (note.effect === 0xE) {
                const extCmd = (note.param >> 4) & 0xF;
                const extParam = note.param & 0xF;
                
                if (extCmd === 0xD) {
                    // Store the note data for delayed triggering
                    state.noteDelayTicks = extParam;
                    state.delayedNote = {
                        period: note.period,
                        instrument: note.instrument,
                        effect: note.effect,
                        param: note.param
                    };
                    // Don't process this note now - will be triggered in processEffects
                    continue;
                }
            }
            
            // Effect 0: Arpeggio (0xy) - set on tick 0
            if (note.effect === 0x0 && note.param !== 0) {
                state.arpeggioNote1 = (note.param >> 4) & 0xF;
                state.arpeggioNote2 = note.param & 0xF;
            }
            
            // Effect 3: Tone Portamento (3xx) - don't retrigger note
            if (note.effect === 0x3) {
                if (note.param > 0) {
                    state.slideSpeed = note.param;
                }
                if (note.period > 0) {
                    state.slideTarget = note.period;
                }
                // Don't trigger new sample
                continue;
            }
            
            // Effect 5: Tone Portamento + Volume Slide (5xy)
            if (note.effect === 0x5) {
                if (note.period > 0) {
                    state.slideTarget = note.period;
                }
                // Continue with slide, don't retrigger
                continue;
            }
            
            // Effect 9: Set Sample Offset (9xx)
            let sampleOffset = 0;
            if (note.effect === 0x9) {
                sampleOffset = note.param * 256;
            }
            
            // Effect E: Extended commands
            if (note.effect === 0xE) {
                const extCmd = (note.param >> 4) & 0xF;
                const extParam = note.param & 0xF;
                
                // E1x: Fine Slide Up
                if (extCmd === 0x1) {
                    state.period = Math.max(113, state.period - extParam);
                    state.sampleRate = this.periodToRate(state.period);
                }
                // E2x: Fine Slide Down
                else if (extCmd === 0x2) {
                    state.period = Math.min(856, state.period + extParam);
                    state.sampleRate = this.periodToRate(state.period);
                }
                // E5x: Set Finetune
                else if (extCmd === 0x5) {
                    // Store finetune for this channel
                    state.finetune = extParam > 7 ? extParam - 16 : extParam;
                }
                // EAx: Fine Volume Slide Up
                else if (extCmd === 0xA) {
                    state.volume = Math.min(64, state.volume + extParam);
                }
                // EBx: Fine Volume Slide Down
                else if (extCmd === 0xB) {
                    state.volume = Math.max(0, state.volume - extParam);
                }
            }
            
            // Effect B: Position Jump (Bxx)
            if (note.effect === 0xB) {
                this.positionJump = true;
                this.positionJumpTarget = note.param;
            }
            
            // Effect D: Pattern Break (Dxx)
            if (note.effect === 0xD) {
                this.patternBreak = true;
                // Convert from BCD to decimal (xx -> x*10 + y)
                const row = ((note.param >> 4) * 10) + (note.param & 0x0F);
                this.patternBreakRow = Math.min(63, row);
            }
            
            // Effect F: Set Speed/Tempo (Fxx)
            if (note.effect === 0xF && note.param > 0) {
                if (note.param < 32) {
                    this.tempo = note.param;
                } else {
                    this.bpm = note.param;
                }
                this.updateTiming();
            }
            
            // Effect C: Set Volume (Cxx)
            if (note.effect === 0xC) {
                state.volume = Math.min(64, note.param);
            }
            
            // Trigger note (except for effects that prevent retriggering)
            if (note.period > 0) {
                // Apply finetune to the period if instrument has finetune
                let finalPeriod = note.period;
                
                if (note.instrument > 0) {
                    state.instrument = note.instrument;
                    const inst = this.song.getInstrument(note.instrument);
                    if (inst && !inst.isEmpty()) {
                        // Apply finetune to period
                        const finetune = inst.finetune || 0;
                        if (finetune !== 0) {
                            finalPeriod = this.applyFinetune(note.period, finetune);
                        }
                        
                        // Only reset volume if no Cxx effect
                        if (note.effect !== 0xC) {
                            state.volume = inst.volume;
                        }
                    }
                }
                
                state.period = finalPeriod;
                state.samplePos = sampleOffset;
                state.sampleRate = this.periodToRate(finalPeriod);
            }
        }
    }
    
    /**
     * Process effects on non-zero ticks
     */
    processEffects() {
        for (let ch = 0; ch < 4; ch++) {
            const state = this.channelStates[ch];
            const effect = state.effect;
            const param = state.param;
            
            // EDx: Note Delay - trigger delayed note on the correct tick
            if (state.delayedNote && this.tickCounter === state.noteDelayTicks) {
                const delNote = state.delayedNote;
                
                // Trigger the delayed note
                if (delNote.period > 0) {
                    state.period = delNote.period;
                    state.samplePos = 0;
                    state.sampleRate = this.periodToRate(delNote.period);
                    
                    if (delNote.instrument > 0) {
                        state.instrument = delNote.instrument;
                        const inst = this.song.getInstrument(delNote.instrument);
                        if (inst && !inst.isEmpty()) {
                            // Set volume from instrument (unless Cxx was used)
                            if (delNote.effect !== 0xC) {
                                state.volume = inst.volume;
                            }
                        }
                    }
                }
                
                // Clear delayed note after triggering
                state.delayedNote = null;
            }
            
            // Effect 0: Arpeggio (0xy)
            if (effect === 0x0 && param !== 0) {
                const tick = this.tickCounter % 3;
                let period = state.period;
                
                // Get finetune from current instrument
                let finetune = 0;
                if (state.instrument > 0) {
                    const inst = this.song.getInstrument(state.instrument);
                    if (inst && !inst.isEmpty()) {
                        finetune = inst.finetune || 0;
                    }
                }
                
                if (tick === 1 && state.arpeggioNote1 > 0) {
                    // Add semitones based on first parameter
                    period = this.applyArpeggio(state.period, state.arpeggioNote1, finetune);
                } else if (tick === 2 && state.arpeggioNote2 > 0) {
                    // Add semitones based on second parameter
                    period = this.applyArpeggio(state.period, state.arpeggioNote2, finetune);
                }
                
                state.sampleRate = this.periodToRate(period);
            }
            
            // Effect 1: Slide Up (1xx)
            else if (effect === 0x1 && param > 0) {
                state.period = Math.max(113, state.period - param);
                state.sampleRate = this.periodToRate(state.period);
            }
            
            // Effect 2: Slide Down (2xx)
            else if (effect === 0x2 && param > 0) {
                state.period = Math.min(856, state.period + param);
                state.sampleRate = this.periodToRate(state.period);
            }
            
            // Effect 3: Tone Portamento (3xx)
            // Only process on ticks 1+, not on tick 0
            else if (effect === 0x3 && this.tickCounter > 0) {
                if (state.slideTarget > 0) {
                    if (state.period < state.slideTarget) {
                        state.period = Math.min(state.slideTarget, state.period + state.slideSpeed);
                    } else if (state.period > state.slideTarget) {
                        state.period = Math.max(state.slideTarget, state.period - state.slideSpeed);
                    }
                    state.sampleRate = this.periodToRate(state.period);
                }
            }
            
            // Effect 4: Vibrato (4xy)
            // Only process on ticks 1+, not on tick 0
            else if (effect === 0x4 && this.tickCounter > 0) {
                if (param > 0) {
                    const speed = (param >> 4) & 0xF;
                    const depth = param & 0xF;
                    if (speed > 0) state.vibratoSpeed = speed;
                    if (depth > 0) state.vibratoDepth = depth;
                }
                
                // Use ProTracker's authentic vibrato table
                const tablePos = (state.vibratoPos >> 2) & 0x1F;  // vibratoPos is 0-255, table is 0-31
                const tableValue = VIBRATO_TABLE[tablePos];  // 0-255
                
                // Calculate vibrato delta
                // tableValue ranges 0-255, centered at 127.5
                // We need to make it signed: -128 to +127
                const signedValue = tableValue - 128;
                const delta = (signedValue * state.vibratoDepth) >> 7;  // Divide by 128 (right shift 7)
                
                state.vibratoPos = (state.vibratoPos + (state.vibratoSpeed * 4)) & 0xFF;
                
                const vibratoPeriod = Math.max(113, Math.min(856, state.period + delta));
                state.sampleRate = this.periodToRate(vibratoPeriod);
            }
            
            // Effect 5: Tone Portamento + Volume Slide (5xy)
            // Only process on ticks 1+, not on tick 0
            else if (effect === 0x5 && this.tickCounter > 0) {
                // Do tone portamento
                if (state.slideTarget > 0) {
                    if (state.period < state.slideTarget) {
                        state.period = Math.min(state.slideTarget, state.period + state.slideSpeed);
                    } else if (state.period > state.slideTarget) {
                        state.period = Math.max(state.slideTarget, state.period - state.slideSpeed);
                    }
                    state.sampleRate = this.periodToRate(state.period);
                }
                
                // Do volume slide
                const up = (param >> 4) & 0xF;
                const down = param & 0xF;
                if (up > 0) {
                    state.volume = Math.min(64, state.volume + up);
                } else if (down > 0) {
                    state.volume = Math.max(0, state.volume - down);
                }
            }
            
            // Effect 6: Vibrato + Volume Slide (6xy)
            // Only process on ticks 1+, not on tick 0
            else if (effect === 0x6 && this.tickCounter > 0) {
                // Do vibrato using ProTracker table
                const tablePos = (state.vibratoPos >> 2) & 0x1F;
                const tableValue = VIBRATO_TABLE[tablePos];
                const signedValue = tableValue - 128;
                const delta = (signedValue * state.vibratoDepth) >> 7;
                
                state.vibratoPos = (state.vibratoPos + (state.vibratoSpeed * 4)) & 0xFF;
                
                const vibratoPeriod = Math.max(113, Math.min(856, state.period + delta));
                state.sampleRate = this.periodToRate(vibratoPeriod);
                
                // Do volume slide
                const up = (param >> 4) & 0xF;
                const down = param & 0xF;
                if (up > 0) {
                    state.volume = Math.min(64, state.volume + up);
                } else if (down > 0) {
                    state.volume = Math.max(0, state.volume - down);
                }
            }
            
            // Effect 7: Tremolo (7xy)
            // Only process on ticks 1+, not on tick 0
            else if (effect === 0x7 && this.tickCounter > 0) {
                if (param > 0) {
                    const speed = (param >> 4) & 0xF;
                    const depth = param & 0xF;
                    if (speed > 0) state.tremoloSpeed = speed;
                    if (depth > 0) state.tremoloDepth = depth;
                }
                
                const delta = Math.sin(state.tremoloPos * Math.PI / 32) * state.tremoloDepth;
                state.tremoloPos = (state.tremoloPos + state.tremoloSpeed) & 63;
                
                // Tremolo modulates volume, applied in getChannelSample
                state.tremoloValue = delta;
            }
            
            // Effect A: Volume Slide (Axy)
            // Only process on ticks 1+, not on tick 0
            else if (effect === 0xA && this.tickCounter > 0) {
                const up = (param >> 4) & 0xF;
                const down = param & 0xF;
                if (up > 0) {
                    state.volume = Math.min(64, state.volume + up);
                } else if (down > 0) {
                    state.volume = Math.max(0, state.volume - down);
                }
            }
            
            // Effect E: Extended commands (tick-based)
            else if (effect === 0xE) {
                const extCmd = (param >> 4) & 0xF;
                const extParam = param & 0xF;
                
                // E9x: Retrigger Note
                if (extCmd === 0x9 && extParam > 0) {
                    if (this.tickCounter % extParam === 0) {
                        state.samplePos = 0;
                    }
                }
                // ECx: Note Cut
                else if (extCmd === 0xC) {
                    if (this.tickCounter === extParam) {
                        state.volume = 0;
                    }
                }
                // EDx: Note Delay - handled in processRow and processEffects
            }
        }
    }
    
    /**
     * Apply arpeggio semitone shift to period
     */
    /**
     * Apply finetune to a base period
     * @param {number} basePeriod - Base period (finetune 0)
     * @param {number} finetune - Finetune value (-8 to +7)
     * @returns {number} Finetuned period
     */
    applyFinetune(basePeriod, finetune) {
        // Find which note this period belongs to
        for (let i = 0; i < PERIOD_TABLE_WITH_FINETUNE.length; i++) {
            if (PERIOD_TABLE_WITH_FINETUNE[i].period === basePeriod) {
                // Found exact match - return finetuned period
                const tuneIndex = Math.max(0, Math.min(15, finetune + 8));
                return PERIOD_TABLE_WITH_FINETUNE[i].tune[tuneIndex];
            }
        }
        
        // No exact match found - period might already be finetuned or out of range
        return basePeriod;
    }
    
    /**
     * Apply arpeggio effect with finetune support
     * @param {number} basePeriod - Current period (already finetuned if instrument has finetune)
     * @param {number} semitones - Semitones to shift (0-15)
     * @param {number} finetune - Finetune value (-8 to +7)
     * @returns {number} Target period
     */
    applyArpeggio(basePeriod, semitones, finetune = 0) {
        // Convert finetune to tune array index (finetune -8 to +7 maps to index 0 to 15)
        const tuneIndex = Math.max(0, Math.min(15, finetune + 8));
        
        // Find which note this period belongs to
        // We need to find the EXACT match in the tune table for the current finetune
        let noteIndex = -1;
        
        for (let i = 0; i < PERIOD_TABLE_WITH_FINETUNE.length; i++) {
            const note = PERIOD_TABLE_WITH_FINETUNE[i];
            // Check if this period matches the finetuned value for this note
            if (note.tune[tuneIndex] === basePeriod) {
                noteIndex = i;
                break;
            }
        }
        
        // If no exact match, try to find closest match
        if (noteIndex === -1) {
            let minDiff = Infinity;
            for (let i = 0; i < PERIOD_TABLE_WITH_FINETUNE.length; i++) {
                const note = PERIOD_TABLE_WITH_FINETUNE[i];
                const finetuned = note.tune[tuneIndex];
                const diff = Math.abs(finetuned - basePeriod);
                if (diff < minDiff) {
                    minDiff = diff;
                    noteIndex = i;
                }
            }
        }
        
        if (noteIndex === -1) {
            return basePeriod; // Fallback
        }
        
        // Apply semitone shift (subtract because lower index = higher pitch)
        const targetIndex = Math.max(0, Math.min(PERIOD_TABLE_WITH_FINETUNE.length - 1, noteIndex - semitones));
        
        // Return the finetuned period for the target note
        return PERIOD_TABLE_WITH_FINETUNE[targetIndex].tune[tuneIndex];
    }
    
    /**
     * Mix audio for the given number of frames
     * Returns stereo samples [L, R, L, R, ...]
     * This is the ONLY method that generates audio samples
     */
    mixAudio(numFrames) {
        const output = new Float32Array(numFrames * 2);  // Stereo
        
        if (!this.isPlaying || !this.song) {
            return output;  // Silence
        }
        
        for (let frame = 0; frame < numFrames; frame++) {
            // Process ticks
            if (this.sampleCounter >= this.samplesPerTick) {
                this.sampleCounter -= this.samplesPerTick;
                this.processTick();
            }
            this.sampleCounter++;
            
            // Mix all channels
            let left = 0;
            let right = 0;
            
            for (let ch = 0; ch < 4; ch++) {
                if (this.mutedChannels[ch]) continue;
                
                const sample = this.getChannelSample(ch);
                
                // Amiga stereo panning: channels 0,3 left, 1,2 right
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
    
    /**
     * Get sample from a single channel
     */
    getChannelSample(ch) {
        const state = this.channelStates[ch];
        
        if (state.period === 0 || state.instrument === 0) {
            return 0;
        }
        
        const inst = this.song.getInstrument(state.instrument);
        if (!inst || inst.isEmpty()) {
            return 0;
        }
        
        // Get current sample with LINEAR INTERPOLATION
        // This prevents clicks/crackles when pitch changes rapidly (arpeggio, vibrato)
        const pos = state.samplePos;
        const intPos = Math.floor(pos);
        const frac = pos - intPos;  // Fractional part for interpolation
        
        // Check bounds and handle looping
        let pos1 = intPos;
        let pos2 = intPos + 1;
        
        if (pos1 >= inst.length) {
            // Handle loop
            if (inst.hasLoop()) {
                const loopPos = (pos1 - inst.repeatStart) % inst.repeatLength;
                pos1 = inst.repeatStart + loopPos;
                pos2 = pos1 + 1;
                if (pos2 >= inst.repeatStart + inst.repeatLength) {
                    pos2 = inst.repeatStart;
                }
            } else {
                return 0;  // No loop, silence
            }
        } else if (pos2 >= inst.length) {
            // Next sample wraps to loop
            if (inst.hasLoop()) {
                pos2 = inst.repeatStart;
            } else {
                pos2 = pos1;  // Clamp to last sample
            }
        }
        
        // Linear interpolation between two samples
        const sample1 = inst.sampleData[pos1] || 0;
        const sample2 = inst.sampleData[pos2] || 0;
        const sample = sample1 + (sample2 - sample1) * frac;
        
        // Advance position
        state.samplePos += state.sampleRate;
        
        // Apply tremolo (volume modulation)
        let volume = state.volume;
        if (state.tremoloValue !== undefined) {
            volume = Math.max(0, Math.min(64, volume + state.tremoloValue));
        }
        
        // Update VU meter with peak tracking and decay
        const currentLevel = Math.abs(sample) * (volume / 64);
        
        // If new level is higher than current peak, update peak
        if (currentLevel > this.vuPeaks[ch]) {
            this.vuPeaks[ch] = currentLevel;
        } else {
            // Otherwise, let the peak decay slowly
            this.vuPeaks[ch] *= this.vuDecay;
        }
        
        // Convert peak to 0-64 range for display (scaled from 0-1 sample range)
        this.vuLevels[ch] = Math.min(64, this.vuPeaks[ch] * 64);
        
        // Apply volume
        return sample * (volume / 64);
    }
    
    /**
     * Toggle channel mute
     */
    toggleMute(channel) {
        this.mutedChannels[channel] = !this.mutedChannels[channel];
    }
}
