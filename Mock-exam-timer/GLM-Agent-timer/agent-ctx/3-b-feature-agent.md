# Task 3-b: Add Motivational Quotes + Ambient White Noise Features

## Work Summary

### Feature 1: Motivational Quotes (考试励志语录)
- Created `src/lib/quotes.ts` with 35 Chinese motivational quotes
  - 15 古诗文 quotes (郑燮、李白、屈原、荀子、韩愈、苏轼、颜真卿、陆游、杜甫、岳飞、诸葛亮、李清照、孔子、培根、爱迪生)
  - 10 名人名言 (毛泽东、爱迪生、培根、爱因斯坦、孔子、诸葛亮、李清照、岳飞、杜甫)
  - 10 现代励志语 (无作者)
- Each quote has `text` and optional `author` fields
- Exported `MOTIVATIONAL_QUOTES`, `getRandomQuote()`, `getQuoteByIndex()` utilities
- Integrated into `page.tsx`:
  - `currentQuote` state with `Quote` type
  - `quoteIndexRef` ref for cycling
  - Effect that cycles quotes every 60 seconds during exam running
  - Quote displayed below tips section in timer card
  - Framer Motion `AnimatePresence` with `mode="wait"` for fade-in/fade-out transitions
  - Style: `text-xs italic text-slate-400 dark:text-slate-500` with ✨ emoji prefix
  - Only shown when `timer.status === "running"`
  - Format: `"quote text" — author` or just `"quote text"`

### Feature 2: Ambient White Noise (白噪音)
- Created `src/components/timer/ambient-sound.tsx` component
  - Web Audio API programmatic noise generation (no external files)
  - 4 noise types:
    - 🌊 White noise: random samples
    - 🌧️ Pink noise: Voss-McCartney algorithm
    - 🌲 Brown noise: integrated white noise (accumulate random values)
    - ☕ Coffee shop: modulated brown noise with LFO for subtle variations
  - Headphones icon button in header toolbar
  - Glass-card dropdown panel with noise options + volume slider
  - Color indicators for each noise type (sky/pink/amber/orange dots)
  - Volume slider with emerald accent and custom thumb styling
  - Settings persisted to localStorage:
    - `exam-timer-ambient-sound`: selected noise type
    - `exam-timer-ambient-volume`: volume level (0-100, default 50)
  - Timer lifecycle integration:
    - Pause → fade out gain over 0.3s
    - Resume → fade in gain over 0.3s
    - Idle/Finished → stop noise completely
  - Separate AudioContext from beep singleton to avoid conflicts
  - Proper cleanup of AudioContext resources on unmount
  - Click-outside-to-close panel behavior

### Integration in page.tsx
- Added imports: `MOTIVATIONAL_QUOTES`, `Quote` from quotes.ts, `AmbientSound` from ambient-sound.tsx
- Added state: `currentQuote`, `quoteIndexRef`
- Added effect: quote cycling every 60 seconds during running
- Added `<AmbientSound timerStatus={timer.status} />` in header toolbar
- Added quote display with AnimatePresence in tips section

### Lint Fix
- Fixed `react-hooks/set-state-in-effect` error: `setIsPlaying(false)` in effect → deferred with `setTimeout(() => setIsPlaying(false), 0)`

### Verification
- ESLint: 0 errors, 0 warnings
- Dev server: compiling normally
- Page: returns 200
- No runtime errors

### Files Created
- `src/lib/quotes.ts` - 35 motivational quotes collection
- `src/components/timer/ambient-sound.tsx` - Ambient sound component

### Files Modified
- `src/app/page.tsx` - Added quotes display, ambient sound integration
- `src/worklog.md` - Appended work record
