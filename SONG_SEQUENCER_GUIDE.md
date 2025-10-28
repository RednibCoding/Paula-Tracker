# Paula Tracker - Song Sequencer Guide

## Overview

The song sequencer (pattern order list) allows you to arrange patterns into a complete song. It's displayed in the right panel of the interface, above the instrument list.

## Display

```
SONG SEQUENCER
POS PAT  Len: 04
00  00    <-- Current position (highlighted in orange)
01  01
02  00
03  02
```

- **POS**: Position number in the song (00-7F hex, 0-127 decimal)
- **PAT**: Which pattern plays at this position (00-3F hex, 0-63 decimal)
- **Orange highlight**: Current editing position
- **Row highlight**: Currently playing position during playback
- **Len**: Total song length

## Controls

### Navigation
- **Alt+Up** / **Alt+Down** - Navigate positions in the sequencer

### Editing Pattern Numbers
- **Alt+Left** - Decrease pattern number at current position
- **Alt+Right** - Increase pattern number at current position
- **Alt+Insert** - Insert a new position at cursor (shifts remaining positions down)
- **Alt+Delete** - Delete current position (shifts remaining positions up)

### Pattern Editor Integration
- The main pattern editor always shows the pattern at the current sequence position
- When you change position in the sequencer, the pattern editor updates
- During playback, both the sequencer and pattern editor follow the song

## Creating a Song Structure

### Example: Create a song with Intro → Verse → Chorus → Verse

1. Navigate to position 0 (use Alt+Up/Down if needed)
2. Use Alt+Left/Right to set pattern 00 (intro)
3. Press Alt+Down to go to position 1
4. Use Alt+Right to increment to pattern 01 (verse)
5. Press Alt+Insert to insert a new position
6. Use Alt+Right to increment to pattern 02 (chorus)
7. Press Alt+Down to next position
8. Use Alt+Left/Right to set pattern 01 (verse repeats)

Your song order will be:
```
00 → Pattern 00 (Intro)
01 → Pattern 01 (Verse)
02 → Pattern 02 (Chorus)
03 → Pattern 01 (Verse)
```

## Pattern Reuse

You can use the same pattern multiple times in different positions. This is how you create verse/chorus repetition, which is essential for efficient module composition and staying within MOD format limits.

**Benefits of pattern reuse:**
- Saves memory (MOD files support max 64 patterns)
- Makes songs easier to edit (change verse once, affects all verses)
- Classic tracker workflow for creating song structures

## Tips

- The pattern editor always shows the pattern at the current sequence position
- Click in the sequencer area or use Alt+Arrows to change which position is active
- When you press **Space** to play, the song plays from position 0 following the pattern order
- The currently playing position is highlighted in cyan during playback
- During playback, both the sequencer and pattern editor auto-scroll to follow
- Use **Ctrl+D** to duplicate patterns before modifying them for variations
- Pattern numbers are in hexadecimal (00-3F, which is 0-63 decimal)
- Song length can be up to 128 positions (00-7F hex)
