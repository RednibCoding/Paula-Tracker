/**
 * Web Audio API Adapter
 * Connects PaulaEngine to browser audio output
 */

import { PaulaEngine } from '../../paulalib/audio-engine.js';

export class WebAudioAdapter {
    constructor() {
        // Don't create PaulaEngine yet - we need AudioContext's sample rate first
        this.engine = null;
        this.audioContext = null;
        this.scriptNode = null;
        this.isInitialized = false;
    }
    
    /**
     * Initialize Web Audio API
     * Must be called after user interaction (browser requirement)
     */
    init() {
        if (this.isInitialized) return;
        
        // Create AudioContext first to get browser's native sample rate
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Now create PaulaEngine with the correct sample rate
        this.engine = new PaulaEngine(this.audioContext.sampleRate);
        
        console.log('Audio initialized at', this.audioContext.sampleRate, 'Hz');
        
        // Create script processor (legacy but works everywhere)
        const bufferSize = 4096;
        this.scriptNode = this.audioContext.createScriptProcessor(bufferSize, 0, 2);
        
        this.scriptNode.onaudioprocess = (e) => {
            const outputL = e.outputBuffer.getChannelData(0);
            const outputR = e.outputBuffer.getChannelData(1);
            
            // Get mixed audio from engine
            const mixed = this.engine.mixAudio(bufferSize);
            
            // Deinterleave stereo samples
            for (let i = 0; i < bufferSize; i++) {
                outputL[i] = mixed[i * 2 + 0];
                outputR[i] = mixed[i * 2 + 1];
            }
        };
        
        this.scriptNode.connect(this.audioContext.destination);
        this.isInitialized = true;
    }
    
    /**
     * Resume audio context (required after page load in some browsers)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    /**
     * Set the song to play
     */
    setSong(song) {
        this.engine.setSong(song);
    }
    
    /**
     * Start playback
     */
    play(position = 0) {
        this.resume();
        this.engine.play(position);
    }
    
    /**
     * Stop playback
     */
    stop() {
        this.engine.stop();
    }
    
    /**
     * Get current playback state
     */
    getState() {
        return this.engine.getState();
    }
    
    /**
     * Get note name from period
     */
    periodToNoteName(period) {
        return this.engine.periodToNoteName(period);
    }
    
    /**
     * Toggle channel mute
     */
    toggleMute(channel) {
        this.engine.toggleMute(channel);
    }
    
    /**
     * Toggle channel mute (alias for compatibility)
     */
    toggleChannelMute(channel) {
        this.engine.toggleMute(channel);
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.scriptNode) {
            this.scriptNode.disconnect();
            this.scriptNode = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isInitialized = false;
    }
}
