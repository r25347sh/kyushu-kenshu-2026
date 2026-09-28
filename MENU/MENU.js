/**
 * kyushu-kenshu-2026 Radial Menu + Hamburger FAB
 * モバイルファースト: 展開座標のクランプを最大半径ベースで正確に
 */
(function () {
  'use strict';

  function getBase() {
    var p = location.pathname || '';
    if (p.indexOf('/kyushu-kenshu-2026/') === 0 || p === '/kyushu-kenshu-2026') return '/kyushu-kenshu-2026/';
    if (location.protocol === 'file:') {
      var depth = 0;
      if (p.match(/\/day[1-4]\//) || p.match(/\/(packing|rules)\//)) depth = 1;
      return depth === 1 ? '../' : './';
    }
    return '/kyushu-kenshu-2026/';
  }

  var BASE = getBase();

  function url(path) {
    if (!path) return '#';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === '/') {
      return path.indexOf('/kyushu-kenshu-2026') === 0 ? path : '/kyushu-kenshu-2026' + path;
    }
    return BASE + path.replace(/^\.\//, '');
  }

  function buildMenuData() {
    return [
      { label: 'ホーム', icon: '🏠', url: url('index.html') },
      { label: '1日目', icon: '①', url: url('day1/index.html') },
      { label: '2日目', icon: '②', url: url('day2/index.html') },
      { label: '3日目', icon: '③', url: url('day3/index.html') },
      { label: '4日目', icon: '④', url: url('day4/index.html') },
      {
        label: 'スポット', icon: '📍', items: [
          { label: '宇佐神宮', icon: '⛩️', url: url('day1/usa-jingu.html') },
          { label: '青の洞門', icon: '🚪', url: url('day1/aono-domon.html') },
          { label: '高千穂', icon: '🏞️', url: url('day2/takachiho.html') },
          { label: '知覧', icon: '✈️', url: url('day3/chiran.html') },
          { label: '長崎鼻', icon: '🌊', url: url('day3/nagasaki-hana.html') },
          { label: '鹿児島', icon: '🌋', url: url('day4/kagoshima.html') }
        ]
      },
      { label: '持ち物', icon: '🧳', url: url('packing/index.html') },
      { label: 'ルール', icon: '📋', url: url('rules/index.html') }
    ];
  }

  var LONG_PRESS_MS = 380;
  var TRIPLE_TAP_DELAY_MS = 320;
  var MOVE_THRESHOLD = 10;
  var menuEl, itemsContainer, orbitsContainer, coreBtn;
  var timer, startX, startY, isOpen = false, menuStack = [];
  var pieDisabled = false;
  var tapCount = 0, tapTimer = null;

  function clearTextSelection() {
    try {
      var sel = window.getSelection && window.getSelection();
      if (sel) {
        if (typeof sel.removeAllRanges === 'function') sel.removeAllRanges();
        else if (typeof sel.empty === 'function') sel.empty();
      }
      if (document.activeElement && document.activeElement.blur) {
        var tag = (document.activeElement.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
          document.activeElement.blur();
        }
      }
    } catch (err) { /* ignore */ }
  }

  function clearTextSelectionSoon() {
    clearTextSelection();
    requestAnimationFrame(function () {
      clearTextSelection();
      setTimeout(clearTextSelection, 0);
      setTimeout(clearTextSelection, 50);
      setTimeout(clearTextSelection, 120);
    });
  }

  function viewportSize() {
    var vv = window.visualViewport;
    if (vv && vv.width && vv.height) {
      return { w: vv.width, h: vv.height, ox: vv.offsetLeft || 0, oy: vv.offsetTop || 0 };
    }
    return { w: window.innerWidth, h: window.innerHeight, ox: 0, oy: 0 };
  }

  /** アイテム数に応じたシェル。モバイルは半径を抑えて画面内に収める */
  function shellConfig(itemCount) {
    var vp = viewportSize();
    var w = vp.w;
    var h = vp.h;
    var n = itemCount || 8;
    var maxR;
    if (w < 380) {
      maxR = Math.min(100, Math.floor(Math.min(w, h) * 0.32));
      return {
        caps: [Math.min(n, 6), 8, 12],
        radii: [Math.round(maxR * 0.55), maxR, Math.round(maxR * 1.15)],
        margin: maxR + 36
      };
    }
    if (w < 480) {
      maxR = Math.min(120, Math.floor(Math.min(w, h) * 0.34));
      return {
        caps: [Math.min(n, 6), 9, 12],
        radii: [Math.round(maxR * 0.55), maxR, Math.round(maxR * 1.2)],
        margin: maxR + 40
      };
    }
    if (w < 720) {
      return { caps: [6, 9, 13], radii: [100, 155, 210], margin: 155 };
    }
    return { caps: [6, 10, 14], radii: [118, 190, 250], margin: 175 };
  }

  function navigateWithDelay(href) {
    closeMenu();
    closeHamburger();
    setTimeout(function () { location.href = href; }, 160);
  }

  function calculateShellLayout(items) {
    var cfg = shellConfig(items.length);
    var layout = [], remaining = items.length, itemIdx = 0;
    for (var sIdx = 0; sIdx < cfg.caps.length && remaining > 0; sIdx++) {
      var count = Math.min(remaining, cfg.caps[sIdx]);
      var radius = cfg.radii[sIdx];
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        layout.push({
          item: items[itemIdx],
          x: Math.round(Math.cos(angle) * radius),
          y: Math.round(Math.sin(angle) * radius),
          shellIndex: sIdx,
          radius: radius
        });
        itemIdx++;
      }
      remaining -= count;
    }
    return layout;
  }

  function renderMenuLevel(items) {
    if (!itemsContainer) return;
    var old = itemsContainer.querySelectorAll('.rm-item');
    for (var i = 0; i < old.length; i++) {
      old[i].classList.remove('rendered');
      (function (el) {
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
      })(old[i]);
    }
    orbitsContainer.innerHTML = '';
    var layout = calculateShellLayout(items);
    var activeShells = {};
    layout.forEach(function (data, index) {
      activeShells[data.shellIndex] = data.radius;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '');
      btn.setAttribute('data-label', data.item.label);
      btn.setAttribute('aria-label', data.item.label);
      btn.innerHTML = data.item.icon || '•';
      btn.style.setProperty('--x', data.x + 'px');
      btn.style.setProperty('--y', data.y + 'px');
      btn.style.transitionDelay = (index * 0.022) + 's';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (data.item.items && data.item.items.length) {
          menuStack.push(items);
          renderMenuLevel(data.item.items);
        } else if (data.item.url) {
          navigateWithDelay(data.item.url);
        }
      });
      itemsContainer.appendChild(btn);
      requestAnimationFrame(function () {
        setTimeout(function () { btn.classList.add('rendered'); }, 12);
      });
    });
    Object.keys(activeShells).forEach(function (sIdx) {
      var radius = activeShells[sIdx];
      var orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      var d = radius * 2;
      orbit.style.width = d + 'px';
      orbit.style.height = d + 'px';
      orbit.style.marginTop = -radius + 'px';
      orbit.style.marginLeft = -radius + 'px';
      orbitsContainer.appendChild(orbit);
    });
    coreBtn.classList.toggle('visible', menuStack.length > 0);
  }

  function createMenuDOM() {
    if (document.querySelector('.radial-menu-wrapper')) {
      menuEl = document.querySelector('.radial-menu-wrapper');
      itemsContainer = menuEl.querySelector('.rm-items') || menuEl;
      orbitsContainer = menuEl.querySelector('.rm-orbits') || orbitsContainer;
      coreBtn = menuEl.querySelector('.rm-core-btn') || coreBtn;
      return;
    }
    menuEl = document.createElement('div');
    menuEl.className = 'radial-menu-wrapper';
    menuEl.setAttribute('role', 'navigation');
    menuEl.setAttribute('aria-label', '放射状メニュー');
    orbitsContainer = document.createElement('div');
    orbitsContainer.className = 'rm-orbits';
    menuEl.appendChild(orbitsContainer);
    itemsContainer = document.createElement('div');
    itemsContainer.className = 'rm-items';
    menuEl.appendChild(itemsContainer);
    coreBtn = document.createElement('button');
    coreBtn.type = 'button';
    coreBtn.className = 'rm-core-btn';
    coreBtn.innerHTML = '←';
    coreBtn.setAttribute('aria-label', '一つ戻る');
    coreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuStack.length) renderMenuLevel(menuStack.pop());
      else closeMenu();
    });
    menuEl.appendChild(coreBtn);
    document.body.appendChild(menuEl);
  }

  /** タップ座標を画面内にクランプ（ラベル余白込み） */
  function clampMenuOrigin(x, y, itemCount) {
    var vp = viewportSize();
    var cfg = shellConfig(itemCount);
    var maxR = cfg.radii[Math.min(cfg.radii.length - 1, 1)] || cfg.radii[0];
    var labelPad = 40;
    var m = maxR + labelPad;
    var cx = typeof x === 'number' ? x : vp.w / 2;
    var cy = typeof y === 'number' ? y : vp.h / 2;
    // visualViewport オフセットを考慮（モバイル URL バー等）
    var left = Math.max(m, Math.min(cx, vp.w - m)) + (vp.ox || 0);
    var top = Math.max(m, Math.min(cy, vp.h - m)) + (vp.oy || 0);
    // 極端に狭い画面では中央固定
    if (vp.w < m * 2 + 8) left = vp.w / 2 + (vp.ox || 0);
    if (vp.h < m * 2 + 8) top = vp.h / 2 + (vp.oy || 0);
    return { left: left, top: top };
  }

  function openMenu(x, y) {
    if (!menuEl) createMenuDOM();
    clearTextSelectionSoon();
    var data = buildMenuData();
    var origin = clampMenuOrigin(x, y, data.length);
    menuEl.style.left = origin.left + 'px';
    menuEl.style.top = origin.top + 'px';
    menuEl.classList.add('active');
    isOpen = true;
    menuStack = [];
    renderMenuLevel(data);
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    if (itemsContainer) {
      itemsContainer.querySelectorAll('.rm-item').forEach(function (i) {
        i.classList.remove('rendered');
      });
    }
    if (coreBtn) coreBtn.classList.remove('visible');
    isOpen = false;
  }

  function mountFab() {
    if (document.querySelector('.menu-fab')) return;
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'menu-fab';
    fab.setAttribute('aria-label', 'メニューを開く');
    fab.innerHTML = '☰';
    document.body.appendChild(fab);
    fab.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openHamburger();
    });
  }

  function initEvents() {
    document.addEventListener('pointerdown', function (e) {
      var t = e.target;
      if (t.closest && (
        t.closest('.menu-fab') ||
        t.closest('.radial-menu-wrapper') ||
        t.closest('#ham-panel') ||
        t.closest('#ham-overlay') ||
        t.closest('#kk-near-badge') ||
        t.closest('.rt-theme-ctrl') ||
        t.closest('a') ||
        t.closest('button') ||
        t.closest('input') ||
        t.closest('textarea') ||
        t.closest('select')
      )) return;

      if (isOpen && menuEl && !menuEl.contains(t)) {
        closeMenu();
        return;
      }

      startX = e.clientX;
      startY = e.clientY;
      tapCount++;
      clearTimeout(tapTimer);
      if (tapCount >= 3) {
        clearTimeout(timer);
        timer = null;
        tapCount = 0;
        if (!pieDisabled) {
          clearTextSelectionSoon();
          openMenu(startX, startY);
        }
        return;
      }
      tapTimer = setTimeout(function () { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);

      if (pieDisabled) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (pieDisabled) return;
        tapCount = 0;
        clearTextSelectionSoon();
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener('pointermove', function (e) {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(timer);
        timer = null;
      }
    }, { passive: true });

    document.addEventListener('pointerup', function () {
      if (timer && !isOpen) {
        clearTimeout(timer);
        timer = null;
      }
    }, { passive: true });

    document.addEventListener('pointercancel', function () {
      clearTimeout(timer);
      timer = null;
    }, { passive: true });

    document.addEventListener('selectstart', function (e) {
      if (isOpen || timer) {
        e.preventDefault();
        clearTextSelection();
      }
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (pieDisabled) return;
        if (isOpen) closeMenu();
        else openMenu();
      }
      if (e.key === 'Escape') {
        closeHamburger();
        closeMenu();
      }
    });

    window.addEventListener('resize', function () {
      if (isOpen && !menuStack.length) {
        var data = buildMenuData();
        var origin = clampMenuOrigin(window.innerWidth / 2, window.innerHeight / 2, data.length);
        menuEl.style.left = origin.left + 'px';
        menuEl.style.top = origin.top + 'px';
        renderMenuLevel(data);
      }
    });
  }

  function ensureHamburgerUI() {
    if (document.getElementById('ham-overlay')) return;
    var style = document.createElement('style');
    style.id = 'ham-style';
    style.textContent =
      '#ham-overlay{position:fixed;inset:0;z-index:2147483000;display:none;background:rgba(5,8,14,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}' +
      '#ham-overlay.open{display:block}' +
      '#ham-panel{position:fixed;inset:0;z-index:2147483001;display:none;flex-direction:column;background:var(--rt-bg,#0b0e14);color:var(--rt-text,#e8eef7);padding:max(1rem,env(safe-area-inset-top)) max(1rem,env(safe-area-inset-right)) calc(1.5rem + env(safe-area-inset-bottom)) max(1rem,env(safe-area-inset-left));overflow:auto;-webkit-overflow-scrolling:touch}' +
      '#ham-panel.open{display:flex}' +
      '#ham-list{display:flex;flex-direction:column;gap:.45rem;padding-bottom:2rem}' +
      '.ham-link,.ham-group-btn{display:block;width:100%;text-align:left;padding:.9rem 1rem;border-radius:8px;background:var(--rt-card,#151a24);border:1px solid color-mix(in srgb,var(--rt-accent,#c9a227) 35%,transparent);color:var(--rt-text,#f0f4fa);text-decoration:none;font:inherit;font-weight:700;font-size:0.95rem;cursor:pointer;letter-spacing:0.03em;touch-action:manipulation;min-height:44px}' +
      '.ham-link:active,.ham-group-btn:active{background:var(--rt-accent,#c9a227);color:var(--rt-bg,#0b0e14)}' +
      '.ham-sub{display:none;flex-direction:column;gap:.28rem;padding:0.35rem 0 0.35rem 0.65rem}' +
      '.ham-sub.open{display:flex}' +
      '.ham-sub a{color:var(--rt-text,#e8eef7);text-decoration:none;padding:.7rem .75rem;border-radius:8px;font-weight:600;font-size:0.88rem;background:var(--rt-bg-soft,#12161f);border:1px solid rgba(255,255,255,0.08);touch-action:manipulation;min-height:44px;display:flex;align-items:center}' +
      '.ham-close{border:1px solid color-mix(in srgb,var(--rt-accent,#c9a227) 50%,transparent);background:var(--rt-card,#151a24);color:var(--rt-accent,#c9a227);width:44px;height:44px;border-radius:8px;cursor:pointer;font-size:1.15rem;font-weight:700;touch-action:manipulation;flex-shrink:0}' +
      '#ham-title{font-family:Shippori Mincho,serif;font-weight:700;font-size:1.1rem;letter-spacing:0.12em;color:var(--rt-accent,#c9a227)}';
    document.head.appendChild(style);

    var ov = document.createElement('div');
    ov.id = 'ham-overlay';
    var panel = document.createElement('div');
    panel.id = 'ham-panel';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.1rem;gap:1rem">' +
      '<div id="ham-title">九州研修 MENU</div>' +
      '<button type="button" class="ham-close" id="ham-close" aria-label="閉じる">✕</button></div>' +
      '<div id="ham-list"></div>';
    document.body.appendChild(ov);
    document.body.appendChild(panel);
    document.getElementById('ham-close').addEventListener('click', closeHamburger);
    ov.addEventListener('click', closeHamburger);
  }

  function openHamburger() {
    ensureHamburgerUI();
    pieDisabled = true;
    closeMenu();
    clearTextSelectionSoon();
    var list = document.getElementById('ham-list');
    list.innerHTML = '';
    buildMenuData().forEach(function (item) {
      if (item.items && item.items.length) {
        var wrap = document.createElement('div');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ham-group-btn';
        btn.textContent = (item.icon ? item.icon + ' ' : '') + item.label;
        var sub = document.createElement('div');
        sub.className = 'ham-sub';
        item.items.forEach(function (subItem) {
          var a = document.createElement('a');
          a.href = subItem.url || '#';
          a.textContent = (subItem.icon ? subItem.icon + ' ' : '') + subItem.label;
          sub.appendChild(a);
        });
        btn.addEventListener('click', function () {
          sub.classList.toggle('open');
        });
        wrap.appendChild(btn);
        wrap.appendChild(sub);
        list.appendChild(wrap);
      } else {
        var a = document.createElement('a');
        a.className = 'ham-link';
        a.href = item.url || '#';
        a.textContent = (item.icon ? item.icon + ' ' : '') + item.label;
        list.appendChild(a);
      }
    });
    document.getElementById('ham-overlay').classList.add('open');
    document.getElementById('ham-panel').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeHamburger() {
    var ov = document.getElementById('ham-overlay');
    var panel = document.getElementById('ham-panel');
    if (ov) ov.classList.remove('open');
    if (panel) panel.classList.remove('open');
    pieDisabled = false;
    document.body.style.overflow = '';
  }

  function boot() {
    BASE = getBase();
    createMenuDOM();
    initEvents();
    mountFab();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.KKMenu = {
    open: openMenu,
    close: closeMenu,
    openHamburger: openHamburger,
    closeHamburger: closeHamburger,
    clearTextSelection: clearTextSelection
  };
})();
