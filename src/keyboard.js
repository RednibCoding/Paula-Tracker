/**
 * Keyboard mapping for note entry
 * Maps keyboard keys to musical notes in tracker style
 */

export class KeyboardMap {
    constructor() {
        // Piano keyboard layout - lower row (white keys C-B)
        // Z X C V B N M , .
        this.lowerRow = {
            'KeyZ': { note: 0, name: 'C-' },  // C
            'KeyS': { note: 1, name: 'C#' },  // C#
            'KeyX': { note: 2, name: 'D-' },  // D
            'KeyD': { note: 3, name: 'D#' },  // D#
            'KeyC': { note: 4, name: 'E-' },  // E
            'KeyV': { note: 5, name: 'F-' },  // F
            'KeyG': { note: 6, name: 'F#' },  // F#
            'KeyB': { note: 7, name: 'G-' },  // G
            'KeyH': { note: 8, name: 'G#' },  // G#
            'KeyN': { note: 9, name: 'A-' },  // A
            'KeyJ': { note: 10, name: 'A#' }, // A#
            'KeyM': { note: 11, name: 'B-' }, // B
        };
        
        // Upper row (same notes, one octave higher)
        // Q W E R T Y U I O P
        this.upperRow = {
            'KeyQ': { note: 0, name: 'C-', octaveOffset: 1 },  // C
            'Digit2': { note: 1, name: 'C#', octaveOffset: 1 }, // C#
            'KeyW': { note: 2, name: 'D-', octaveOffset: 1 },  // D
            'Digit3': { note: 3, name: 'D#', octaveOffset: 1 }, // D#
            'KeyE': { note: 4, name: 'E-', octaveOffset: 1 },  // E
            'KeyR': { note: 5, name: 'F-', octaveOffset: 1 },  // F
            'Digit5': { note: 6, name: 'F#', octaveOffset: 1 }, // F#
            'KeyT': { note: 7, name: 'G-', octaveOffset: 1 },  // G
            'Digit6': { note: 8, name: 'G#', octaveOffset: 1 }, // G#
            'KeyY': { note: 9, name: 'A-', octaveOffset: 1 },  // A
            'Digit7': { note: 10, name: 'A#', octaveOffset: 1 }, // A#
            'KeyU': { note: 11, name: 'B-', octaveOffset: 1 }, // B
            'KeyI': { note: 0, name: 'C-', octaveOffset: 2 },  // C (next octave)
            'Digit9': { note: 1, name: 'C#', octaveOffset: 2 }, // C#
            'KeyO': { note: 2, name: 'D-', octaveOffset: 2 },  // D
            'Digit0': { note: 3, name: 'D#', octaveOffset: 2 }, // D#
            'KeyP': { note: 4, name: 'E-', octaveOffset: 2 },  // E
        };
    }
    
    /**
     * Get note info from key code
     * @param {string} code - Key code (e.g., 'KeyZ')
     * @returns {object|null} Note info with { note, name, octaveOffset }
     */
    getNoteFromKey(code) {
        if (this.lowerRow[code]) {
            return { ...this.lowerRow[code], octaveOffset: 0 };
        }
        if (this.upperRow[code]) {
            return this.upperRow[code];
        }
        return null;
    }
    
    /**
     * Check if key is a note key
     * @param {string} code - Key code
     * @returns {boolean}
     */
    isNoteKey(code) {
        return !!(this.lowerRow[code] || this.upperRow[code]);
    }
    
    /**
     * Get hex digit from key
     * @param {string} key - Key character
     * @returns {number|null} Hex value 0-15, or null if not hex
     */
    getHexDigit(key) {
        const upper = key.toUpperCase();
        if (upper >= '0' && upper <= '9') {
            return parseInt(upper);
        }
        if (upper >= 'A' && upper <= 'F') {
            return 10 + (upper.charCodeAt(0) - 'A'.charCodeAt(0));
        }
        return null;
    }
}
