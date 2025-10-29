/**
 * TinyTracker Main Application
 * Simplified chip-tune tracker with immediate mode UI
 */

import { TinySong } from '../engine/audio-engine.js';
import { WebAudioAdapter } from '../platform/audio-web.js';
import { UI } from './ui.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './inputhandler.js';
import { Clipboard } from './clipboard.js';
import { saveTNY, loadTNY } from './data.js';

class TinyTracker {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ui = new UI(this.canvas);
        this.renderer = new Renderer(this.ui);
        this.clipboard = new Clipboard();
        
        // State
        this.state = {
            song: new TinySong(),
            audio: null,
            playing: false,
            editMode: true,
            showHelp: false,
            patternLoopMode: true,
            followPlayback: false,
            currentPosition: 0,
            currentRow: 0,
            playingRow: 0,
            currentChannel: 0,
            currentInstrument: 0,
            cursorColumn: 0,  // 0=note, 1=instrument, 2=effect
            effectInputPos: 0, // 0=effect type, 1=param high, 2=param low
            effectParam: 0x10, // Default effect parameter value
            mutedChannels: [false, false, false, false]
        };
        
        // Set up some default instruments
        this.setupDefaultInstruments();
        
        this.inputHandler = new InputHandler(this.state, this.clipboard);
        
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
        // Preset 0 - Square lead
        this.state.song.instruments[0].attack = 0.01;
        this.state.song.instruments[0].decay = 0.1;
        this.state.song.instruments[0].sustain = 0.7;
        this.state.song.instruments[0].release = 0.2;
        this.state.song.instruments[0].dutyCycle = 0.5;
        
        // Preset 1 - Sawtooth bass
        this.state.song.instruments[1].attack = 0.005;
        this.state.song.instruments[1].decay = 0.05;
        this.state.song.instruments[1].sustain = 0.8;
        this.state.song.instruments[1].release = 0.1;
        
        // Preset 2 - Sine pad
        this.state.song.instruments[2].attack = 0.1;
        this.state.song.instruments[2].decay = 0.2;
        this.state.song.instruments[2].sustain = 0.6;
        this.state.song.instruments[2].release = 0.3;
        
        // Preset 3 - Noise hihat
        this.state.song.instruments[3].attack = 0.001;
        this.state.song.instruments[3].decay = 0.05;
        this.state.song.instruments[3].sustain = 0.1;
        this.state.song.instruments[3].release = 0.05;
        
        // Preset 4 - Square short
        this.state.song.instruments[4].attack = 0.001;
        this.state.song.instruments[4].decay = 0.05;
        this.state.song.instruments[4].sustain = 0.3;
        this.state.song.instruments[4].release = 0.1;
        this.state.song.instruments[4].dutyCycle = 0.25;
        
        // Preset 5 - Saw lead
        this.state.song.instruments[5].attack = 0.01;
        this.state.song.instruments[5].decay = 0.15;
        this.state.song.instruments[5].sustain = 0.5;
        this.state.song.instruments[5].release = 0.2;
        
        // Preset 6 - Sine bass
        this.state.song.instruments[6].attack = 0.001;
        this.state.song.instruments[6].decay = 0.1;
        this.state.song.instruments[6].sustain = 0.7;
        this.state.song.instruments[6].release = 0.15;
        
        // Preset 7 - Noise drum
        this.state.song.instruments[7].attack = 0.001;
        this.state.song.instruments[7].decay = 0.1;
        this.state.song.instruments[7].sustain = 0.0;
        this.state.song.instruments[7].release = 0.05;
    }
    
    render() {
        if (!this.running) return;
        
        // Auto-set edit mode: enabled when not playing in song mode, or when in pattern loop mode
        this.state.editMode = !this.state.playing || this.state.patternLoopMode;
        
        // Update playback state
        if (this.state.playing && this.state.audio) {
            const audioState = this.state.audio.getState();
            this.state.currentPosition = audioState.position;
            this.state.playingRow = audioState.row;
            
            // Follow playback if enabled
            if (this.state.followPlayback) {
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
        } else if (action === 'togglePatternLoop') {
            this.state.patternLoopMode = !this.state.patternLoopMode;
            // Update audio engine loop state if already playing
            if (this.state.playing && this.state.audio) {
                this.state.audio.getEngine().setPatternLoop(this.state.patternLoopMode);
            }
        } else if (action === 'toggleFollow') {
            this.state.followPlayback = !this.state.followPlayback;
        } else if (action === 'insertPosition') {
            // Insert new position after current
            if (this.state.song.songLength < 256) {
                this.state.song.patternOrder.splice(this.state.currentPosition + 1, 0, 0);
                this.state.song.songLength++;
                this.state.currentPosition++;
            }
        } else if (action === 'deletePosition') {
            // Delete current position (keep at least 1)
            if (this.state.song.songLength > 1) {
                this.state.song.patternOrder.splice(this.state.currentPosition, 1);
                this.state.song.songLength--;
                this.state.currentPosition = Math.min(this.state.currentPosition, this.state.song.songLength - 1);
            }
        } else if (action === 'scrollSeqUp') {
            // Scroll sequencer up (only when not playing)
            if (!this.state.playing) {
                this.state.currentPosition = Math.max(0, this.state.currentPosition - 1);
            }
        } else if (action === 'scrollSeqDown') {
            // Scroll sequencer down (only when not playing)
            if (!this.state.playing) {
                this.state.currentPosition = Math.min(this.state.song.songLength - 1, this.state.currentPosition + 1);
            }
        } else if (action === 'scrollPatternUp') {
            // Scroll pattern grid up
            this.state.currentRow = Math.max(0, this.state.currentRow - 1);
        } else if (action === 'scrollPatternDown') {
            // Scroll pattern grid down
            this.state.currentRow = Math.min(31, this.state.currentRow + 1);
        } else if (action === 'saveSong') {
            // Save current song as .tny file (with save-as dialog)
            saveTNY(this.state.song).catch(error => {
                console.error('Error saving song:', error);
            });
        } else if (action === 'loadSong') {
            // Load .tny file
            loadTNY().then(song => {
                this.state.song = song;
                this.state.currentPosition = 0;
                this.state.currentRow = 0;
                if (this.state.audio) {
                    this.state.audio.setSong(song);
                }
                // Force a re-render
                requestAnimationFrame(() => this.render());
            }).catch(error => {
                console.error('Error loading song:', error);
            });
        } else if (action && typeof action === 'string' && action.startsWith('toggleMute_')) {
            // Toggle mute for a specific channel
            const channel = parseInt(action.split('_')[1]);
            if (channel >= 0 && channel < 4) {
                this.state.mutedChannels[channel] = !this.state.mutedChannels[channel];
                // Update audio engine mute state
                if (this.state.audio) {
                    const engine = this.state.audio.getEngine();
                    engine.channels[channel].muted = this.state.mutedChannels[channel];
                }
            }
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
