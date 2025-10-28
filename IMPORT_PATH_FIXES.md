# Import Path Fixes - tracker/web

## Problem
After moving the web tracker from `src/` to `tracker/web/src/`, all import paths to `paulalib/` were broken because the relative paths changed.

## Files Fixed

### ✅ tracker/web/src/main.js
**Changed:**
```javascript
// OLD (broken)
import { Song, Note } from '../paulalib/data.js';
import { Clipboard } from '../paulalib/clipboard.js';
import { PERIOD_TABLE, NOTE_NAMES } from '../paulalib/audio-engine.js';

// NEW (fixed)
import { Song, Note } from '../../../paulalib/data.js';
import { Clipboard } from '../../../paulalib/clipboard.js';
import { PERIOD_TABLE, NOTE_NAMES } from '../../../paulalib/audio-engine.js';
```

### ✅ tracker/web/src/noteentry.js
**Changed:**
```javascript
// OLD (broken)
import { PERIOD_TABLE } from '../paulalib/audio-engine.js';

// NEW (fixed)
import { PERIOD_TABLE } from '../../../paulalib/audio-engine.js';
```

### ✅ tracker/web/src/platform/file-browser.js
**Changed:**
```javascript
// OLD (broken)
import { loadMOD, saveMOD } from '../../paulalib/modloader.js';

// NEW (fixed)
import { loadMOD, saveMOD } from '../../../../paulalib/modloader.js';
```

### ✅ tracker/web/src/platform/audio-web.js
**Changed:**
```javascript
// OLD (broken)
import { PaulaEngine } from '../../paulalib/audio-engine.js';

// NEW (fixed)
import { PaulaEngine } from '../../../../paulalib/audio-engine.js';
```

### ✅ tracker/web/src/platform/sample-loader-browser.js
**Changed:**
```javascript
// OLD (broken)
import { decodeWAV, audioToInstrument } from '../../paulalib/sampleutils.js';

// NEW (fixed)
import { decodeWAV, audioToInstrument } from '../../../../paulalib/sampleutils.js';
```

## Path Calculation

**From `tracker/web/src/` to `paulalib/`:**
```
tracker/web/src/ → ../ → tracker/web/ → ../ → tracker/ → ../ → project_root/paulalib/
= ../../../paulalib/
```

**From `tracker/web/src/platform/` to `paulalib/`:**
```
tracker/web/src/platform/ → ../ → src/ → ../ → web/ → ../ → tracker/ → ../ → project_root/paulalib/
= ../../../../paulalib/
```

## Files NOT Changed (Already Correct)

- ✅ `tracker/web/index.html` - Uses `./src/main.js` (relative path works)
- ✅ Internal imports within `tracker/web/src/` (e.g., `./ui.js`, `./platform/audio-web.js`)
- ✅ All files in `paulalib/` (platform-independent, no external imports)

## Verification

- ✅ No compilation errors
- ✅ All paths verified with `ls` commands
- ✅ Import graph is complete and correct

## Total Changes
- **5 files updated**
- **8 import statements fixed**
- **0 errors remaining**
