/**
 * kyushu-kenshu-2026 Radial Menu + Hamburger FAB
 * reitansai方式を継承。ベースパスを /kyushu-kenshu-2026/ に適応。
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

  function shellConfig() {
    var w = window.innerWidth;
    if (w < 420) return { caps: [5, 8, 12], radii: [88, 140, 192], margin: 110 };
    if (w < 720) return { caps: [6, 9, 13], radii: [100, 165, 230], margin: 140 };
    return { caps: [6, 10, 14], radii: [118, 190, 262], margin: 180 };
  }

  function navigateWithDelay(href) {
    closeMenu();
    closeHamburger();
    setTimeout(function () { location.href = href; }, 160);
  }

  function calculateShellLayout(items) {
    var cfg = shellConfig();
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

  function openMenu(x, y) {
    if (!menuEl) createMenuDOM();
    clearTextSelectionSoon();
    var margin = shellConfig().margin;
    var cx = typeof x === 'number' ? x : window.innerWidth / 2;
    var cy = typeof y === 'number' ? y : window.innerHeight / 2;
    menuEl.style.left = Math.max(margin, Math.min(cx, window.innerWidth - margin)) + 'px';
    menuEl.style.top = Math.max(margin, Math.min(cy, window.innerHeight - margin)) + 'px';
    menuEl.classList.add('active');
    isOpen = true;
    menuStack = [];
    renderMenuLevel(buildMenuData());
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
      if (isOpen && !menuStack.length) renderMenuLevel(buildMenuData());
    });
  }

  function ensureHamburgerUI() {
    if (document.getElementById('ham-overlay')) return;
    var style = document.createElement('style');
    style.id = 'ham-style';
    style.textContent =
      '#ham-overlay{position:fixed;inset:0;z-index:2147483000;display:none;background:rgba(5,8,14,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}' +
      '#ham-overlay.open{display:block}' +
      '#ham-panel{position:fixed;inset:0;z-index:2147483001;display:none;flex-direction:column;background:var(--rt-bg,#0b0e14);color:var(--rt-text,#e8eef7);padding:1.1rem 1.1rem calc(1.5rem + env(safe-area-inset-bottom));overflow:auto;-webkit-overflow-scrolling:touch}' +
      '#ham-panel.open{display:flex}' +
      '#ham-list{display:flex;flex-direction:column;gap:.45rem;padding-bottom:2rem}' +
      '.ham-link,.ham-group-btn{display:block;width:100%;text-align:left;padding:.9rem 1rem;border-radius:6px;background:var(--rt-card,#151a24);border:1px solid color-mix(in srgb,var(--rt-accent,#c9a227) 35%,transparent);color:var(--rt-text,#f0f4fa);text-decoration:none;font:inherit;font-weight:700;font-size:0.95rem;cursor:pointer;letter-spacing:0.03em;touch-action:manipulation}' +
      '.ham-link:active,.ham-group-btn:active{background:var(--rt-accent,#c9a227);color:var(--rt-bg,#0b0e14)}' +
      '.ham-sub{display:none;flex-direction:column;gap:.28rem;padding:0.35rem 0 0.35rem 0.65rem}' +
      '.ham-sub.open{display:flex}' +
      '.ham-sub a{color:var(--rt-text,#e8eef7);text-decoration:none;padding:.6rem .75rem;border-radius:6px;font-weight:600;font-size:0.88rem;background:var(--rt-bg-soft,#12161f);border:1px solid rgba(255,255,255,0.08);touch-action:manipulation}' +
      '.ham-close{border:1px solid color-mix(in srgb,var(--rt-accent,#c9a227) 50%,transparent);background:var(--rt-card,#151a24);color:var(--rt-accent,#c9a227);width:44px;height:44px;border-radius:6px;cursor:pointer;font-size:1.15rem;font-weight:700;touch-action:manipulation}' +
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
