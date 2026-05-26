<div align="center">

<br>

<img src="https://img.shields.io/badge/inkdown-markdown%20studio-6cb6ff?style=for-the-badge&logoColor=white" alt="Inkdown">

<br><br>

**A beautiful, distraction-free markdown editor with live GitHub-flavored preview.**  
No login. No install. Just open and write.

<br>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20Inkdown-6cb6ff?style=flat-square)](https://danielchifamba.github.io/inkdown)
[![License](https://img.shields.io/badge/license-MIT-57ab5a?style=flat-square)](./LICENSE)
[![Made with HTML](https://img.shields.io/badge/built%20with-HTML%20%2B%20JS-f69d50?style=flat-square)](#)
[![Zero deps](https://img.shields.io/badge/zero-build%20tools-b083f0?style=flat-square)](#)

<br>

</div>

---

## ✦ What is Inkdown?

**Inkdown** is a single-file, zero-dependency markdown studio that runs entirely in the browser.  
It renders your markdown exactly how GitHub does — tables, task lists, fenced code blocks, badges, everything.  
Use it to write READMEs, docs, notes, or anything in markdown, then save or export the result.

Hosted on GitHub Pages. No server. No backend. No data collected.

---

## ✨ Features

| | Feature | Detail |
|---|---|---|
| ⚡ | **Live preview** | Renders as you type, zero lag |
| 🎨 | **GitHub-flavored markdown** | Tables, task lists, strikethrough, code fences |
| 🛠 | **Quick-insert toolbar** | Headings, bold, italic, links, images, tables, badges, collapsible blocks |
| 🏷 | **Shield badge builder** | Build `img.shields.io` badges with a GUI — no memorising syntax |
| 💾 | **Open & save files** | Load `.md` / `.markdown` / `.txt` files directly from disk |
| 📤 | **Export HTML** | Copy the fully rendered HTML to clipboard |
| 🖥 | **Split / Editor / Preview modes** | Drag the divider or toggle modes |
| 🌑 | **Dark by default** | Easy on the eyes, always |
| 📦 | **Single HTML file** | The entire app is `index.html` — no build step, no npm, no config |

---

## 🚀 Getting Started

### Option 1 — Use it online (recommended)

👉 **[Open Inkdown on GitHub Pages](https://danielchifamba.github.io/inkdown)**

No install needed.

---

### Option 2 — Run locally

```bash
git clone https://github.com/danielChifamba/inkdown.git
cd inkdown
# Just open the file — no server needed
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

That's it. The whole app is `index.html`.

---

## 🛠 Toolbar Reference

| Button | What it inserts | Keyboard shortcut |
| :--- | :--- | :--- |
| `# H1` | Top-level heading | — |
| `## H2` | Section heading | — |
| `### H3` | Sub-section heading | — |
| **B** | Bold text | `Ctrl+B` |
| *I* | Italic text | `Ctrl+I` |
| ~~S~~ | Strikethrough | — |
| `` `code` `` | Inline code | — |
| ❝ Quote | Blockquote | — |
| ― HR | Horizontal rule | — |
| `</>` Code Block | Fenced code block (auto lang-select) | — |
| • List | Unordered list | — |
| 1. List | Ordered list | — |
| ☑ Tasks | Task list with checked/unchecked items | — |
| 🔗 Link | Link dialog (text + URL) | — |
| 🖼 Image | Image dialog (alt + URL) | — |
| ⊞ Table | Table builder (cols × rows + alignment) | — |
| ▾ Details | Collapsible `<details>` block | — |
| 🏷 Badge | shields.io badge builder GUI | — |

---

## 📁 Project Structure

```
inkdown/
├── css/
  ├── inkdown.css
  └── inkdown-responsive.css
├── js/
  ├── inkdown.js
  └── inkdown-responsive.js
├── index.html          # The entire app entry
├── README.md           # This file
└── LICENSE             # MIT
```

No dependencies to install. No `package.json`. No build step.  
Everything ships in the single `index.html`.

---

## 🔧 Customisation

Since everything lives in one file, customising is straightforward:

**Change the colour palette** — edit the `:root` CSS variables at the top of `inkdown.css`:
```css
:root {
  --accent:  #6cb6ff;   /* blue highlight */
  --green:   #57ab5a;   /* success/active */
  --purple:  #b083f0;   /* secondary accent */
  --orange:  #f69d50;   /* warnings / unsaved dot */
}
```

**Add a new quick-insert button** — add a `<button class="tbtn-tool" data-insert="your-key">` in the toolbar, then add the handler in the `SNIPPETS` object in the JS section.

**Change the preview font** — swap out the `--serif` variable or the Google Fonts import.

---

## 🛡 Privacy

- **No data is ever sent anywhere.** Everything runs in your browser.
- No analytics, no tracking, no cookies.
- Files you open never leave your machine.

---

## 📄 License

MIT — free to use, modify, and distribute. See [LICENSE](./LICENSE).

---

<div align="center">

Made with ♥ &nbsp;·&nbsp; [Open Inkdown →](https://danielchifamba.github.io/inkdown)

</div>
