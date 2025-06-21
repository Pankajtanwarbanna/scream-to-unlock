# Scream to Unlock

> A Chrome extension that **blocks social media sites** (Facebook, Instagram, Twitter) until you **scream "I'm a loser"** into your microphone. The louder you scream, the more time you get to browse.

---

## Features

- Blocks access to Facebook, Instagram, and Twitter by overlaying a fullscreen black screen.
- Automatically activates microphone and listens for the phrase "**I'm a loser**".
- Measures loudness of your scream to determine unlock duration (up to 5 minutes).
- Unlock time is stored locally and enforced across page reloads and tabs.
- No popups or new tabs — the blocking happens directly on the page.
- Simple and minimal UI with clear instructions and status messages.

---

## How it works

1. When you visit a blocked site, the extension checks if your unlock time is expired.
2. If locked, it clears the page and shows a fullscreen overlay asking you to scream "I'm a loser".
3. It activates your microphone and uses the Web Speech API to listen for the phrase.
4. Once the phrase is detected, it uses the Web Audio API to analyze loudness.
5. The louder your scream, the longer your browsing time (up to 300 seconds).
6. After unlocking, the overlay disappears and the page reloads.
7. Once time expires, the overlay reappears blocking the site again.

---

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode** (toggle top-right).
4. Click **Load unpacked** and select this project's folder.
5. Visit any blocked social media site to test.

---

## File Overview

| File          | Description                                          |
|---------------|------------------------------------------------------|
| `manifest.json` | Chrome extension metadata and permissions.         |
| `content.js`    | Main content script: blocks page, handles mic, unlock logic. |
| `styles.css`    | Styles for fullscreen overlay and messages.        |

---

## TODO / Future Improvements

- **Persist unlock timer across all tabs and show a countdown timer overlay.**
- **Add a real-time volume meter to give user feedback while screaming.**
- **Support multiple unlock phrases or dynamic randomized phrases.**
- **Request microphone access only after user interaction (e.g., click a "Start Unlock" button).**
- **Improve error handling and guidance if microphone permission is denied.**
- **Gamify the experience: track number of unlocks, loudest scream, time saved.**
- **Allow users to customize the blocked websites list via an options page.**
- **Avoid clearing the entire page DOM; instead overlay with position fixed to preserve page state.**
- **Throttle or debounce checks to improve performance on tab/page changes.**
- **Add progressive difficulty: increase required loudness if unlocking too frequently.**
- **(Experimental) Add facial expression recognition for an additional unlock challenge.**

---

## License

MIT License. Use responsibly.

---

## Author

Pankaj Tanwar