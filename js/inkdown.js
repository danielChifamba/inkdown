/* ── MARKED CONFIG ──────────────────────────────────────────── */
const renderer = new marked.Renderer();
renderer.code = (code, lang) => {
  let hi = '';
  if (lang && hljs.getLanguage(lang)) {
    try { hi = hljs.highlight(code, { language: lang }).value; }
    catch { hi = hljs.highlightAuto(code).value; }
  } else { hi = hljs.highlightAuto(code).value; }
  const safe = code.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  return `<pre data-lang="${lang||''}"><code class="hljs">${hi}</code><button class="copy-btn" data-c="${safe}">copy</button></pre>`;
};
renderer.checkbox = checked => `<input type="checkbox" ${checked?'checked':''} disabled> `;
marked.use({ renderer, breaks: true, gfm: true });

/* ── ELEMENTS ───────────────────────────────────────────────── */
const ed      = document.getElementById('editor');
const mdOut   = document.getElementById('md-out');
const empty   = document.getElementById('empty');
const stats   = document.getElementById('word-stats');
const lineN   = document.getElementById('line-nums');
const dotU    = document.getElementById('dot-unsaved');
const chipF   = document.getElementById('filename-chip');

let saved = '', currentFile = 'inkdown.md';

/* ── RENDER ─────────────────────────────────────────────────── */
function render() {
  const raw = ed.value;
  if (!raw.trim()) {
    mdOut.innerHTML = '';
    empty.classList.add('show');
  } else {
    empty.classList.remove('show');
    mdOut.innerHTML = DOMPurify.sanitize(marked.parse(raw), {
      ADD_ATTR: ['checked','data-c','data-lang'],
      ADD_TAGS: ['input']
    });
    mdOut.querySelectorAll('.copy-btn').forEach(b => {
      b.addEventListener('click', () => {
        navigator.clipboard.writeText(b.dataset.c.replace(/&amp;/g,'&').replace(/&quot;/g,'"'))
          .then(() => { b.textContent='copied!'; b.classList.add('ok'); setTimeout(()=>{b.textContent='copy';b.classList.remove('ok');},1600); });
      });
    });
  }
  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  const lines = raw.split('\n').length;
  stats.textContent = `${words.toLocaleString()} words · ${lines.toLocaleString()} lines`;
  let ln = '';
  for (let i = 1; i <= lines; i++) ln += i + '\n';
  lineN.textContent = ln;
  dotU.classList.toggle('on', raw !== saved);
}

ed.addEventListener('input', render);
ed.addEventListener('scroll', () => { lineN.scrollTop = ed.scrollTop; });

/* ── TAB / CTRL+S ────────────────────────────────────────────── */
ed.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = ed.selectionStart, end = ed.selectionEnd;
    ed.value = ed.value.slice(0, s) + '  ' + ed.value.slice(end);
    ed.selectionStart = ed.selectionEnd = s + 2;
    render();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveFile(); }
  // Bold shortcut
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); wrapSelection('**','**'); }
  // Italic shortcut
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); wrapSelection('_','_'); }
});

/* ── INSERT HELPERS ──────────────────────────────────────────── */
function insertAt(text, moveCursor = 0) {
  const s = ed.selectionStart;
  const before = ed.value.slice(0, s);
  const after  = ed.value.slice(ed.selectionEnd);
  ed.value = before + text + after;
  const pos = s + text.length + moveCursor;
  ed.selectionStart = ed.selectionEnd = pos;
  ed.focus();
  render();
}

function wrapSelection(before, after, placeholder = 'text') {
  const s = ed.selectionStart, e2 = ed.selectionEnd;
  const sel = ed.value.slice(s, e2) || placeholder;
  const newText = before + sel + after;
  ed.value = ed.value.slice(0, s) + newText + ed.value.slice(e2);
  ed.selectionStart = s + before.length;
  ed.selectionEnd   = s + before.length + sel.length;
  ed.focus();
  render();
}

function insertLineBlock(text) {
  const s = ed.selectionStart;
  const lineStart = ed.value.lastIndexOf('\n', s - 1) + 1;
  const before = ed.value.slice(0, lineStart);
  const rest   = ed.value.slice(lineStart);
  const needsNewline = before.length > 0 && !before.endsWith('\n\n');
  const prefix = needsNewline ? '\n' : '';
  ed.value = before + prefix + text + rest;
  const newPos = (before + prefix + text).length;
  ed.selectionStart = ed.selectionEnd = newPos;
  ed.focus();
  render();
}

/* ── TOOLBAR ACTIONS ──────────────────────────────────────────── */
const SNIPPETS = {
  'h1':         () => insertLineBlock('# '),
  'h2':         () => insertLineBlock('## '),
  'h3':         () => insertLineBlock('### '),
  'bold':       () => wrapSelection('**','**'),
  'italic':     () => wrapSelection('_','_'),
  'strike':     () => wrapSelection('~~','~~'),
  'code-inline':() => wrapSelection('`','`','code'),
  'blockquote': () => insertLineBlock('> '),
  'hr':         () => insertLineBlock('\n---\n'),
  'code-block': () => {
    const s = ed.selectionStart;
    const sel = ed.value.slice(s, ed.selectionEnd) || 'code here';
    const block = '\n```js\n' + sel + '\n```\n';
    const before = ed.value.slice(0, s);
    const after  = ed.value.slice(ed.selectionEnd);
    ed.value = before + block + after;
    ed.selectionStart = before.length + 5;
    ed.selectionEnd   = before.length + 5 + 2; // select 'js'
    ed.focus(); render();
  },
  'ul':         () => insertLineBlock('- Item 1\n- Item 2\n- Item 3\n'),
  'ol':         () => insertLineBlock('1. First\n2. Second\n3. Third\n'),
  'tasklist':   () => insertLineBlock('- [ ] Task one\n- [ ] Task two\n- [x] Done task\n'),
  'link':       () => openModal('link'),
  'image':      () => openModal('img'),
  'table':      () => openModal('table'),
  'details':    () => insertLineBlock('<details>\n<summary>Click to expand</summary>\n\nContent goes here.\n\n</details>\n'),
  'badge':      () => openModal('badge'),
};

document.querySelectorAll('.tbtn-tool[data-insert]').forEach(btn => {
  btn.addEventListener('click', () => {
    const fn = SNIPPETS[btn.dataset.insert];
    if (fn) fn();
  });
});

/* ── MODALS ──────────────────────────────────────────────────── */
function openModal(type) {
  if (type === 'table') {
    document.getElementById('modal-bg').classList.add('show');
  } else if (type === 'link') {
    const m = document.getElementById('link-modal-bg');
    m.style.display = 'flex'; m.classList.remove('hide');
    document.getElementById('lnk-text').value = ed.value.slice(ed.selectionStart, ed.selectionEnd) || '';
    document.getElementById('lnk-url').focus();
  } else if (type === 'img') {
    const m = document.getElementById('img-modal-bg');
    m.style.display = 'flex'; m.classList.remove('hide');
    document.getElementById('img-url').focus();
  } else if (type === 'badge') {
    const m = document.getElementById('badge-modal-bg');
    m.style.display = 'flex'; m.classList.remove('hide');
    document.getElementById('bdg-label').focus();
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  el.classList.remove('show');
  el.style.display = 'none';
  el.classList.add('hide');
}

// Table modal
document.getElementById('modal-bg').addEventListener('click', e => { if (e.target.id==='modal-bg') closeModal('modal-bg'); });
document.getElementById('modal-cancel').addEventListener('click', () => closeModal('modal-bg'));
document.getElementById('modal-insert').addEventListener('click', () => {
  const cols   = Math.max(1, Math.min(10, parseInt(document.getElementById('tbl-cols').value) || 3));
  const rows   = Math.max(1, Math.min(20, parseInt(document.getElementById('tbl-rows').value) || 2));
  const align  = document.getElementById('tbl-align').value;
  const sep    = align === 'center' ? ':---:' : align === 'right' ? '---:' : '---';
  let tbl = '\n';
  // header
  const headers = Array.from({length: cols}, (_,i) => ` Header ${i+1} `);
  tbl += '|' + headers.join('|') + '|\n';
  // separator
  tbl += '|' + Array(cols).fill(` ${sep} `).join('|') + '|\n';
  // rows
  for (let r = 0; r < rows; r++) {
    const cells = Array.from({length: cols}, (_,i) => ` Cell ${r+1}-${i+1} `);
    tbl += '|' + cells.join('|') + '|\n';
  }
  tbl += '\n';
  insertAt(tbl);
  closeModal('modal-bg');
  toast('Table inserted ✓');
});

// Link modal
document.getElementById('lnk-cancel').addEventListener('click', () => closeModal('link-modal-bg'));
document.getElementById('link-modal-bg').addEventListener('click', e => { if (e.target.id==='link-modal-bg') closeModal('link-modal-bg'); });
document.getElementById('lnk-insert').addEventListener('click', () => {
  const txt = document.getElementById('lnk-text').value || 'Link text';
  const url = document.getElementById('lnk-url').value || '#';
  wrapSelection('', '', '');
  insertAt(`[${txt}](${url})`);
  closeModal('link-modal-bg');
  toast('Link inserted ✓');
});

// Image modal
document.getElementById('img-cancel').addEventListener('click', () => closeModal('img-modal-bg'));
document.getElementById('img-modal-bg').addEventListener('click', e => { if (e.target.id==='img-modal-bg') closeModal('img-modal-bg'); });
document.getElementById('img-insert').addEventListener('click', () => {
  const alt = document.getElementById('img-alt').value || 'image';
  const url = document.getElementById('img-url').value || '#';
  insertAt(`\n![${alt}](${url})\n`);
  closeModal('img-modal-bg');
  toast('Image inserted ✓');
});

// Badge modal
document.getElementById('bdg-cancel').addEventListener('click', () => closeModal('badge-modal-bg'));
document.getElementById('badge-modal-bg').addEventListener('click', e => { if (e.target.id==='badge-modal-bg') closeModal('badge-modal-bg'); });
document.getElementById('bdg-insert').addEventListener('click', () => {
  const label = encodeURIComponent(document.getElementById('bdg-label').value || 'build');
  const msg   = encodeURIComponent(document.getElementById('bdg-msg').value || 'passing');
  const color = document.getElementById('bdg-color').value;
  const link  = document.getElementById('bdg-link').value;
  const imgMd = `![${label}-${msg}](https://img.shields.io/badge/${label}-${msg}-${color})`;
  const full  = link ? `[${imgMd}](${link})` : imgMd;
  insertAt(full + ' ');
  closeModal('badge-modal-bg');
  toast('Badge inserted ✓');
});

/* ── OPEN / SAVE ─────────────────────────────────────────────── */
document.getElementById('btn-open').addEventListener('click', () => document.getElementById('file-in').click());
document.getElementById('file-in').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    ed.value = ev.target.result;
    saved = ev.target.result;
    currentFile = f.name;
    chipF.textContent = f.name;
    render(); toast(`Opened: ${f.name}`);
  };
  r.readAsText(f); e.target.value = '';
});

function saveFile() {
  const content = ed.value;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.getElementById('dl-link');
  a.href = url; a.download = currentFile; a.click();
  URL.revokeObjectURL(url);
  saved = content;
  dotU.classList.remove('on');
  toast(`Saved: ${currentFile}`);
}
document.getElementById('btn-save').addEventListener('click', saveFile);

document.getElementById('btn-copy-html').addEventListener('click', () => {
  const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Exported</title></head><body>${mdOut.innerHTML}</body></html>`;
  navigator.clipboard.writeText(full).then(() => toast('HTML exported to clipboard ✓'));
});

/* ── VIEW MODES ──────────────────────────────────────────────── */
document.querySelectorAll('.vtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.vtab').forEach(t => t.classList.remove('on'));
    tab.classList.add('on');
    const m = tab.dataset.m;
    const ep = document.getElementById('editor-pane');
    const pp = document.getElementById('preview-pane');
    const dv = document.getElementById('divider');
    ep.classList.remove('hide'); pp.classList.remove('hide'); dv.classList.remove('hide');
    if (m === 'editor') { pp.classList.add('hide'); dv.classList.add('hide'); ep.style.width='100%'; }
    else if (m === 'preview') { ep.classList.add('hide'); dv.classList.add('hide'); }
    else { ep.style.width='50%'; }
  });
});

/* ── DIVIDER DRAG ─────────────────────────────────────────────── */
const div = document.getElementById('divider');
const ep  = document.getElementById('editor-pane');
const pg  = document.getElementById('panes');
let drag = false;
div.addEventListener('mousedown', () => { drag=true; div.classList.add('active'); document.body.style.cssText='cursor:col-resize;user-select:none'; });
document.addEventListener('mousemove', e => {
  if (!drag) return;
  const r = pg.getBoundingClientRect();
  const pct = Math.max(18, Math.min(82, ((e.clientX - r.left) / r.width) * 100));
  ep.style.width = pct + '%';
});
document.addEventListener('mouseup', () => { if (!drag) return; drag=false; div.classList.remove('active'); document.body.style.cssText=''; });

/* ── TOAST ───────────────────────────────────────────────────── */
let toastT;
function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show'); clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ── DEFAULT CONTENT ──────────────────────────────────────────── */
ed.value = `# Welcome to Inkdown ✦

> A beautiful, distraction-free markdown editor with live GitHub-flavored preview.

## Features at a Glance

- **Live preview** — see your rendered markdown instantly
- **Quick-insert toolbar** — headings, bold, tables, badges, and more
- **GitHub-flavored** — tables, task lists, syntax-highlighted code
- **Open & save** — work with real \`.md\` files from your disk
- **Export HTML** — copy the rendered output to clipboard

---

## Quick Start

Use the **toolbar above** to insert elements or type markdown directly.

### Code Blocks

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}! 👋"

print(greet("world"))
\`\`\`

### Tables

| Feature         | Status  | Notes               |
| :-------------- | :-----: | ------------------: |
| Live preview    | ✅      | Zero delay          |
| Code highlight  | ✅      | 180+ languages      |
| File open/save  | ✅      | .md, .markdown, .txt |
| Export HTML     | ✅      | Full rendered output |

### Task List

- [x] Open a \`.md\` file
- [x] Enjoy the live preview
- [ ] Star the repo on GitHub ⭐

---

*Built with ♥ — [inkdown on GitHub](https://github.com/danielChifamba)*
`;
render();
