/**
 * MOD File Loader/Saver for Paula Tracker
 * Platform-independent - works with ArrayBuffer/Uint8Array only
 * No file system or browser API dependencies
 */

import { Song, Pattern, Note, Instrument } from './data.js';

/**
 * Load a MOD file from ArrayBuffer or Uint8Array
 * @param {ArrayBuffer|Uint8Array} buffer - MOD file data
 * @returns {Song} Parsed song object
 */
export function loadMOD(buffer) {
    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const song = new Song();
    
    // Read song title (20 bytes at offset 0)
    song.title = readString(data, 0, 20);
    
    // Detect MOD format by checking signature at offset 1080
    const signature = readString(data, 1080, 4);
    let channelCount = 4;
    
    if (signature === 'M.K.' || signature === 'M!K!' || signature === 'FLT4') {
        channelCount = 4;
    } else if (signature === '6CHN') {
        channelCount = 6;
    } else if (signature === '8CHN') {
        channelCount = 8;
    }
    
    // Read 31 instruments (offset 20)
    let offset = 20;
    for (let i = 1; i <= 31; i++) {
        const instr = song.instruments[i];
        
        // Instrument name (22 bytes)
        instr.name = readString(data, offset, 22);
        offset += 22;
        
        // Sample length in words (2 bytes)
        const lengthWords = (data[offset] << 8) | data[offset + 1];
        instr.length = lengthWords * 2;
        offset += 2;
        
        // Finetune (1 byte, signed 4-bit value)
        let finetune = data[offset];
        if (finetune > 7) finetune = finetune - 16;
        instr.finetune = finetune;
        offset += 1;
        
        // Volume (1 byte, 0-64)
        instr.volume = Math.min(64, data[offset]);
        offset += 1;
        
        // Repeat start in words (2 bytes)
        const repeatWords = (data[offset] << 8) | data[offset + 1];
        instr.repeatStart = repeatWords * 2;
        offset += 2;
        
        // Repeat length in words (2 bytes)
        const repeatLengthWords = (data[offset] << 8) | data[offset + 1];
        instr.repeatLength = repeatLengthWords * 2;
        offset += 2;
    }
    
    // Song length (1 byte at offset 950)
    song.songLength = data[950];
    
    // Restart position (1 byte at offset 951)
    song.restartPosition = data[951];
    
    // Pattern table (128 bytes at offset 952)
    let maxPattern = 0;
    for (let i = 0; i < 128; i++) {
        const patternNum = data[952 + i];
        song.patternOrder[i] = patternNum;
        if (patternNum > maxPattern) maxPattern = patternNum;
    }
    
    // Pattern data starts at offset 1084
    offset = 1084;
    
    // Read pattern data
    for (let p = 0; p <= maxPattern; p++) {
        const pattern = song.patterns[p];
        
        for (let row = 0; row < 64; row++) {
            for (let ch = 0; ch < channelCount && ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                
                // Read 4 bytes per note
                const b0 = data[offset++];
                const b1 = data[offset++];
                const b2 = data[offset++];
                const b3 = data[offset++];
                
                // Decode note data
                const periodHi = (b0 & 0x0F);
                const periodLo = b1;
                const period = (periodHi << 8) | periodLo;
                note.period = period;
                
                const instrHi = (b0 & 0xF0) >> 4;
                const instrLo = (b2 & 0xF0) >> 4;
                const instrument = (instrHi << 4) | instrLo;
                note.instrument = instrument;
                
                const effect = b2 & 0x0F;
                note.effect = effect;
                
                const param = b3;
                note.param = param;
            }
        }
    }
    
    // Read sample data
    for (let i = 1; i <= 31; i++) {
        const instr = song.instruments[i];
        
        if (instr.length > 0) {
            instr.sampleData = new Float32Array(instr.length);
            
            for (let s = 0; s < instr.length; s++) {
                const byte = data[offset++];
                const signed = byte > 127 ? byte - 256 : byte;
                instr.sampleData[s] = signed / 128.0;
            }
        }
    }
    
    return song;
}

/**
 * Save a song as a MOD file
 * @param {Song} song - Song object to save
 * @returns {Uint8Array} MOD file data
 */
export function saveMOD(song) {
    // Calculate how many patterns are actually used
    let maxPattern = 0;
    for (let i = 0; i < song.songLength; i++) {
        if (song.patternOrder[i] > maxPattern) {
            maxPattern = song.patternOrder[i];
        }
    }
    
    // Calculate total size needed
    const headerSize = 1084;
    const patternDataSize = (maxPattern + 1) * 64 * 4 * 4;
    
    let sampleDataSize = 0;
    for (let i = 1; i <= 31; i++) {
        const instr = song.instruments[i];
        if (!instr.isEmpty()) {
            sampleDataSize += instr.length;
        }
    }
    
    const totalSize = headerSize + patternDataSize + sampleDataSize;
    const data = new Uint8Array(totalSize);
    
    // Write song title (20 bytes)
    writeString(data, 0, song.title || 'untitled', 20);
    
    // Write 31 instruments
    let offset = 20;
    for (let i = 1; i <= 31; i++) {
        const instr = song.instruments[i];
        
        writeString(data, offset, instr.name || '', 22);
        offset += 22;
        
        const lengthWords = Math.floor(instr.length / 2);
        data[offset++] = (lengthWords >> 8) & 0xFF;
        data[offset++] = lengthWords & 0xFF;
        
        let finetune = instr.finetune || 0;
        if (finetune < 0) finetune = 16 + finetune;
        data[offset++] = finetune & 0x0F;
        
        data[offset++] = Math.min(64, instr.volume || 0);
        
        const repeatWords = Math.floor((instr.repeatStart || 0) / 2);
        data[offset++] = (repeatWords >> 8) & 0xFF;
        data[offset++] = repeatWords & 0xFF;
        
        const repeatLengthWords = Math.floor((instr.repeatLength || 2) / 2);
        data[offset++] = (repeatLengthWords >> 8) & 0xFF;
        data[offset++] = repeatLengthWords & 0xFF;
    }
    
    // Song length (offset 950)
    data[950] = song.songLength || 1;
    
    // Restart position (offset 951)
    data[951] = song.restartPosition || 0;
    
    // Pattern order table (128 bytes at offset 952)
    for (let i = 0; i < 128; i++) {
        data[952 + i] = song.patternOrder[i] || 0;
    }
    
    // MOD signature 'M.K.' (offset 1080)
    writeString(data, 1080, 'M.K.', 4);
    
    // Write pattern data (offset 1084)
    offset = 1084;
    for (let p = 0; p <= maxPattern; p++) {
        const pattern = song.patterns[p];
        
        for (let row = 0; row < 64; row++) {
            for (let ch = 0; ch < 4; ch++) {
                const note = pattern.getNote(row, ch);
                
                const period = note.period || 0;
                const instrument = note.instrument || 0;
                const effect = note.effect || 0;
                const param = note.param || 0;
                
                const instrHi = (instrument >> 4) & 0x0F;
                const periodHi = (period >> 8) & 0x0F;
                data[offset++] = (instrHi << 4) | periodHi;
                
                data[offset++] = period & 0xFF;
                
                const instrLo = instrument & 0x0F;
                data[offset++] = (instrLo << 4) | (effect & 0x0F);
                
                data[offset++] = param & 0xFF;
            }
        }
    }
    
    // Write sample data
    for (let i = 1; i <= 31; i++) {
        const instr = song.instruments[i];
        
        if (!instr.isEmpty() && instr.sampleData) {
            for (let j = 0; j < instr.length; j++) {
                const sample = instr.sampleData[j] || 0;
                const signed8bit = Math.round(sample * 127);
                data[offset++] = signed8bit & 0xFF;
            }
        }
    }
    
    return data;
}

/**
 * Count non-empty instruments in a song
 * @param {Song} song
 * @returns {number}
 */
export function countInstruments(song) {
    let count = 0;
    for (let i = 1; i <= 31; i++) {
        if (!song.instruments[i].isEmpty()) {
            count++;
        }
    }
    return count;
}

/**
 * Read a string from data buffer
 * @private
 */
function readString(data, offset, length) {
    let str = '';
    for (let i = 0; i < length; i++) {
        const char = data[offset + i];
        if (char === 0) break;
        if (char >= 32 && char <= 126) {
            str += String.fromCharCode(char);
        }
    }
    return str.trim();
}

/**
 * Write a string to data buffer
 * @private
 */
function writeString(data, offset, str, maxLength) {
    for (let i = 0; i < maxLength; i++) {
        data[offset + i] = i < str.length ? str.charCodeAt(i) : 0;
    }
}
