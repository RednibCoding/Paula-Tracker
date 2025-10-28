# Paula Tracker Quick Start Guide

## Getting Started

1. **Start the tracker**:
   ```bash
   cd Paula-Tracker
   python3 -m http.server 8080
   ```
   Open http://localhost:8080 in your browser

2. **The interface** loads with:
   - Pattern editor (main area, 4 channels with VU meters)
   - Song sequencer (pattern order timeline)
   - Instrument list (right side, 31 instruments)
   - Help overlay (press F1 to show/hide)

## Making Your First Song

### Step 1: Enter Some Notes

1. Click in the pattern editor or use arrow keys to navigate
2. The cursor shows your current position (orange highlight)
3. Press keys on your keyboard to enter notes:

**Piano Keyboard Layout:**
```
Upper row (C-2 octave):
Q W E R T Y U I O P [
 2 3   5 6 7   9 0

Lower row (C-1 octave):  
Z X C V B N M
 S D   G H J
```

Example: Press **Q** to enter a C-2 note

### Step 2: Understanding the Pattern Display

Each row shows 4 columns:
```
NOTE  INST  EFF  PAR
C-2   01    .    ..
```

- **NOTE**: The musical note (C-1, D#2, etc.) or `---` for empty
- **INST**: Instrument number (01-1F in hex)
- **EFF**: Effect command (0-F)
- **PAR**: Effect parameter (00-FF in hex)

### Step 3: Add Some Effects

1. Navigate to the effect column (press → twice after note)
2. Press a hex key (0-F) to set an effect:
   - Press **C** for volume (effect C)
   - Press → to move to parameter
   - Press **4** then **0** for volume 64 (0x40)

### Step 4: Play Your Music

- Press **SPACE** to start playback
- Press **SPACE** again to stop
- Press **L** to toggle pattern loop mode (stays on current pattern)
- Press **F5-F8** to mute/unmute individual channels
- The playback row is highlighted in the pattern editor

## Loading Samples and MOD Files

### Load a MOD File
- Press **Ctrl+L** to load a classic Amiga .MOD file
- Browse to a .mod file and it will load all patterns and instruments

### Load a Sample into an Instrument
1. Select an instrument number (use Shift+Up/Down arrows)
2. Press **Shift+Insert**
3. Choose a WAV, MP3, or OGG audio file
4. The sample is now loaded into that instrument slot

### Save Your Work
- Press **Ctrl+S** to save as a .MOD file
- Press **Ctrl+E** to edit the song title (20 char max)

## Pattern Management

### Copy and Paste
- **Ctrl+C** - Copy current row
- **Ctrl+Shift+C** - Copy entire pattern
- **Ctrl+V** - Paste
- **Ctrl+X** - Cut row
- **Ctrl+Delete** - Clear entire pattern

### Pattern Operations
- **Ctrl+D** - Duplicate current pattern to next slot
- **Insert** - Insert blank row at cursor
- **Shift+Delete** - Delete current row

### Song Sequencer
- **Alt+Up/Down** - Navigate pattern positions
- **Alt+Left/Right** - Decrease/increase pattern number
- **Alt+Insert** - Insert new position in song sequence
- **Alt+Delete** - Remove position from sequence

## Common Effects

Try these effects in your patterns:

### Volume (Cxx)
```
C-2  01  C  40    # Play at volume 64 (0x40)
---  ..  C  20    # Set volume to 32 (0x20)
```

### Arpeggio (0xy)
```
C-2  01  0  37    # Arpeggio: C + 3 semitones + 7 semitones
                  # Creates a C major chord!
```

### Portamento (3xx)
```
C-2  01  .  ..    # Start at C-2
E-2  ..  3  10    # Slide to E-2 at speed 16
```

### Vibrato (4xy)
```
C-2  01  4  44    # Vibrato: speed=4, depth=4
```

### Volume Slide (Axy)
```
C-2  01  .  ..    # Play note
---  ..  A  10    # Slide volume up by 1 per tick
---  ..  A  01    # Slide volume down by 1 per tick
```

### Set Speed (Fxx)
```
---  ..  F  06    # Set speed to 6 ticks/row
---  ..  F  7D    # Set BPM to 125 (0x7D)
```

## Example Pattern

Here's a simple melody to get you started:

```
Row | Ch1          Ch2          Ch3          Ch4
----|-------------|-------------|-------------|-------------
00  | C-2  01 . . | --- .. . .  | --- .. . .  | --- .. . .
04  | D-2  01 . . | --- .. . .  | C-1 01 . .  | --- .. . .
08  | E-2  01 . . | --- .. . .  | --- .. . .  | --- .. . .
12  | F-2  01 . . | --- .. . .  | E-1 01 . .  | --- .. . .
16  | G-2  01 . . | E-2 01 . .  | --- .. . .  | --- .. . .
20  | A-2  01 . . | --- .. . .  | G-1 01 . .  | --- .. . .
24  | B-2  01 . . | G-2 01 . .  | --- .. . .  | --- .. . .
28  | C-3  01 . . | --- .. . .  | C-2 01 . .  | --- .. . .
```

## Tips & Tricks

1. **Navigate faster**: 
   - Use **Ctrl+Up/Down** to jump 16 rows (PageUp/PageDown)
   - Use **Ctrl+Left/Right** to jump between channels
   - **Home/End** to jump to start/end of pattern
   - **Tab** to move to next column

2. **Pattern loop for composition**:
   - Press **L** to enable pattern loop mode
   - This keeps playing the current pattern while you edit
   - Great for hearing your changes immediately

3. **Channel muting**:
   - Press **F5-F8** to solo/mute channels 1-4
   - Headers turn red when muted
   - Perfect for isolating parts or creating variations

4. **Help system**:
   - Press **F1** to show complete keyboard shortcuts
   - Hold F1 to keep it visible, release to hide

5. **Clipboard tricks**:
   - Copy entire patterns with **Ctrl+Shift+C**
   - Paste into different patterns to reuse sections
   - Duplicate patterns with **Ctrl+D** for variations

6. **Classic tracker trick**:
   - Use arpeggio (0xy) to create chords with single channel
   - Example: 037 = major chord, 047 = major 7th

7. **VU meters**:
   - Watch the green/yellow/red bars above each channel
   - Shows real-time volume levels
   - Helps balance your mix visually

## Advanced: Effect Combinations

### Echo/Delay Effect
```
Row | Ch1          Ch2          Ch3
----|-------------|-------------|-------------
00  | C-2  01 C 40| --- .. . .  | --- .. . .
04  | --- .. . .  | C-2 01 C 30 | --- .. . .
08  | --- .. . .  | --- .. . .  | C-2 01 C 20
```

### Bass + Lead Pattern
```
Row | Ch1 (Bass)  | Ch2 (Lead)  
----|-------------|-------------
00  | C-1  01 . . | C-3 02 . .
01  | --- .. . .  | --- .. 4 33  # Vibrato on lead
02  | --- .. . .  | --- .. . .
04  | E-1  01 . . | E-3 02 . .
08  | G-1  01 . . | G-3 02 . .
```

## Keyboard Reference Card

```
┌──────────────────────────────────────┐
│ NAVIGATION                           │
├──────────────────────────────────────┤
│ ↑↓←→          Move cursor            │
│ Ctrl+↑↓       Jump 16 rows           │
│ Ctrl+←→       Jump channels          │
│ Shift+↑↓      Change instrument      │
│ Alt+↑↓        Song positions         │
│ Home/End      Start/End pattern      │
│ Tab           Next column            │
├──────────────────────────────────────┤
│ PLAYBACK                             │
├──────────────────────────────────────┤
│ Space         Play/Stop              │
│ L             Pattern loop mode      │
│ F5-F8         Mute channels 1-4      │
│ F9            Preview instrument     │
├──────────────────────────────────────┤
│ EDITING                              │
├──────────────────────────────────────┤
│ Z-M           Notes (C-1 octave)     │
│ Q-P           Notes (C-2 octave)     │
│ S,D,G,H,J     Sharp notes (#)        │
│ 0-9,A-F       Hex input              │
│ Delete        Clear note             │
│ Insert        Insert blank row       │
│ Shift+Delete  Delete row             │
├──────────────────────────────────────┤
│ CLIPBOARD                            │
├──────────────────────────────────────┤
│ Ctrl+C        Copy row               │
│ Ctrl+Shift+C  Copy pattern           │
│ Ctrl+V        Paste                  │
│ Ctrl+X        Cut row                │
│ Ctrl+Delete   Clear pattern          │
├──────────────────────────────────────┤
│ FILES & MANAGEMENT                   │
├──────────────────────────────────────┤
│ Ctrl+L        Load MOD file          │
│ Ctrl+S        Save MOD file          │
│ Ctrl+E        Edit song title        │
│ Ctrl+D        Duplicate pattern      │
│ Shift+Insert  Load sample            │
│ Shift+Home    Save sample            │
├──────────────────────────────────────┤
│ HELP                                 │
├──────────────────────────────────────┤
│ F1            Show/hide help         │
└──────────────────────────────────────┘
```

## Next Steps

Once you're comfortable with the basics:
- **Load classic MOD files** (Ctrl+L) to study how they're made
- **Import your own samples** (Shift+Insert) for custom instruments
- Experiment with different effects (vibrato + volume slide)
- Create bass patterns on channels 0 and 3 (left speaker)
- Create melody on channels 1 and 2 (right speaker)
- Use portamento (3xx) for smooth pitch transitions
- Use pattern loop mode (L) to hear changes while composing
- Watch the VU meters to balance channel volumes
- Build complete songs in the sequencer (Alt+Insert)

Happy tracking! 🎵

---

**Pro Tip**: The best way to learn is by loading classic MOD files (Ctrl+L) and studying their patterns. The demoscene has decades of amazing music to learn from!
