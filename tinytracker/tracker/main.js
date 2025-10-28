/**
 * TinyTracker Main Application
 * Simplified chip-tune tracker with immediate mode UI
 */

import { TinySong } from '../engine/audio-engine.js';
import { WebAudioAdapter } from '../platform/audio-web.js';
import { UI } from './ui.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './inputhandler.js';

class TinyTracker {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ui = new UI(this.canvas);
        this.renderer = new Renderer(this.ui);
        
        // State
        this.state = {
            song: new TinySong(),
            audio: null,
            playing: false,
            editMode: true,
            showHelp: false,
            patternLoopMode: false,
            followPlayback: true,
            currentPosition: 0,
            currentRow: 0,
            playingRow: 0,
            currentChannel: 0,
            currentInstrument: 0,
            cursorColumn: 0,  // 0=note, 1=instrument, 2=effect
            effectInputPos: 0, // 0=effect type, 1=param high, 2=param low
            mutedChannels: [false, false, false, false]
        };
        
        // Set up some default instruments
        this.setupDefaultInstruments();
        
        this.inputHandler = new InputHandler(this.state);
        
        // Initialize audio
        this.initAudio();
        
        // Start render loop
        this.running = true;
        requestAnimationFrame(() => this.render());
    }
    
    async initAudio() {
        this.state.audio = new WebAudioAdapter();
        await this.state.audio.init();
        this.state.audio.setSong(this.state.song);
    }
    
    setupDefaultInstruments() {
        // Square wave instrument
        this.state.song.instruments[0].name = 'Square Lead';
        this.state.song.instruments[0].attack = 0.01;
        this.state.song.instruments[0].decay = 0.1;
        this.state.song.instruments[0].sustain = 0.7;
        this.state.song.instruments[0].release = 0.2;
        this.state.song.instruments[0].dutyCycle = 0.5;
        
        // Sawtooth bass
        this.state.song.instruments[1].name = 'Saw Bass';
        this.state.song.instruments[1].attack = 0.005;
        this.state.song.instruments[1].decay = 0.05;
        this.state.song.instruments[1].sustain = 0.8;
        this.state.song.instruments[1].release = 0.1;
        
        // Sine pad
        this.state.song.instruments[2].name = 'Sine Pad';
        this.state.song.instruments[2].attack = 0.1;
        this.state.song.instruments[2].decay = 0.2;
        this.state.song.instruments[2].sustain = 0.6;
        this.state.song.instruments[2].release = 0.3;
        
        // Noise hihat
        this.state.song.instruments[3].name = 'Noise Hit';
        this.state.song.instruments[3].attack = 0.001;
        this.state.song.instruments[3].decay = 0.05;
        this.state.song.instruments[3].sustain = 0.1;
        this.state.song.instruments[3].release = 0.05;
        
        // Square short
        this.state.song.instruments[4].name = 'Square Short';
        this.state.song.instruments[4].attack = 0.001;
        this.state.song.instruments[4].decay = 0.05;
        this.state.song.instruments[4].sustain = 0.3;
        this.state.song.instruments[4].release = 0.1;
        this.state.song.instruments[4].dutyCycle = 0.25;
        
        // Saw lead
        this.state.song.instruments[5].name = 'Saw Lead';
        this.state.song.instruments[5].attack = 0.01;
        this.state.song.instruments[5].decay = 0.15;
        this.state.song.instruments[5].sustain = 0.5;
        this.state.song.instruments[5].release = 0.2;
        
        // Sine bass
        this.state.song.instruments[6].name = 'Sine Bass';
        this.state.song.instruments[6].attack = 0.001;
        this.state.song.instruments[6].decay = 0.1;
        this.state.song.instruments[6].sustain = 0.7;
        this.state.song.instruments[6].release = 0.15;
        
        // Noise drum
        this.state.song.instruments[7].name = 'Noise Drum';
        this.state.song.instruments[7].attack = 0.001;
        this.state.song.instruments[7].decay = 0.1;
        this.state.song.instruments[7].sustain = 0.0;
        this.state.song.instruments[7].release = 0.05;
    }
    
    render() {
        if (!this.running) return;
        
        // Update playback state
        if (this.state.playing && this.state.audio) {
            const audioState = this.state.audio.getState();
            this.state.currentPosition = audioState.position;
            this.state.playingRow = audioState.row;
            
            // Follow playback if enabled (but don't move the cursor in edit mode)
            if (this.state.followPlayback && !this.state.editMode) {
                this.state.currentRow = this.state.playingRow;
            }
        }
        
        // Handle UI interactions
        const action = this.renderer.draw(this.state);
        
        if (action === 'togglePlay') {
            if (this.state.playing) {
                this.state.audio.stop();
                this.state.playing = false;
            } else {
                // Start playback
                if (this.state.patternLoopMode) {
                    // Pattern loop: play from current row, loop current pattern
                    this.state.audio.getEngine().setPatternLoop(true);
                    this.state.audio.play(this.state.currentPosition, this.state.currentRow);
                } else {
                    // Normal playback: play from current position
                    this.state.audio.getEngine().setPatternLoop(false);
                    this.state.audio.play(this.state.currentPosition, this.state.currentRow);
                }
                this.state.playing = true;
            }
        } else if (action === 'toggleEdit') {
            this.state.editMode = !this.state.editMode;
        } else if (action === 'togglePatternLoop') {
            this.state.patternLoopMode = !this.state.patternLoopMode;
        } else if (action === 'toggleFollow') {
            this.state.followPlayback = !this.state.followPlayback;
        }
        
        // Update UI state
        this.ui.update();
        
        requestAnimationFrame(() => this.render());
    }
    
    stop() {
        this.running = false;
        if (this.state.audio) {
            this.state.audio.stop();
        }
    }
}

// Start the tracker when page loads
window.addEventListener('load', () => {
    const tracker = new TinyTracker();
    window.tracker = tracker;
});
