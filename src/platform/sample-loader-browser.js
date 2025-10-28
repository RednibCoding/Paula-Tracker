/**
 * Browser Sample Loader
 * Handles loading audio samples using Web Audio API
 */

import { decodeWAV, audioToInstrument } from '../../paulalib/sampleutils.js';

export class BrowserSampleLoader {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    /**
     * Load WAV file from File object
     * @param {File} file - Audio file
     * @returns {Promise<Instrument>}
     */
    async loadWAV(file) {
        const arrayBuffer = await file.arrayBuffer();
        const { sampleData, sampleRate, name } = decodeWAV(arrayBuffer, file.name);
        return audioToInstrument(sampleData, sampleRate, name);
    }
    
    /**
     * Load any audio file using Web Audio API
     * @param {File} file - Audio file (MP3, OGG, WAV, etc.)
     * @returns {Promise<Instrument>}
     */
    async loadAudio(file) {
        const arrayBuffer = await file.arrayBuffer();
        
        // Try WAV decoder first (faster, doesn't need audio context)
        if (file.name.toLowerCase().endsWith('.wav')) {
            try {
                const { sampleData, sampleRate, name } = decodeWAV(arrayBuffer, file.name);
                return audioToInstrument(sampleData, sampleRate, name);
            } catch (err) {
                console.warn('WAV decode failed, falling back to Web Audio:', err);
            }
        }
        
        // Use Web Audio API for other formats
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);
        const sampleData = new Float32Array(channelData);
        const name = file.name.replace(/\.[^/.]+$/, '');
        
        return audioToInstrument(sampleData, audioBuffer.sampleRate, name);
    }
    
    /**
     * Export instrument as WAV file
     * @param {Instrument} instrument - Instrument to export
     * @param {string} filename - Output filename
     */
    async exportWAV(instrument, filename = 'instrument.wav') {
        if (instrument.isEmpty()) {
            console.error('Cannot export empty instrument');
            return;
        }
        
        const { encodeWAV } = await import('../../paulalib/sampleutils.js');
        const wavData = encodeWAV(instrument.sampleData, instrument.sampleRate || 8363);
        
        const blob = new Blob([wavData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Create file input for loading samples
     * @param {Function} onLoad - Callback with loaded Instrument
     */
    createFileInput(onLoad) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*,.wav,.mp3,.ogg,.flac';
        input.style.display = 'none';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const instrument = await this.loadAudio(file);
                    onLoad(instrument, file.name);
                } catch (err) {
                    console.error('Failed to load sample:', err);
                }
            }
        });
        
        document.body.appendChild(input);
        return input;
    }
}
