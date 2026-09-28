/**
 * kyushu-kenshu-2026 — default.js
 * 共通ユーティリティ・ベースパス・UIポータル
 *
 * 【重要】body に filter が付くと position:fixed が文書基準になる。
 * FAB / 放射状 / 近傍バッジは必ず html 直下の #kk-ui-portal に載せる。
 */
(function () {
  'use strict';

  function getBase() {
    var p = location.pathname || '';
    if (p.indexOf('/kyushu-kenshu-2026/') === 0 || p === '/kyushu-kenshu-2026') {
      return '/kyushu-kenshu-2026/';
    }
    if (location.protocol === 'file:') {
      var depth = 0;
      if (p.match(/\/day[1-4]\//)) depth = 1;
      if (p.match(/\/(packing|rules)\//)) depth = 1;
      return depth === 1 ? '../' : './';
    }
    return '/kyushu-kenshu-2026/';
  }

  window.KK = window.KK || {};
  window.KK.BASE = getBase();

  window.KK.url = function (path) {
    if (!path) return '#';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === '/') {
      return path.indexOf('/kyushu-kenshu-2026') === 0 ? path : '/kyushu-kenshu-2026' + path;
    }
    return window.KK.BASE + path.replace(/^\.\//, '');
  };

  /* ---------- UI Portal（ビューポート固定レイヤー） ---------- */
  var PORTAL_ID = 'kk-ui-portal';

  function ensurePortal() {
    var el = document.getElementById(PORTAL_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = PORTAL_ID;
    el.setAttribute('data-kk-portal', '1');
    el.style.cssText =
      'position:fixed;' +
      'inset:0;' +
      'width:100%;' +
      'height:100%;' +
      'margin:0;padding:0;' +
      'pointer-events:none;' +
      'z-index:2147480000;' +
      'overflow:visible;' +
      'transform:none;' +
      'filter:none;' +
      'perspective:none;';
    document.documentElement.appendChild(el);
    return el;
  }

  function portalMount(node) {
    var portal = ensurePortal();
    if (node && node.parentNode !== portal) portal.appendChild(node);
    return node;
  }

  function viewport() {
    return {
      w: window.innerWidth || document.documentElement.clientWidth || 0,
      h: window.innerHeight || document.documentElement.clientHeight || 0
    };
  }

  ensurePortal();

  window.KKPortal = {
    ensure: ensurePortal,
    mount: portalMount,
    viewport: viewport,
    id: PORTAL_ID
  };

  /* 今日が研修日なら data-today を付与 */
  function markToday() {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    if (y === 2026 && m === 10 && d >= 20 && d <= 23) {
      document.documentElement.setAttribute('data-trip-day', String(d - 19));
      var links = document.querySelectorAll('.day-nav a[data-day]');
      links.forEach(function (a) {
        if (a.getAttribute('data-day') === String(d - 19)) {
          a.classList.add('is-today');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markToday);
  } else {
    markToday();
  }
})();
