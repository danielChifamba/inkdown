/* ============================================================
   inkdown-responsive.js
   Call this AFTER your main <script> block, or link it as
   the last <script> tag before </body>.
   ============================================================ */

(function () {
  'use strict';

  /* ── CONFIG ───────────────────────────────────────────────── */
  const MOBILE_BP = 600;   // px — matches CSS breakpoint
  const TABLET_BP = 900;

  /* ── ELEMENTS ─────────────────────────────────────────────── */
  const panes      = document.getElementById('panes');
  const editorPane = document.getElementById('editor-pane');
  const previewPane= document.getElementById('preview-pane');
  const divider    = document.getElementById('divider');
  const viewTabs   = document.querySelectorAll('.vtab');
  const editor     = document.getElementById('editor');

  /* ── INJECT MOBILE BOTTOM NAV ─────────────────────────────── */
  const mobileNav = document.createElement('div');
  mobileNav.id = 'mobile-nav';
  mobileNav.innerHTML = `
    <button class="mnav-btn active" data-mv="editor" aria-label="Editor">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
      EDITOR
    </button>
    <button class="mnav-btn" data-mv="preview" aria-label="Preview">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      PREVIEW
    </button>
    <button class="mnav-btn" data-mv="open" aria-label="Open file">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      OPEN
    </button>
    <button class="mnav-btn" data-mv="save" aria-label="Save file">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      SAVE
    </button>
  `;
  document.body.appendChild(mobileNav);

  /* ── CURRENT MODE STATE ───────────────────────────────────── */
  let currentMode = 'split'; // 'editor' | 'preview' | 'split'

  /* ── APPLY LAYOUT ─────────────────────────────────────────── */
  function applyLayout(mode) {
    currentMode = mode;
    const isMobile = window.innerWidth <= MOBILE_BP;
    const isTablet = window.innerWidth <= TABLET_BP;

    // reset classes
    editorPane.classList.remove('hide');
    previewPane.classList.remove('hide');
    if (divider) divider.classList.remove('hide');
    panes.classList.remove('tablet-split');

    if (isMobile) {
      // On mobile: always single pane, no divider
      if (divider) divider.classList.add('hide');
      if (mode === 'preview') {
        editorPane.classList.add('hide');
        previewPane.classList.remove('hide');
      } else {
        // default: editor
        previewPane.classList.add('hide');
        editorPane.classList.remove('hide');
      }
      editorPane.style.width = '100%';

    } else if (isTablet) {
      if (divider) divider.classList.add('hide');
      if (mode === 'split') {
        panes.classList.add('tablet-split');
        editorPane.style.width = '100%';
        editorPane.style.height = '50%';
      } else if (mode === 'preview') {
        editorPane.classList.add('hide');
        editorPane.style.height = '';
      } else {
        previewPane.classList.add('hide');
        editorPane.style.width = '100%';
        editorPane.style.height = '';
      }

    } else {
      // Desktop: restore split or single pane
      editorPane.style.height = '';
      if (divider) divider.classList.remove('hide');
      if (mode === 'editor') {
        previewPane.classList.add('hide');
        if (divider) divider.classList.add('hide');
        editorPane.style.width = '100%';
      } else if (mode === 'preview') {
        editorPane.classList.add('hide');
        if (divider) divider.classList.add('hide');
      } else {
        editorPane.style.width = '50%';
      }
    }

    // sync desktop view tabs
    viewTabs.forEach(t => {
      t.classList.toggle('on', t.dataset.m === mode);
    });

    // sync mobile nav btns
    document.querySelectorAll('.mnav-btn[data-mv]').forEach(b => {
      b.classList.toggle('active', b.dataset.mv === mode);
    });
  }

  /* ── DESKTOP VIEW TAB SYNC ────────────────────────────────── */
  // Override the existing vtab click handlers to go through applyLayout
  viewTabs.forEach(tab => {
    // Clone to remove existing listeners, then re-add
    const fresh = tab.cloneNode(true);
    tab.parentNode.replaceChild(fresh, tab);
    fresh.addEventListener('click', () => applyLayout(fresh.dataset.m));
  });

  /* ── MOBILE NAV ACTIONS ───────────────────────────────────── */
  mobileNav.addEventListener('click', e => {
    const btn = e.target.closest('.mnav-btn');
    if (!btn) return;
    const mv = btn.dataset.mv;
    if (mv === 'open') {
      document.getElementById('file-in')?.click() ||
      document.getElementById('file-input')?.click();
    } else if (mv === 'save') {
      // trigger the existing save function
      document.getElementById('btn-save')?.click();
    } else {
      applyLayout(mv);
    }
  });

  /* ── SWIPE TO SWITCH PANES (mobile) ───────────────────────── */
  let touchStartX = 0, touchStartY = 0;
  const SWIPE_THRESHOLD  = 60;   // px horizontal movement
  const SWIPE_AXIS_LOCK  = 30;   // px — max vertical drift allowed

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (window.innerWidth > MOBILE_BP) return;       // desktop: ignore
    if (document.activeElement === editor) return;   // typing: ignore

    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);

    if (Math.abs(dx) < SWIPE_THRESHOLD || dy > SWIPE_AXIS_LOCK) return;

    if (dx < 0 && currentMode === 'editor') {
      // swipe left → preview
      applyLayout('preview');
      flashSwipeHint('Preview →');
    } else if (dx > 0 && currentMode === 'preview') {
      // swipe right → editor
      applyLayout('editor');
      flashSwipeHint('← Editor');
    }
  }, { passive: true });

  /* ── SWIPE HINT TOAST ─────────────────────────────────────── */
  let swipeToastShown = 0;
  function flashSwipeHint(msg) {
    // Only show it the first 3 times so it doesn't get annoying
    if (swipeToastShown >= 3) return;
    swipeToastShown++;
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    if (!t || !m) return;
    m.textContent = msg;
    t.classList.add('show');
    clearTimeout(window._swipeToastTimer);
    window._swipeToastTimer = setTimeout(() => t.classList.remove('show'), 1400);
  }

  /* ── RESIZE HANDLER ───────────────────────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Re-apply current mode with new screen dimensions
      applyLayout(currentMode);
      // Auto-promote to split on desktop if user resizes up
      if (window.innerWidth > TABLET_BP && currentMode === 'editor') {
        applyLayout('split');
      }
    }, 120);
  });

  /* ── ORIENTATION CHANGE ───────────────────────────────────── */
  window.addEventListener('orientationchange', () => {
    setTimeout(() => applyLayout(currentMode), 200);
  });

  /* ── AUTO-SCROLL EDITOR WITH PREVIEW (split/tablet) ──────── */
  // When in split mode, scroll the preview to roughly match editor position
  const preview = document.getElementById('preview');
  if (editor && preview) {
    editor.addEventListener('scroll', () => {
      if (currentMode !== 'split') return;
      if (window.innerWidth <= MOBILE_BP) return;
      const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    });
  }

  /* ── KEYBOARD SHORTCUTS ───────────────────────────────────── */
  document.addEventListener('keydown', e => {
    // Ctrl/Cmd + Shift + P  → toggle preview
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      applyLayout(currentMode === 'preview' ? 'split' : 'preview');
    }
    // Ctrl/Cmd + Shift + E  → toggle editor
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      applyLayout(currentMode === 'editor' ? 'split' : 'editor');
    }
    // Escape closes modals
    if (e.key === 'Escape') {
      ['modal-bg','link-modal-bg','img-modal-bg','badge-modal-bg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.remove('show'); el.style.display = 'none'; }
      });
    }
  });

  /* ── INITIAL LAYOUT ───────────────────────────────────────── */
  // Pick sensible default based on screen size
  const initMode = window.innerWidth <= MOBILE_BP ? 'editor' : 'split';
  applyLayout(initMode);

  // Show swipe tip on first mobile load
  if (window.innerWidth <= MOBILE_BP) {
    setTimeout(() => flashSwipeHint('Swipe ← for preview'), 1800);
  }

})();
