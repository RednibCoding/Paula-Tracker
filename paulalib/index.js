/**
 * PaulaLib - Platform-Independent ProTracker Library
 * Main entry point for convenient imports
 */

// Core data structures
export { Note, Pattern, Instrument, Song } from './data.js';

// MOD file I/O
export { loadMOD, saveMOD, countInstruments } from './modloader.js';

// Audio engine
export { PaulaEngine, PERIOD_TABLE, NOTE_NAMES } from './audio-engine.js';

// Pattern operations
export { Clipboard } from './clipboard.js';

// Sample utilities
export {
    decodeWAV,
    encodeWAV,
    resample,
    audioToInstrument
} from './sampleutils.js';
