/**
 * kyushu-kenshu-2026 — default.js
 * 共通ユーティリティ・ベースパス解決
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

  /* 今日が研修日なら data-today を付与 */
  function markToday() {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    // 2026-10-20 〜 23
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
