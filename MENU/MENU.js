/**
 * kyushu-kenshu-2026 Radial Menu + Hamburger FAB
 * アニメ強化: スタッガー展開・閉じアニメ・スクラム・クラシック対応色は CSS 変数
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
  var CLOSE_MS = 300;
  var menuEl, itemsContainer, orbitsContainer, coreBtn, scrimEl;
  var timer, startX, startY, isOpen = false, menuStack = [];
  var pieDisabled = false;
  var tapCount = 0, tapTimer = null;
  var closing = false;

  function portalMount(node) {
    if (window.KKPortal && typeof window.KKPortal.mount === 'function') {
      return window.KKPortal.mount(node);
    }
    document.documentElement.appendChild(node);
    return node;
  }

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
    });
  }

  function viewport() {
    if (window.KKPortal && window.KKPortal.viewport) return window.KKPortal.viewport();
    return {
      w: window.innerWidth || document.documentElement.clientWidth || 0,
      h: window.innerHeight || document.documentElement.clientHeight || 0
    };
  }

  function shellConfig(itemCount) {
    var vp = viewport();
    var w = vp.w;
    var h = vp.h;
    var n = itemCount || 8;
    var maxR;
    if (w < 380) {
      maxR = Math.min(96, Math.floor(Math.min(w, h) * 0.30));
      return {
        caps: [Math.min(n, 6), 8, 12],
        radii: [Math.round(maxR * 0.55), maxR, Math.round(maxR * 1.12)],
        margin: maxR + 36
      };
    }
    if (w < 480) {
      maxR = Math.min(112, Math.floor(Math.min(w, h) * 0.32));
      return {
        caps: [Math.min(n, 6), 9, 12],
        radii: [Math.round(maxR * 0.55), maxR, Math.round(maxR * 1.18)],
        margin: maxR + 40
      };
    }
    if (w < 720) {
      return { caps: [6, 9, 13], radii: [100, 150, 200], margin: 150 };
    }
    return { caps: [6, 10, 14], radii: [118, 185, 245], margin: 170 };
  }

  function navigateWithDelay(href) {
    closeMenu();
    closeHamburger();
    setTimeout(function () { location.href = href; }, 180);
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
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
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
      /* 時計回りに広がるスタッガー */
      btn.style.transitionDelay = (0.04 + index * 0.038) + 's';
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
        setTimeout(function () { btn.classList.add('rendered'); }, 16);
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

  function ensureScrim() {
    if (scrimEl && scrimEl.parentNode) return scrimEl;
    scrimEl = document.createElement('div');
    scrimEl.className = 'rm-scrim';
    scrimEl.setAttribute('aria-hidden', 'true');
    portalMount(scrimEl);
    scrimEl.addEventListener('click', function () {
      closeMenu();
    });
    return scrimEl;
  }

  function setScrim(on) {
    ensureScrim();
    if (on) scrimEl.classList.add('is-on');
    else scrimEl.classList.remove('is-on');
  }

  function createMenuDOM() {
    if (document.querySelector('.radial-menu-wrapper')) {
      menuEl = document.querySelector('.radial-menu-wrapper');
      itemsContainer = menuEl.querySelector('.rm-items') || menuEl;
      orbitsContainer = menuEl.querySelector('.rm-orbits');
      coreBtn = menuEl.querySelector('.rm-core-btn');
      portalMount(menuEl);
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
    portalMount(menuEl);
    ensureScrim();
  }

  function clampMenuOrigin(clientX, clientY, itemCount) {
    var vp = viewport();
    var cfg = shellConfig(itemCount);
    var maxR = cfg.radii[Math.min(1, cfg.radii.length - 1)] || cfg.radii[0];
    var labelPad = 42;
    var m = maxR + labelPad;
    var cx = typeof clientX === 'number' ? clientX : vp.w / 2;
    var cy = typeof clientY === 'number' ? clientY : vp.h / 2;
    var left = Math.max(m, Math.min(cx, vp.w - m));
    var top = Math.max(m, Math.min(cy, vp.h - m));
    if (vp.w < m * 2 + 8) left = vp.w / 2;
    if (vp.h < m * 2 + 8) top = vp.h / 2;
    return { left: left, top: top };
  }

  function openMenu(clientX, clientY) {
    if (closing) return;
    if (!menuEl) createMenuDOM();
    clearTextSelectionSoon();
    var data = buildMenuData();
    var origin = clampMenuOrigin(clientX, clientY, data.length);
    menuEl.classList.remove('is-closing');
    menuEl.style.left = origin.left + 'px';
    menuEl.style.top = origin.top + 'px';
    menuEl.classList.add('active');
    setScrim(true);
    isOpen = true;
    menuStack = [];
    renderMenuLevel(data);
  }

  function closeMenu() {
    if (!menuEl || !isOpen) {
      setScrim(false);
      return;
    }
    if (closing) return;
    closing = true;
    menuEl.classList.add('is-closing');
    setScrim(false);
    if (coreBtn) coreBtn.classList.remove('visible');
    setTimeout(function () {
      menuEl.classList.remove('active');
      menuEl.classList.remove('is-closing');
      if (itemsContainer) {
        itemsContainer.querySelectorAll('.rm-item').forEach(function (i) {
          i.classList.remove('rendered');
        });
      }
      isOpen = false;
      closing = false;
    }, CLOSE_MS);
  }

  function mountFab() {
    var existing = document.querySelector('.menu-fab');
    if (existing) {
      portalMount(existing);
      return existing;
    }
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'menu-fab';
    fab.setAttribute('aria-label', 'メニューを開く');
    fab.innerHTML = '☰';
    portalMount(fab);
    fab.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openHamburger();
    });
    return fab;
  }

  function initEvents() {
    document.addEventListener('pointerdown', function (e) {
      var t = e.target;
      if (t.closest && (
        t.closest('.menu-fab') ||
        t.closest('.radial-menu-wrapper') ||
        t.closest('.rm-scrim') ||
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
      if (isOpen && !menuStack.length && !closing) {
        var data = buildMenuData();
        var vp = viewport();
        var origin = clampMenuOrigin(vp.w / 2, vp.h / 2, data.length);
        menuEl.style.left = origin.left + 'px';
        menuEl.style.top = origin.top + 'px';
        renderMenuLevel(data);
      }
    });
  }

  function ensureHamburgerUI() {
    if (document.getElementById('ham-overlay')) return;

    var ov = document.createElement('div');
    ov.id = 'ham-overlay';
    var panel = document.createElement('div');
    panel.id = 'ham-panel';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.15rem;gap:1rem">' +
      '<div id="ham-title">九州研修 MENU</div>' +
      '<button type="button" class="ham-close" id="ham-close" aria-label="閉じる">✕</button></div>' +
      '<div id="ham-list"></div>';
    document.documentElement.appendChild(ov);
    document.documentElement.appendChild(panel);
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
    buildMenuData().forEach(function (item, idx) {
      if (item.items && item.items.length) {
        var wrap = document.createElement('div');
        wrap.style.animationDelay = (0.05 + idx * 0.04) + 's';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ham-group-btn';
        btn.textContent = (item.icon ? item.icon + ' ' : '') + item.label;
        btn.style.animationDelay = (0.05 + idx * 0.04) + 's';
        var sub = document.createElement('div');
        sub.className = 'ham-sub';
        var inner = document.createElement('div');
        inner.className = 'ham-sub-inner';
        item.items.forEach(function (subItem) {
          var a = document.createElement('a');
          a.href = subItem.url || '#';
          a.textContent = (subItem.icon ? subItem.icon + ' ' : '') + subItem.label;
          inner.appendChild(a);
        });
        sub.appendChild(inner);
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
        a.style.animationDelay = (0.05 + idx * 0.04) + 's';
        list.appendChild(a);
      }
    });
    document.getElementById('ham-overlay').classList.add('open');
    document.getElementById('ham-panel').classList.add('open');
    var fab = document.querySelector('.menu-fab');
    if (fab) fab.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeHamburger() {
    var ov = document.getElementById('ham-overlay');
    var panel = document.getElementById('ham-panel');
    if (ov) ov.classList.remove('open');
    if (panel) panel.classList.remove('open');
    var fab = document.querySelector('.menu-fab');
    if (fab) fab.classList.remove('is-open');
    pieDisabled = false;
    document.body.style.overflow = '';
  }

  function boot() {
    BASE = getBase();
    if (window.KKPortal) window.KKPortal.ensure();
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
