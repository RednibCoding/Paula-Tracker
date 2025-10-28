/**
 * Sample processing utilities
 * Platform-independent audio sample manipulation
 * No browser or file system APIs
 */

/**
 * Decode WAV file from ArrayBuffer
 * @param {ArrayBuffer|Uint8Array} buffer - WAV file data
 * @returns {Object} {sampleData: Float32Array, sampleRate: number, name: string}
 */
export function decodeWAV(buffer, filename = 'sample') {
    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    
    // Validate RIFF header
    const riff = readString(data, 0, 4);
    if (riff !== 'RIFF') {
        throw new Error('Not a valid WAV file: missing RIFF header');
    }
    
    const wave = readString(data, 8, 4);
    if (wave !== 'WAVE') {
        throw new Error('Not a valid WAV file: missing WAVE header');
    }
    
    // Find fmt chunk
    let offset = 12;
    let sampleRate = 44100;
    let numChannels = 1;
    let bitsPerSample = 16;
    let audioFormat = 1; // PCM
    
    while (offset < data.length - 8) {
        const chunkId = readString(data, offset, 4);
        const chunkSize = view.getUint32(offset + 4, true);
        offset += 8;
        
        if (chunkId === 'fmt ') {
            audioFormat = view.getUint16(offset, true);
            numChannels = view.getUint16(offset + 2, true);
            sampleRate = view.getUint32(offset + 4, true);
            bitsPerSample = view.getUint16(offset + 14, true);
            offset += chunkSize;
        } else if (chunkId === 'data') {
            // Found data chunk - read samples
            const numSamples = chunkSize / (bitsPerSample / 8) / numChannels;
            const sampleData = new Float32Array(numSamples);
            
            if (bitsPerSample === 8) {
                // 8-bit unsigned
                for (let i = 0; i < numSamples; i++) {
                    const sample = data[offset + i * numChannels];
                    sampleData[i] = (sample - 128) / 128.0;
                }
            } else if (bitsPerSample === 16) {
                // 16-bit signed
                for (let i = 0; i < numSamples; i++) {
                    const sample = view.getInt16(offset + i * numChannels * 2, true);
                    sampleData[i] = sample / 32768.0;
                }
            } else if (bitsPerSample === 24) {
                // 24-bit signed
                for (let i = 0; i < numSamples; i++) {
                    const idx = offset + i * numChannels * 3;
                    const b1 = data[idx];
                    const b2 = data[idx + 1];
                    const b3 = data[idx + 2];
                    let sample = (b3 << 16) | (b2 << 8) | b1;
                    if (sample > 0x7FFFFF) sample -= 0x1000000;
                    sampleData[i] = sample / 8388608.0;
                }
            } else {
                throw new Error(`Unsupported bit depth: ${bitsPerSample}`);
            }
            
            // Convert to mono if stereo (take left channel)
            // Already handled by reading only first channel above
            
            const name = filename.replace(/\.[^/.]+$/, '').substring(0, 22);
            
            return {
                sampleData,
                sampleRate,
                name
            };
        } else {
            // Skip unknown chunk
            offset += chunkSize;
        }
    }
    
    throw new Error('No data chunk found in WAV file');
}

/**
 * Encode samples as WAV file
 * @param {Float32Array} sampleData - Audio samples (-1.0 to 1.0)
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {Uint8Array} WAV file data
 */
export function encodeWAV(sampleData, sampleRate = 8363) {
    const numSamples = sampleData.length;
    const bytesPerSample = 2; // 16-bit
    const numChannels = 1; // Mono
    const byteRate = sampleRate * numChannels * bytesPerSample;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = numSamples * bytesPerSample;
    const fileSize = 44 + dataSize;
    
    const buffer = new ArrayBuffer(fileSize);
    const data = new Uint8Array(buffer);
    const view = new DataView(buffer);
    
    // RIFF chunk
    writeString(data, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(data, 8, 'WAVE');
    
    // fmt chunk
    writeString(data, 12, 'fmt ');
    view.setUint32(16, 16, true); // Chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // Bits per sample
    
    // data chunk
    writeString(data, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write samples
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        const sample = Math.max(-1, Math.min(1, sampleData[i]));
        const int16 = Math.floor(sample * 32767);
        view.setInt16(offset, int16, true);
        offset += 2;
    }
    
    return data;
}

/**
 * Resample audio to target sample rate
 * @param {Float32Array} input - Input samples
 * @param {number} inputRate - Input sample rate
 * @param {number} outputRate - Output sample rate
 * @returns {Float32Array} Resampled audio
 */
export function resample(input, inputRate, outputRate) {
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

/**
 * Convert audio buffer to instrument format
 * @param {Float32Array} sampleData - Audio samples
 * @param {number} sampleRate - Sample rate
 * @param {string} name - Instrument name
 * @returns {Object} Instrument-compatible object
 */
export function audioToInstrument(sampleData, sampleRate, name) {
    const length = sampleData.length;
    
    return {
        name: name.substring(0, 22),
        length: Math.min(length, 131070), // MOD max: 65535 words * 2
        finetune: 0,
        volume: 64,
        repeatStart: 0,
        repeatLength: 2, // No loop by default
        sampleData: sampleData,
        sampleRate: sampleRate,
        isEmpty() {
            return this.length === 0 || !this.sampleData || this.sampleData.length === 0;
        },
        hasLoop() {
            return this.repeatLength > 2;
        }
    };
}

/**
 * Read string from buffer (helper)
 * @private
 */
function readString(data, offset, length) {
    let str = '';
    for (let i = 0; i < length; i++) {
        str += String.fromCharCode(data[offset + i]);
    }
    return str;
}

/**
 * Write string to buffer (helper)
 * @private
 */
function writeString(data, offset, string) {
    for (let i = 0; i < string.length; i++) {
        data[offset + i] = string.charCodeAt(i);
    }
}
