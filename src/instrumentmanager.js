/**
 * Instrument Management for Paula Tracker
 * Handles loading, saving, and previewing instruments
 */

export class InstrumentManager {
    constructor(tracker) {
        this.tracker = tracker;
        this.sampleLoader = tracker.sampleLoader;
    }
    
    /**
     * Load sample file for instrument
     */
    async loadSample(instrumentNumber) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.wav,.WAV';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const instrument = await this.sampleLoader.loadWAV(file);
                    
                    // Replace the instrument
                    this.tracker.song.instruments[instrumentNumber] = instrument;
                    
                    // Select this instrument
                    this.tracker.noteEntry.setInstrument(instrumentNumber);
                } catch (err) {
                    console.error('Error loading sample:', err);
                    alert('Error loading sample: ' + err.message);
                }
            }
        };
        
        input.click();
    }
    
    /**
     * Export instrument as WAV file
     */
    exportInstrument(instrumentNumber) {
        const instrument = this.tracker.song.instruments[instrumentNumber];
        
        if (instrument.isEmpty()) {
            return; // Silently ignore empty instruments
        }
        
        // Create a clean filename from instrument name
        let filename = instrument.name.trim();
        if (!filename) {
            filename = `Instrument_${instrumentNumber.toString(16).toUpperCase().padStart(2, '0')}`;
        }
        
        // Remove invalid filename characters
        filename = filename.replace(/[^a-zA-Z0-9_\-]/g, '_');
        filename = `${filename}.wav`;
        
        this.sampleLoader.exportWAV(instrument, filename);
    }
    
    /**
     * Preview selected instrument (play at middle C)
     */
    previewInstrument(instrumentNumber) {
        const instrument = this.tracker.song.instruments[instrumentNumber];
        
        if (instrument.isEmpty()) {
            return; // Can't preview empty instrument
        }
        
        // Create audio context if needed
        if (!window.previewAudioContext) {
            window.previewAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const context = window.previewAudioContext;
        
        // Play directly using Web Audio API
        const source = context.createBufferSource();
        const gainNode = context.createGain();
        
        // Create buffer from instrument data
        const buffer = context.createBuffer(
            1,
            instrument.sampleData.length,
            context.sampleRate
        );
        buffer.copyToChannel(instrument.sampleData, 0);
        source.buffer = buffer;
        
        // Set loop if instrument has one
        if (instrument.hasLoop()) {
            source.loop = true;
            source.loopStart = instrument.repeatStart / context.sampleRate;
            source.loopEnd = (instrument.repeatStart + instrument.repeatLength) / context.sampleRate;
        }
        
        // Play at middle C (period 428 = C-2)
        // Amiga period formula: rate = 7093789.2 / (period * 2)
        const period = 428;
        const playbackRate = (7093789.2 / 2 / period) / context.sampleRate;
        source.playbackRate.value = playbackRate;
        
        // Set volume
        gainNode.gain.value = instrument.volume / 64;
        
        // Connect and play
        source.connect(gainNode);
        gainNode.connect(context.destination);
        source.start();
        
        // Stop after 2 seconds (or when loop completes)
        if (!instrument.hasLoop()) {
            source.stop(context.currentTime + 2);
        } else {
            source.stop(context.currentTime + 1);
        }
    }
}
