/**
 * Sample loader for importing WAV files as instruments
 */

export class SampleLoader {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    /**
     * Load WAV file and convert to instrument format
     * @param {File} file - WAV file
     * @returns {Promise<Object>} Instrument data
     */
    async loadWAV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    
                    // Decode audio file
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    
                    // Convert to instrument format
                    const instrument = this.audioBufferToInstrument(audioBuffer, file.name);
                    
                    resolve(instrument);
                } catch (error) {
                    reject(new Error(`Failed to decode WAV file: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * Convert AudioBuffer to Instrument format
     * @param {AudioBuffer} audioBuffer - Decoded audio
     * @param {string} filename - Original filename
     * @returns {Object} Instrument data
     */
    audioBufferToInstrument(audioBuffer, filename) {
        // Get first channel (convert stereo to mono by taking left channel)
        const channelData = audioBuffer.getChannelData(0);
        
        // Create Float32Array copy
        const sampleData = new Float32Array(channelData.length);
        sampleData.set(channelData);
        
        // Extract name from filename (without extension)
        const name = filename.replace(/\.[^/.]+$/, '').substring(0, 22);
        
        // Calculate length in samples (MOD format stores in words, so divide by 2)
        const length = Math.floor(sampleData.length / 2);
        
        // Default values for new samples
        const instrument = {
            name: name,
            length: Math.min(length, 65535), // MOD format max length
            finetune: 0,
            volume: 64, // Default volume
            repeatStart: 0,
            repeatLength: 1, // 1 = no loop (MOD convention)
            sampleData: sampleData,
            sampleRate: audioBuffer.sampleRate,
            isEmpty: function() {
                return this.length === 0 || !this.sampleData || this.sampleData.length === 0;
            },
            hasLoop: function() {
                return this.repeatLength > 1;
            }
        };
        
        return instrument;
    }
    
    /**
     * Detect if sample should loop (heuristic based on length and content)
     * @param {Float32Array} sampleData - Sample data
     * @returns {boolean} True if sample appears to be a loop
     */
    detectLoop(sampleData) {
        // Short samples (< 0.5 seconds at 8363 Hz) are likely loops
        if (sampleData.length < 4181) {
            return true;
        }
        
        // Check if sample fades to near-silence at end (not a loop)
        const lastSamples = sampleData.slice(-100);
        const avgAmplitude = lastSamples.reduce((sum, val) => sum + Math.abs(val), 0) / lastSamples.length;
        
        if (avgAmplitude < 0.01) {
            return false; // Fades out, probably not a loop
        }
        
        return false; // Default to no loop for safety
    }
    
    /**
     * Resample audio data to target sample rate
     * @param {Float32Array} input - Input sample data
     * @param {number} inputRate - Input sample rate
     * @param {number} outputRate - Target sample rate
     * @returns {Float32Array} Resampled data
     */
    resample(input, inputRate, outputRate) {
        if (inputRate === outputRate) {
            return input;
        }
        
        const ratio = inputRate / outputRate;
        const outputLength = Math.floor(input.length / ratio);
        const output = new Float32Array(outputLength);
        
        for (let i = 0; i < outputLength; i++) {
            const srcIndex = i * ratio;
            const srcIndexFloor = Math.floor(srcIndex);
            const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
            const fraction = srcIndex - srcIndexFloor;
            
            // Linear interpolation
            output[i] = input[srcIndexFloor] * (1 - fraction) + 
                       input[srcIndexCeil] * fraction;
        }
        
        return output;
    }
    
    // Export instrument as WAV file
    exportWAV(instrument, filename = 'instrument.wav') {
        if (instrument.isEmpty()) {
            console.error('Cannot export empty instrument');
            return;
        }
        
        const sampleData = instrument.sampleData;
        const sampleRate = instrument.sampleRate || 8363; // Default Amiga sample rate
        const numSamples = sampleData.length;
        
        // WAV file structure:
        // RIFF header (12 bytes) + fmt chunk (24 bytes) + data chunk (8 bytes + samples)
        const bytesPerSample = 2; // 16-bit
        const numChannels = 1; // Mono
        const byteRate = sampleRate * numChannels * bytesPerSample;
        const blockAlign = numChannels * bytesPerSample;
        const dataSize = numSamples * bytesPerSample;
        const fileSize = 44 + dataSize;
        
        // Create buffer for WAV file
        const buffer = new ArrayBuffer(fileSize);
        const view = new DataView(buffer);
        
        // RIFF chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, fileSize - 8, true); // File size - 8
        this.writeString(view, 8, 'WAVE');
        
        // fmt sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
        view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true); // BitsPerSample
        
        // data sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);
        
        // Write sample data (convert Float32 to Int16)
        let offset = 44;
        for (let i = 0; i < numSamples; i++) {
            const sample = Math.max(-1, Math.min(1, sampleData[i])); // Clamp to [-1, 1]
            const int16 = Math.floor(sample * 32767); // Convert to 16-bit integer
            view.setInt16(offset, int16, true);
            offset += 2;
        }
        
        // Create blob and trigger download
        const blob = new Blob([buffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}
