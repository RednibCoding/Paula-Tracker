/**
 * Input Handler for Paula Tracker
 * Handles all keyboard input and shortcuts
 */

export class InputHandler {
    constructor(tracker) {
        this.tracker = tracker;
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyDown(e) {
        // Escape: Cancel sequencer pattern entry
        if (e.key === 'Escape') {
            if (this.tracker.sequencerEntryBuffer !== -1) {
                this.tracker.sequencerEntryBuffer = -1;
                e.preventDefault();
                return;
            }
        }
        
        // Space: Toggle playback
        if (e.code === 'Space' && !e.ctrlKey && !e.shiftKey) {
            const state = this.tracker.audio.getState();
            if (state.playing) {
                this.tracker.audio.stop();
            } else {
                // If pattern loop mode is on, start from current cursor row
                // Otherwise start from beginning of current song position
                const startRow = state.patternLoop ? this.tracker.currentRow : 0;
                this.tracker.audio.play(this.tracker.song, this.tracker.currentSeqPos, startRow);
            }
            e.preventDefault();
            return;
        }
        
        // Preview instrument
        else if (e.key === 'F9') {
            // Preview selected instrument
            const instrNum = this.tracker.noteEntry.getInstrument();
            this.tracker.instrumentManager.previewInstrument(instrNum);
            e.preventDefault();
            return;
        }
        
        // Channel mute toggles (F5-F8 for channels 1-4)
        else if (e.key === 'F5') {
            this.tracker.audio.toggleChannelMute(0);
            e.preventDefault();
            return;
        } else if (e.key === 'F6') {
            this.tracker.audio.toggleChannelMute(1);
            e.preventDefault();
            return;
        } else if (e.key === 'F7') {
            this.tracker.audio.toggleChannelMute(2);
            e.preventDefault();
            return;
        } else if (e.key === 'F8') {
            this.tracker.audio.toggleChannelMute(3);
            e.preventDefault();
            return;
        }
        
        // Toggle pattern loop (just L, no modifier)
        else if (e.key === 'l' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            this.tracker.audio.togglePatternLoop();
            e.preventDefault();
            return;
        }
        
        // Load MOD file
        else if (e.ctrlKey && e.key === 'l') {
            this.tracker.fileInput.click();
            e.preventDefault();
            return;
        }
        
        // Clipboard operations
        else if (e.ctrlKey && e.key === 'c') {
            // Ctrl+C: Copy row
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            this.tracker.clipboard.copyRow(pattern, this.tracker.currentRow);
            e.preventDefault();
            return;
        } else if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            // Ctrl+Shift+C: Copy entire pattern
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            this.tracker.clipboard.copyPattern(pattern);
            e.preventDefault();
            return;
        } else if (e.ctrlKey && e.key === 'v') {
            // Ctrl+V: Paste
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            this.tracker.clipboard.paste(pattern, this.tracker.currentRow, this.tracker.currentChannel);
            e.preventDefault();
            return;
        } else if (e.ctrlKey && e.key === 'x') {
            // Ctrl+X: Cut row
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            this.tracker.clipboard.copyRow(pattern, this.tracker.currentRow);
            this.tracker.clipboard.clearRow(pattern, this.tracker.currentRow);
            e.preventDefault();
            return;
        }
        
        // Save MOD file
        else if (e.ctrlKey && e.key === 's') {
            // Ctrl+S: Save MOD file
            this.tracker.saveModFile();
            e.preventDefault();
            return;
        }
        
        // Duplicate pattern
        else if (e.ctrlKey && e.key === 'd') {
            // Ctrl+D: Duplicate current pattern
            this.tracker.duplicatePattern();
            e.preventDefault();
            return;
        }
        
        // Edit song title
        else if (e.ctrlKey && e.key === 'e') {
            // Ctrl+E: Edit song title
            this.tracker.editSongTitle();
            e.preventDefault();
            return;
        }
        
        // Pattern editing operations
        else if (e.key === 'Insert' && e.shiftKey && !e.altKey) {
            // Shift+Insert: Load WAV sample for selected instrument
            const instrNum = this.tracker.noteEntry.getInstrument();
            this.tracker.instrumentManager.loadSample(instrNum);
            e.preventDefault();
            return;
        } else if (e.key === 'Insert' && !e.altKey && !e.shiftKey) {
            // Insert blank row
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            this.tracker.clipboard.insertRow(pattern, this.tracker.currentRow);
            e.preventDefault();
            return;
        } else if (e.altKey && e.key === 'Insert') {
            // Alt+Insert: Insert position in song sequence
            if (this.tracker.song.songLength < 128) {
                // Shift all positions after current one to the right
                for (let i = this.tracker.song.songLength; i > this.tracker.currentSeqPos; i--) {
                    this.tracker.song.patternOrder[i] = this.tracker.song.patternOrder[i - 1];
                }
                // Insert current pattern at current position
                this.tracker.song.patternOrder[this.tracker.currentSeqPos] = this.tracker.currentPattern;
                this.tracker.song.songLength++;
                this.tracker.updateSequencerScroll();
            }
            e.preventDefault();
            return;
        } else if (e.shiftKey && e.key === 'Delete' && !e.altKey) {
            // Shift+Delete: Delete row (shift up)
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            this.tracker.clipboard.deleteRow(pattern, this.tracker.currentRow);
            e.preventDefault();
            return;
        } else if (e.altKey && e.key === 'Delete') {
            // Alt+Delete: Delete position from song sequence
            if (this.tracker.song.songLength > 1) {
                // Shift all positions after current one to the left
                for (let i = this.tracker.currentSeqPos; i < this.tracker.song.songLength - 1; i++) {
                    this.tracker.song.patternOrder[i] = this.tracker.song.patternOrder[i + 1];
                }
                this.tracker.song.songLength--;
                // Adjust current position if needed
                if (this.tracker.currentSeqPos >= this.tracker.song.songLength) {
                    this.tracker.currentSeqPos = this.tracker.song.songLength - 1;
                }
                this.tracker.currentPattern = this.tracker.song.patternOrder[this.tracker.currentSeqPos];
                this.tracker.updateSequencerScroll();
            }
            e.preventDefault();
            return;
        } else if (e.ctrlKey && e.key === 'Delete') {
            // Ctrl+Delete: Clear entire pattern
            if (confirm('Clear entire pattern?')) {
                const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
                this.tracker.clipboard.clearPattern(pattern);
            }
            e.preventDefault();
            return;
        }
        
        // Delete key: Clear current cell
        else if (e.key === 'Delete' && !e.shiftKey && !e.ctrlKey) {
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            const note = pattern.getNote(this.tracker.currentRow, this.tracker.currentChannel);
            
            if (this.tracker.currentColumn === 0) {
                note.period = 0;
            } else if (this.tracker.currentColumn === 1) {
                note.instrument = 0;
            } else if (this.tracker.currentColumn === 2) {
                note.effect = 0;
                note.param = 0;
            }
            e.preventDefault();
            return;
        }
        
        // Pattern navigation
        else if (e.key === 'F3') {
            if (this.tracker.currentPattern > 0) {
                this.tracker.currentPattern--;
            }
            e.preventDefault();
            return;
        } else if (e.key === 'F4') {
            if (this.tracker.currentPattern < 63) {
                this.tracker.currentPattern++;
            }
            e.preventDefault();
            return;
        }
        
        // Navigation
        else if (e.key === 'ArrowUp') {
            if (e.shiftKey) {
                // Shift+Up: Previous instrument
                const currentInst = this.tracker.noteEntry.getInstrument();
                if (currentInst > 1) {
                    this.tracker.noteEntry.setInstrument(currentInst - 1);
                    this.tracker.updateInstrumentScroll();
                }
            } else if (e.altKey) {
                // Alt+Up: Previous song position
                if (this.tracker.currentSeqPos > 0) {
                    this.tracker.currentSeqPos--;
                    this.tracker.currentPattern = this.tracker.song.patternOrder[this.tracker.currentSeqPos];
                    this.tracker.updateSequencerScroll();
                }
                e.preventDefault();
                return;
            } else if (e.ctrlKey) {
                // Ctrl+Up: Page up (jump 16 rows)
                this.tracker.currentRow = Math.max(0, this.tracker.currentRow - 16);
                this.tracker.updateScroll();
            } else {
                // Up: Previous row
                if (this.tracker.currentRow > 0) {
                    this.tracker.currentRow--;
                    this.tracker.updateScroll();
                }
            }
            e.preventDefault();
            return;
        } else if (e.key === 'ArrowDown') {
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            if (e.shiftKey) {
                // Shift+Down: Next instrument
                const currentInst = this.tracker.noteEntry.getInstrument();
                if (currentInst < 31) {
                    this.tracker.noteEntry.setInstrument(currentInst + 1);
                    this.tracker.updateInstrumentScroll();
                }
            } else if (e.altKey) {
                // Alt+Down: Next song position
                if (this.tracker.currentSeqPos < this.tracker.song.songLength - 1) {
                    this.tracker.currentSeqPos++;
                    this.tracker.currentPattern = this.tracker.song.patternOrder[this.tracker.currentSeqPos];
                    this.tracker.updateSequencerScroll();
                }
                e.preventDefault();
                return;
            } else if (e.ctrlKey) {
                // Ctrl+Down: Page down (jump 16 rows)
                this.tracker.currentRow = Math.min(pattern.length - 1, this.tracker.currentRow + 16);
                this.tracker.updateScroll();
            } else {
                // Down: Next row
                if (this.tracker.currentRow < pattern.length - 1) {
                    this.tracker.currentRow++;
                    this.tracker.updateScroll();
                }
            }
            e.preventDefault();
            return;
        } else if (e.key === 'ArrowLeft') {
            if (e.altKey) {
                // Alt+Left: Decrease pattern number at current sequencer position
                const currentPattern = this.tracker.song.patternOrder[this.tracker.currentSeqPos];
                if (currentPattern > 0) {
                    this.tracker.song.patternOrder[this.tracker.currentSeqPos] = currentPattern - 1;
                    this.tracker.currentPattern = currentPattern - 1;
                }
            } else if (e.ctrlKey) {
                // Ctrl+Left: Previous channel
                if (this.tracker.currentChannel > 0) {
                    this.tracker.currentChannel--;
                }
            } else {
                // Left: Previous column
                this.tracker.currentColumn--;
                if (this.tracker.currentColumn < 0) {
                    this.tracker.currentChannel = Math.max(0, this.tracker.currentChannel - 1);
                    this.tracker.currentColumn = 3;
                }
            }
            e.preventDefault();
            return;
        } else if (e.key === 'ArrowRight') {
            if (e.altKey) {
                // Alt+Right: Increase pattern number at current sequencer position
                const currentPattern = this.tracker.song.patternOrder[this.tracker.currentSeqPos];
                if (currentPattern < 63) {
                    this.tracker.song.patternOrder[this.tracker.currentSeqPos] = currentPattern + 1;
                    this.tracker.currentPattern = currentPattern + 1;
                }
            } else if (e.ctrlKey) {
                // Ctrl+Right: Next channel
                if (this.tracker.currentChannel < 3) {
                    this.tracker.currentChannel++;
                }
            } else {
                // Right: Next column
                this.tracker.currentColumn++;
                if (this.tracker.currentColumn > 3) {
                    this.tracker.currentChannel = Math.min(3, this.tracker.currentChannel + 1);
                    this.tracker.currentColumn = 0;
                }
            }
            e.preventDefault();
            return;
        } else if (e.key === 'Tab') {
            this.tracker.currentColumn = (this.tracker.currentColumn + 1) % 4;
            e.preventDefault();
            return;
        }
        
        // Page up/down
        else if (e.key === 'PageUp') {
            this.tracker.currentRow = Math.max(0, this.tracker.currentRow - 16);
            this.tracker.updateScroll();
            e.preventDefault();
            return;
        } else if (e.key === 'PageDown') {
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            this.tracker.currentRow = Math.min(pattern.length - 1, this.tracker.currentRow + 16);
            this.tracker.updateScroll();
            e.preventDefault();
            return;
        }
        
        // Home/End
        else if (e.key === 'Home' && e.shiftKey) {
            // Shift+Home: Save selected instrument as WAV
            const instrNum = this.tracker.noteEntry.getInstrument();
            this.tracker.instrumentManager.exportInstrument(instrNum);
            e.preventDefault();
            return;
        } else if (e.key === 'Home') {
            this.tracker.currentRow = 0;
            this.tracker.updateScroll();
            e.preventDefault();
            return;
        } else if (e.key === 'End') {
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            this.tracker.currentRow = pattern.length - 1;
            this.tracker.updateScroll();
            e.preventDefault();
            return;
        }
        
        // Note entry
        const noteResult = this.tracker.noteEntry.createNoteFromKey(e.key);
        if (noteResult) {
            const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
            const note = pattern.getNote(this.tracker.currentRow, this.tracker.currentChannel);
            note.period = noteResult.period;
            note.instrument = noteResult.instrument;
            
            // Advance row
            if (this.tracker.currentRow < pattern.length - 1) {
                this.tracker.currentRow++;
                this.tracker.updateScroll();
            }
            e.preventDefault();
            return;
        }
        
        // Hex digit entry for instrument/effect
        if (this.tracker.currentColumn > 0) {
            const hexDigit = this.tracker.keyboard.getHexDigit(e.key);
            if (hexDigit !== null) {
                const pattern = this.tracker.song.patterns[this.tracker.currentPattern];
                const note = pattern.getNote(this.tracker.currentRow, this.tracker.currentChannel);
                
                if (this.tracker.currentColumn === 1) {
                    // Instrument entry - enterInstrumentDigit(currentValue, key, isLowDigit)
                    note.instrument = this.tracker.noteEntry.enterInstrumentDigit(note.instrument, e.key, false);
                } else if (this.tracker.currentColumn === 2) {
                    // Effect type
                    note.effect = hexDigit;
                } else if (this.tracker.currentColumn === 3) {
                    // Effect parameter
                    note.param = this.tracker.noteEntry.enterHexDigit(note.param, e.key, false);
                }
                
                // Advance row
                if (this.tracker.currentRow < pattern.length - 1) {
                    this.tracker.currentRow++;
                    this.tracker.updateScroll();
                }
                e.preventDefault();
                return;
            }
        }
    }
}
