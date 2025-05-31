# Sky Piano Lite

**Sky Piano Lite** is a lightweight web-based piano simulator inspired by *Sky: Children of the Light*. It allows players to practice and enjoy the musical instruments from the game directly in their browser.

![sky-piano-lite-screenshot](screenshot.jpg)

---

## ✨ Features

- **Responsive Design**  
  Optimized for both desktop and mobile devices, ensuring a seamless experience across platforms.

- **Visual Feedback**  
  Interactive animations provide immediate visual responses to your inputs.

- **Customizable Background**  
  Personalize your experience by setting your preferred background image and color.

- **Note Display Toggle**  
  Option to show or hide note labels, catering to both beginners and advanced players.

- **Realistic Sound**  
  Utilizes the Tone.js library for authentic instrument sounds.

- **Keyboard Support**  
  Play notes using your computer keyboard for a more tactile experience.

- **Sheet Recording and Playback**  
  Record your key presses in real time and export them as a playable sheet. Playback functionality allows you to rehearse or share melodies easily.

---

## ⚙️ Customizing Configuration via `pref.json`

To tailor the behavior and appearance of **Sky Piano Lite**, you can modify the `pref.json` configuration file located in the project's root directory.

### Available Settings

- **Background Image and Color**
  - `bgImage`: Path to your desired background image.
  - `bgColor`: Background color overlay in HEX format (e.g., `#1a1a1a`).

- **Note Display Toggle**
  - `showNotes`: Set to `true` to display note labels on keys, or `false` to hide them.

- **Sample Configuration**
  - `samples`: An array mapping keyboard keys to musical notes and their corresponding audio samples.

### Example `pref.json` Structure

```json
{
  "bgImage": "assets/background.jpg",
  "bgColor": "#1a1a1a",
  "showNotes": true,
  "samples": [
    { "key": "a", "note": "C4", "sample": "C4.mp3" },
    { "key": "s", "note": "D4", "sample": "D4.mp3" },
    { "key": "d", "note": "E4", "sample": "E4.mp3" }
    // Add more key-note-sample mappings as needed
  ]
}
```

**Note:** Ensure that the paths to images and audio samples are correct and that the files exist in the specified locations.

### Sheet File Format

You can create or modify song sheets using JSON. Each sheet consists of a list of key events and optional tempo changes.

Example:

```json
{
  "name": "Example Song",
  "sampler": "piano",
  "defaultBpm": 90,
  "sheet": [
    { "time": 0, "type": "key", "value": "C5" },
    { "time": "+0.5", "type": "key", "value": "D5" },
    { "time": "+0.5", "type": "key", "value": "E5" }
  ]
}
```

- `time`: Can be a number (absolute time in beats) or a string like `"+0.5"` to indicate relative time since the previous event.
- `type`: Currently supports `"key"` (note trigger) and `"tempo"` (change BPM).
- `value`: Note to play (e.g., `"C5"`), or new BPM for tempo events.

---

## 🎮 Controls

- **Mouse/Touch**  
  Click or tap on the on-screen keys to play notes.

- **Keyboard**  
  Use designated keys mapped to corresponding notes for efficient practice.

- **Recording**  
  Toggle recording mode to capture your live performance as a sheet, then save it as a JSON file.

---

## 🚀 Getting Started

To run the project locally:

```bash
pnpm install
pnpm dev
```

To build the project for production:

```bash
pnpm build
```

Once running, use the record toggle button to capture your melody and use the save function to export the sheet.

---

## 📁 Project Structure

```
sky-piano-lite/
├── index.html
├── src/
│   ├── main.js
│   ├── style.css
│   └── assets/
│       ├── type-1.svg
│       ├── type-2.svg
│       └── type-3.svg
├── pref.json
├── package.json
└── README.md
```

---

## 📄 License

This project is licensed under the MIT License.