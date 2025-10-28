/**
 * Audio Engine for Paula Tracker
 * Emulates Amiga Paula chip behavior
 */


// Amiga period table (C-1 to B-3)
export const PERIOD_TABLE = {
    856:1,884:1,936:1,990:1,1046:1,1108:1,1176:1,1246:1,1318:1,1394:1,1474:1,1558:1,
    428:2,442:2,468:2,495:2,523:2,554:2,588:2,623:2,659:2,697:2,737:2,779:2,
    214:3,221:3,234:3,248:3,262:3,277:3,294:3,312:3,330:3,349:3,369:3,390:3,
};

// Note names for display
export const NOTE_NAMES = [
    'C-1','C#1','D-1','D#1','E-1','F-1','F#1','G-1','G#1','A-1','A#1','B-1',
    'C-2','C#2','D-2','D#2','E-2','F-2','F#2','G-2','G#2','A-2','A#2','B-2',
    'C-3','C#3','D-3','D#3','E-3','F-3','F#3','G-3','G#3','A-3','A#3','B-3',
];

// Period to note name lookup
const PERIOD_TO_NOTE = {
    856:'C-1',808:'C#1',762:'D-1',720:'D#1',678:'E-1',640:'F-1',
    604:'F#1',570:'G-1',538:'G#1',508:'A-1',480:'A#1',453:'B-1',
    428:'C-2',404:'C#2',381:'D-2',360:'D#2',339:'E-2',320:'F-2',
    302:'F#2',285:'G-2',269:'G#2',254:'A-2',240:'A#2',226:'B-2',
    214:'C-3',202:'C#3',190:'D-3',180:'D#3',170:'E-3',160:'F-3',
    151:'F#3',143:'G-3',135:'G#3',127:'A-3',120:'A#3',113:'B-3',
};

export class AudioEngine {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.channels = [];
        this.isPlaying = false;
        
        // Playback state
        this.currentPosition = 0;
        this.currentRow = 0;
        this.playingRow = 0;  // The row currently being played (for display)
        this.tempo = 6;         // Ticks per row
        this.bpm = 125;         // Beats per minute
        this.tickCounter = 0;
        this.tickTime = 0;
        this.nextTickTime = 0;
        
        // Channel state (4 channels)
        this.channelStates = [];
        this.vuLevels = [0, 0, 0, 0]; // VU meter levels (0-64)
        for (let i = 0; i < 4; i++) {
            this.channelStates.push({
                period: 0,
                instrument: 0,
                volume: 64,
                effect: 0,
                param: 0,
                source: null,
                gainNode: null,
                panNode: null,
                vibratoPos: 0,
                vibratoSpeed: 4,
                vibratoDepth: 4,
                tremoloPos: 0,
                slideTarget: 0,
                slideSpeed: 0,
                arpeggioPos: 0,
            });
        }
        
        this.song = null;
        this.timeoutId = null;
        this.patternLoopMode = false; // Loop current pattern
        this.mutedChannels = [false, false, false, false]; // Mute state for each channel
        
        // Amiga Paula frequency
        this.PAULA_FREQUENCY = 7093789.2 / 2;  // PAL
    }
    
    init() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.context.destination);
        }
        
        return this.context;
    }
    
    /**
     * Calculate sample playback rate from Amiga period
     */
    periodToRate(period) {
        if (period === 0) return 0;
        return this.PAULA_FREQUENCY / (period * this.context.sampleRate);
    }
    
    /**
     * Get note name from period
     */
    periodToNoteName(period) {
        return PERIOD_TO_NOTE[period] || '---';
    }
    
    /**
     * Play a note on a channel
     */
    playNote(channel, note, instrument) {
        const state = this.channelStates[channel];
        const instr = this.song.getInstrument(instrument);
        
        // Stop current sound
        if (state.source) {
            try {
                state.source.stop();
            } catch (e) {
                // Ignore
            }
            state.source = null;
        }
        
        // Don't play if channel is muted
        if (this.mutedChannels[channel]) {
            return;
        }
        
        // Check if instrument has sample data
        if (!instr || instr.isEmpty()) {
            return;
        }
        
        // Create audio chain
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        const panNode = this.context.createStereoPanner();
        
        // Set up buffer
        const buffer = this.context.createBuffer(
            1,
            instr.sampleData.length,
            this.context.sampleRate
        );
        buffer.copyToChannel(instr.sampleData, 0);
        source.buffer = buffer;
        
        // Set loop
        if (instr.hasLoop()) {
            source.loop = true;
            source.loopStart = instr.repeatStart / this.context.sampleRate;
            source.loopEnd = (instr.repeatStart + instr.repeatLength) / this.context.sampleRate;
        }
        
        // Set playback rate
        if (note.period > 0) {
            source.playbackRate.value = this.periodToRate(note.period);
            state.period = note.period;
        }
        
        // Set volume
        const volume = instr.volume / 64;
        gainNode.gain.value = volume;
        state.volume = instr.volume;
        
        // Update VU meter
        this.vuLevels[channel] = instr.volume;
        
        // Pan channels (Amiga stereo separation)
        // Channels 0,3 = left, 1,2 = right
        const pan = (channel === 0 || channel === 3) ? -0.7 : 0.7;
        panNode.pan.value = pan;
        
        // Connect chain
        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.masterGain);
        
        // Start playback
        source.start(this.context.currentTime);
        
        // Store state
        state.source = source;
        state.gainNode = gainNode;
        state.panNode = panNode;
        state.instrument = instrument;
    }
    
    /**
     * Process a row of pattern data
     */
    processRow(pattern, row) {
        for (let ch = 0; ch < 4; ch++) {
            const note = pattern.getNote(row, ch);
            const state = this.channelStates[ch];
            
            // Store effect for tick processing
            state.effect = note.effect;
            state.param = note.param;
            
            // Handle portamento target
            if (note.effect === 0x3 && note.period > 0) {
                state.slideTarget = note.period;
            }
            
            // Play note if period is set (but not for portamento)
            if (note.period > 0 && note.instrument > 0 && note.effect !== 0x3) {
                this.playNote(ch, note, note.instrument);
            }
            
            // Reset vibrato position on new note
            if (note.period > 0 || note.effect === 0x4) {
                if (!state.vibratoSpeed) state.vibratoSpeed = 4;
                if (!state.vibratoDepth) state.vibratoDepth = 4;
            }
            
            // Handle effects on first tick
            this.processEffect(ch, note, true);
        }
    }
    
    /**
     * Process effects (called on first tick and subsequent ticks)
     */
    processEffect(channel, note, firstTick) {
        const state = this.channelStates[channel];
        const effect = note.effect;
        const param = note.param;
        const x = (param >> 4) & 0x0F;
        const y = param & 0x0F;
        
        switch (effect) {
            case 0x0: // Arpeggio
                if (param !== 0 && state.source && state.period > 0) {
                    if (!firstTick) {
                        const step = this.tickCounter % 3;
                        let targetPeriod = state.period;
                        
                        if (step === 1) {
                            // First semitone
                            targetPeriod = this.getSemitonePeriod(state.period, -x);
                        } else if (step === 2) {
                            // Second semitone
                            targetPeriod = this.getSemitonePeriod(state.period, -y);
                        }
                        
                        if (targetPeriod > 0) {
                            state.source.playbackRate.value = this.periodToRate(targetPeriod);
                        }
                    }
                }
                break;
                
            case 0x1: // Slide up
                if (!firstTick && state.source && state.period > 0) {
                    state.period = Math.max(113, state.period - param);
                    state.source.playbackRate.value = this.periodToRate(state.period);
                }
                break;
                
            case 0x2: // Slide down
                if (!firstTick && state.source && state.period > 0) {
                    state.period = Math.min(856, state.period + param);
                    state.source.playbackRate.value = this.periodToRate(state.period);
                }
                break;
                
            case 0x3: // Tone portamento
                if (param > 0) {
                    state.slideSpeed = param;
                }
                if (!firstTick && state.source && state.slideTarget > 0) {
                    if (state.period < state.slideTarget) {
                        state.period = Math.min(state.slideTarget, state.period + state.slideSpeed);
                    } else if (state.period > state.slideTarget) {
                        state.period = Math.max(state.slideTarget, state.period - state.slideSpeed);
                    }
                    state.source.playbackRate.value = this.periodToRate(state.period);
                }
                break;
                
            case 0x4: // Vibrato
                if (x > 0 || y > 0) {
                    if (x > 0) state.vibratoSpeed = x;
                    if (y > 0) state.vibratoDepth = y;
                }
                if (!firstTick && state.source && state.period > 0) {
                    const pos = (state.vibratoPos * state.vibratoSpeed) % 64;
                    const delta = Math.sin(pos * Math.PI / 32) * state.vibratoDepth;
                    const targetPeriod = state.period + delta;
                    state.source.playbackRate.value = this.periodToRate(targetPeriod);
                    state.vibratoPos++;
                }
                break;
                
            case 0xA: // Volume slide
                if (!firstTick && state.gainNode) {
                    if (x > 0) {
                        // Slide up
                        state.volume = Math.min(64, state.volume + x);
                    } else if (y > 0) {
                        // Slide down
                        state.volume = Math.max(0, state.volume - y);
                    }
                    state.gainNode.gain.value = state.volume / 64;
                    this.vuLevels[channel] = state.volume;
                }
                break;
                
            case 0xB: // Position jump
                if (firstTick) {
                    this.currentPosition = param;
                    this.currentRow = 0;
                }
                break;
                
            case 0xC: // Set volume
                if (firstTick && state.gainNode) {
                    state.volume = Math.min(64, param);
                    state.gainNode.gain.value = state.volume / 64;
                    this.vuLevels[channel] = state.volume;
                }
                break;
                
            case 0xD: // Pattern break
                if (firstTick) {
                    this.currentRow = ((x * 10) + y) - 1; // -1 because it will increment
                    this.currentPosition++;
                }
                break;
                
            case 0xF: // Set speed/tempo
                if (firstTick) {
                    if (param < 32) {
                        this.tempo = param || 1;
                    } else {
                        this.bpm = param;
                        this.calculateTickTime();
                    }
                }
                break;
        }
    }
    
    /**
     * Get period x semitones away from current period
     */
    getSemitonePeriod(period, semitones) {
        // Simple approximation: multiply by 2^(semitones/12)
        const ratio = Math.pow(2, semitones / 12);
        return Math.round(period / ratio);
    }
    
    /**
     * Calculate tick timing
     */
    calculateTickTime() {
        // BPM to milliseconds per tick
        // (2.5 / BPM) * 1000
        this.tickTime = (2.5 / this.bpm) * 1000;
    }
    
    /**
     * Start playback
     */
    play(song, position = 0, startRow = 0) {
        this.init();
        this.song = song;
        this.currentPosition = position;
        this.currentRow = startRow;
        this.tickCounter = 0;
        this.tempo = song.tempo;
        this.bpm = song.bpm;
        this.calculateTickTime();
        this.isPlaying = true;
        
        // Start the playback loop
        this.nextTickTime = performance.now();
        this.tick();
    }
    
    /**
     * Main playback tick
     */
    tick() {
        if (!this.isPlaying) return;
        
        const now = performance.now();
        
        if (now >= this.nextTickTime) {
            if (this.tickCounter === 0) {
                // Process new row
                const pattern = this.song.getCurrentPattern(this.currentPosition);
                this.playingRow = this.currentRow;  // Store the row we're about to play
                this.processRow(pattern, this.currentRow);
                
                // Advance row
                this.currentRow++;
                if (this.currentRow >= pattern.length) {
                    this.currentRow = 0;
                    
                    // If pattern loop mode is OFF, advance to next position
                    if (!this.patternLoopMode) {
                        this.currentPosition++;
                        if (this.currentPosition >= this.song.songLength) {
                            this.currentPosition = this.song.restartPosition;
                        }
                    }
                    // If pattern loop mode is ON, stay at current position
                }
            } else {
                // Process effects on non-first ticks
                for (let ch = 0; ch < 4; ch++) {
                    const state = this.channelStates[ch];
                    if (state.effect > 0) {
                        const fakeNote = {
                            effect: state.effect,
                            param: state.param,
                            period: state.period,
                        };
                        this.processEffect(ch, fakeNote, false);
                    }
                    
                    // Update VU level from current volume if sound is playing
                    if (state.source && state.volume > 0) {
                        this.vuLevels[ch] = state.volume;
                    }
                }
            }
            
            this.tickCounter++;
            if (this.tickCounter >= this.tempo) {
                this.tickCounter = 0;
            }
            
            // Decay VU meters slightly each tick (but not too fast)
            for (let i = 0; i < 4; i++) {
                if (!this.channelStates[i].source) {
                    // Fast decay if no sound playing
                    this.vuLevels[i] = Math.max(0, this.vuLevels[i] - 8);
                } else {
                    // Slower decay when sound is playing
                    this.vuLevels[i] = Math.max(0, this.vuLevels[i] - 2);
                }
            }
            
            this.nextTickTime += this.tickTime;
        }
        
        // Schedule next tick
        this.timeoutId = setTimeout(() => this.tick(), 1);
    }
    
    /**
     * Stop playback
     */
    stop() {
        this.isPlaying = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        // Stop all channels
        for (let i = 0; i < 4; i++) {
            const state = this.channelStates[i];
            if (state.source) {
                try {
                    state.source.stop();
                } catch (e) {
                    // Ignore
                }
                state.source = null;
            }
        }
    }
    
    /**
     * Toggle playback
     */
    togglePlay(song) {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play(song, this.currentPosition);
        }
    }
    
    /**
     * Toggle pattern loop mode
     */
    togglePatternLoop() {
        this.patternLoopMode = !this.patternLoopMode;
        return this.patternLoopMode;
    }
    
    /**
     * Toggle channel mute
     */
    toggleChannelMute(channel) {
        if (channel >= 0 && channel < 4) {
            this.mutedChannels[channel] = !this.mutedChannels[channel];
            
            // If muting, stop any currently playing sound on this channel
            if (this.mutedChannels[channel]) {
                const state = this.channelStates[channel];
                if (state.source) {
                    try {
                        state.source.stop();
                    } catch (e) {
                        // Ignore
                    }
                    state.source = null;
                }
            }
            
            return this.mutedChannels[channel];
        }
        return false;
    }
    
    /**
     * Get mute state for a channel
     */
    isChannelMuted(channel) {
        return this.mutedChannels[channel] || false;
    }
    
    /**
     * Get current playback state
     */
    getState() {
        return {
            position: this.currentPosition,
            row: this.playingRow,  // Use playingRow for display
            tempo: this.tempo,
            bpm: this.bpm,
            playing: this.isPlaying,
            patternLoop: this.patternLoopMode,
            mutedChannels: this.mutedChannels,
            vuLevels: this.vuLevels,
        };
    }
}
