/**
 * kyushu-kenshu-2026 — theme-control.js
 * ダーク / クラシック / システム（デフォルト: システム）
 * localStorage: kk-color-mode, kk-atmosphere
 */
(function () {
  'use strict';

  var STORAGE_MODE = 'kk-color-mode';
  var STORAGE_ATM = 'kk-atmosphere';
  var ROOT = document.documentElement;
  var VALID = { dark: 1, classic: 1, system: 1 };

  function readMode() {
    try {
      var m = localStorage.getItem(STORAGE_MODE);
      if (m === 'light') return 'classic';
      if (VALID[m]) return m;
    } catch (e) {}
    return 'system';
  }

  function readAtmosphere() {
    try {
      var v = localStorage.getItem(STORAGE_ATM);
      if (v === '0' || v === 'false' || v === 'off') return false;
      if (v === '1' || v === 'true' || v === 'on') return true;
    } catch (e) {}
    return true;
  }

  function systemPrefersDark() {
    try {
      if (!window.matchMedia) return false;
      return !!window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  }

  function resolveScheme(mode) {
    if (mode === 'classic') return 'classic';
    if (mode === 'system') return systemPrefersDark() ? 'dark' : 'classic';
    return 'dark';
  }

  function flashNoTransition() {
    ROOT.classList.add('rt-theme-switching');
    void ROOT.offsetHeight;
    window.setTimeout(function () {
      ROOT.classList.remove('rt-theme-switching');
    }, 80);
  }

  function applyShell(mode, atmosphereOn, instant) {
    if (instant !== false) flashNoTransition();
    var scheme = resolveScheme(mode);
    ROOT.setAttribute('data-color-mode', mode);
    ROOT.setAttribute('data-color-scheme', scheme);
    ROOT.setAttribute('data-atmosphere', atmosphereOn ? 'on' : 'off');
    try {
      ROOT.style.colorScheme = scheme === 'dark' ? 'dark' : 'light';
    } catch (e) {}
    return scheme;
  }

  function saveMode(mode) {
    try { localStorage.setItem(STORAGE_MODE, mode); } catch (e) {}
  }

  function saveAtmosphere(on) {
    try { localStorage.setItem(STORAGE_ATM, on ? '1' : '0'); } catch (e) {}
  }

  var state = {
    mode: readMode(),
    atmosphere: readAtmosphere()
  };
  applyShell(state.mode, state.atmosphere, false);

  function notifyThemeEngine() {
    if (window.KKTheme && typeof window.KKTheme.tick === 'function') {
      window.KKTheme.tick();
    }
    document.dispatchEvent(new CustomEvent('kk-theme-change', {
      detail: {
        mode: state.mode,
        scheme: resolveScheme(state.mode),
        atmosphere: state.atmosphere
      }
    }));
  }

  function setMode(mode) {
    if (!VALID[mode]) return;
    state.mode = mode;
    saveMode(mode);
    applyShell(state.mode, state.atmosphere, true);
    syncUI();
    notifyThemeEngine();
  }

  function setAtmosphere(on) {
    state.atmosphere = !!on;
    saveAtmosphere(state.atmosphere);
    applyShell(state.mode, state.atmosphere, true);
    syncUI();
    notifyThemeEngine();
  }

  var panelEl = null;
  var triggerEl = null;

  function sunSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4.2"/>' +
      '<path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6"/>' +
      '</svg>';
  }

  function syncUI() {
    if (!panelEl) return;
    panelEl.querySelectorAll('.rt-theme-mode').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-mode') === state.mode);
    });
    var chk = panelEl.querySelector('#rt-atm-check');
    if (chk) chk.checked = state.atmosphere;
  }

  function closePanel() {
    if (!panelEl || !triggerEl) return;
    panelEl.classList.remove('is-open');
    triggerEl.setAttribute('aria-expanded', 'false');
  }

  function openPanel() {
    if (!panelEl || !triggerEl) return;
    panelEl.classList.add('is-open');
    triggerEl.setAttribute('aria-expanded', 'true');
  }

  function togglePanel() {
    if (panelEl && panelEl.classList.contains('is-open')) closePanel();
    else openPanel();
  }

  function injectUI() {
    if (document.getElementById('rt-theme-ctrl')) return;

    var wrap = document.createElement('div');
    wrap.className = 'rt-theme-ctrl';
    wrap.id = 'rt-theme-ctrl';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rt-theme-trigger';
    btn.id = 'rt-theme-trigger';
    btn.setAttribute('aria-label', 'テーマ設定');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'rt-theme-panel');
    btn.title = 'テーマ設定';
    btn.innerHTML = sunSVG();
    triggerEl = btn;

    var panel = document.createElement('div');
    panel.className = 'rt-theme-panel';
    panel.id = 'rt-theme-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'カラーテーマ');
    panel.innerHTML =
      '<div class="rt-theme-modes" role="group" aria-label="カラーモード">' +
        '<button type="button" class="rt-theme-mode" data-mode="dark">ダーク</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="classic">クラシック</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="system">システム</button>' +
      '</div>' +
      '<div class="rt-theme-sep" aria-hidden="true"></div>' +
      '<label class="rt-atm-toggle" for="rt-atm-check">' +
        '<span class="rt-atm-toggle-label">時間・天気連動</span>' +
        '<span class="rt-atm-switch">' +
          '<input type="checkbox" id="rt-atm-check" />' +
          '<span class="rt-atm-track"><span class="rt-atm-thumb"></span></span>' +
        '</span>' +
      '</label>';
    panelEl = panel;

    wrap.appendChild(btn);
    wrap.appendChild(panel);

    var header = document.querySelector('.site-header');
    if (header) {
      header.appendChild(wrap);
    } else {
      wrap.style.position = 'fixed';
      wrap.style.top = '0.85rem';
      wrap.style.right = '0.85rem';
      document.body.appendChild(wrap);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePanel();
    });

    panel.querySelectorAll('.rt-theme-mode').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        setMode(b.getAttribute('data-mode'));
      });
    });

    var chk = panel.querySelector('#rt-atm-check');
    if (chk) {
      chk.addEventListener('change', function () {
        setAtmosphere(chk.checked);
      });
    }

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });

    syncUI();
  }

  function reapplySystemIfNeeded() {
    if (state.mode !== 'system') return;
    var next = resolveScheme('system');
    var cur = ROOT.getAttribute('data-color-scheme');
    if (cur !== next) {
      applyShell(state.mode, state.atmosphere, true);
      notifyThemeEngine();
    } else {
      /* scheme は同じでも color-scheme / 属性を再同期 */
      applyShell(state.mode, state.atmosphere, false);
    }
  }

  if (window.matchMedia) {
    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (state.mode === 'system') {
          applyShell(state.mode, state.atmosphere, true);
          notifyThemeEngine();
        }
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    } catch (e) {}
  }

  /* bfcache 復帰・タブ復帰時にシステム設定を再読込（iOS Safari 対策） */
  window.addEventListener('pageshow', function () {
    reapplySystemIfNeeded();
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) reapplySystemIfNeeded();
  });

  function boot() {
    /* ヘッドの早期スクリプト後でもう一度確定 */
    applyShell(state.mode, state.atmosphere, false);
    injectUI();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.KKThemeControl = {
    getMode: function () { return state.mode; },
    getScheme: function () { return resolveScheme(state.mode); },
    isAtmosphereOn: function () { return state.atmosphere; },
    setMode: setMode,
    setAtmosphere: setAtmosphere,
    resolveScheme: resolveScheme
  };
})();
