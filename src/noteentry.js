/**
 * Note entry handler
 * Converts user input into tracker note data
 */

import { KeyboardMap } from './keyboard.js';

export class NoteEntry {
    constructor(audio) {
        this.audio = audio;
        this.keyboard = new KeyboardMap();
        this.currentOctave = 2; // Default octave (1-3 typical for tracker)
        this.currentInstrument = 1;
    }
    
    /**
     * Convert note and octave to Amiga period
     * @param {number} note - Note (0-11 for C-B)
     * @param {number} octave - Octave (1-3)
     * @returns {number} Amiga period value
     */
    noteToPeriod(note, octave) {
        // Period table for octaves 1-3 (C-1 to B-3)
        // Based on Amiga Paula frequency
        const periodTable = [
            // Octave 1
            856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
            // Octave 2
            428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
            // Octave 3
            214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113
        ];
        
        const index = (octave - 1) * 12 + note;
        if (index >= 0 && index < periodTable.length) {
            return periodTable[index];
        }
        return 0;
    }
    
    /**
     * Create a note from keyboard input
     * @param {string} code - Key code
     * @returns {object|null} Note data { period, instrument, effect, param } or null
     */
    createNoteFromKey(code) {
        const noteInfo = this.keyboard.getNoteFromKey(code);
        if (!noteInfo) return null;
        
        const octave = this.currentOctave + (noteInfo.octaveOffset || 0);
        const period = this.noteToPeriod(noteInfo.note, octave);
        
        return {
            period: period,
            instrument: this.currentInstrument,
            effect: 0,
            param: 0
        };
    }
    
    /**
     * Set current octave (1-3)
     */
    setOctave(octave) {
        this.currentOctave = Math.max(1, Math.min(3, octave));
    }
    
    /**
     * Change octave by delta
     */
    changeOctave(delta) {
        this.setOctave(this.currentOctave + delta);
    }
    
    /**
     * Set current instrument (1-31)
     */
    setInstrument(instrument) {
        this.currentInstrument = Math.max(1, Math.min(31, instrument));
    }
    
    /**
     * Change instrument by delta
     */
    changeInstrument(delta) {
        this.setInstrument(this.currentInstrument + delta);
    }
    
    /**
     * Get current octave
     */
    getOctave() {
        return this.currentOctave;
    }
    
    /**
     * Get current instrument
     */
    getInstrument() {
        return this.currentInstrument;
    }
    
    /**
     * Enter hex digit for effect or parameter
     * @param {number} currentValue - Current hex value (0-255)
     * @param {string} key - Key pressed
     * @param {boolean} isLowNibble - True to edit low nibble, false for high nibble
     * @returns {number} New value
     */
    enterHexDigit(currentValue, key, isLowNibble) {
        const digit = this.keyboard.getHexDigit(key);
        if (digit === null) return currentValue;
        
        if (isLowNibble) {
            // Replace low nibble
            return (currentValue & 0xF0) | digit;
        } else {
            // Replace high nibble
            return (currentValue & 0x0F) | (digit << 4);
        }
    }
    
    /**
     * Enter instrument number digit
     * @param {number} currentValue - Current instrument (0-31)
     * @param {string} key - Key pressed (0-9)
     * @param {boolean} isLowDigit - True to edit ones place, false for tens place
     * @returns {number} New instrument number
     */
    enterInstrumentDigit(currentValue, key, isLowDigit) {
        const digit = this.keyboard.getHexDigit(key);
        if (digit === null || digit > 9) return currentValue;
        
        let tens = Math.floor(currentValue / 10);
        let ones = currentValue % 10;
        
        if (isLowDigit) {
            ones = digit;
        } else {
            tens = digit;
        }
        
        const result = tens * 10 + ones;
        return Math.min(31, result);
    }
}
