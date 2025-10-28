/**
 * Web Audio Platform Adapter for TinyTracker
 */

import { TinyEngine } from '../engine/audio-engine.js';

export class WebAudioAdapter {
    constructor() {
        this.audioContext = null;
        this.engine = null;
        this.scriptNode = null;
        this.isInitialized = false;
    }
    
    async init() {
        if (this.isInitialized) return;
        
        // Create AudioContext on first user interaction
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create engine with browser's native sample rate
        this.engine = new TinyEngine(this.audioContext.sampleRate);
        
        // Create ScriptProcessorNode
        const bufferSize = 4096;
        this.scriptNode = this.audioContext.createScriptProcessor(bufferSize, 0, 2);
        
        this.scriptNode.onaudioprocess = (e) => {
            const outputL = e.outputBuffer.getChannelData(0);
            const outputR = e.outputBuffer.getChannelData(1);
            const numFrames = outputL.length;
            
            const mixed = this.engine.mixAudio(numFrames);
            
            for (let i = 0; i < numFrames; i++) {
                outputL[i] = mixed[i * 2 + 0];
                outputR[i] = mixed[i * 2 + 1];
            }
        };
        
        this.scriptNode.connect(this.audioContext.destination);
        
        this.isInitialized = true;
        console.log('TinyTracker initialized at', this.audioContext.sampleRate, 'Hz');
    }
    
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    play(position = 0, startRow = 0) {
        this.resume();
        this.engine.play(position, startRow);
    }
    
    stop() {
        this.engine.stop();
    }
    
    getState() {
        return this.engine.getState();
    }
    
    setSong(song) {
        this.engine.setSong(song);
    }
    
    toggleMute(channel) {
        this.engine.toggleMute(channel);
    }
    
    getEngine() {
        return this.engine;
    }
}
