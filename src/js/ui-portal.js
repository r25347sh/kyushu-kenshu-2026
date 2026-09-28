/**
 * kyushu-kenshu-2026 — ui-portal.js
 * body の filter/transform の影響を受けない UI 用ポータルを
 * documentElement (html) 直下に作る。
 * FAB・放射状メニュー・近傍バッジは必ずここにマウントする。
 */
(function () {
  'use strict';

  var PORTAL_ID = 'kk-ui-portal';

  function ensurePortal() {
    var el = document.getElementById(PORTAL_ID);
    if (el) return el;

    el = document.createElement('div');
    el.id = PORTAL_ID;
    el.setAttribute('data-kk-portal', '1');
    /* fixed + inset:0 → 常にビューポート基準。子は absolute で配置 */
    el.style.cssText =
      'position:fixed;' +
      'inset:0;' +
      'width:100%;' +
      'height:100%;' +
      'margin:0;' +
      'padding:0;' +
      'pointer-events:none;' +
      'z-index:2147480000;' +
      'overflow:visible;' +
      'transform:none;' +
      'filter:none;' +
      'perspective:none;' +
      'contain:none;';

    /* body ではなく html の末尾へ — body の filter 包含を回避 */
    document.documentElement.appendChild(el);
    return el;
  }

  function mount(node) {
    var portal = ensurePortal();
    if (node && node.parentNode !== portal) {
      portal.appendChild(node);
    }
    return node;
  }

  function viewport() {
    return {
      w: window.innerWidth || document.documentElement.clientWidth || 0,
      h: window.innerHeight || document.documentElement.clientHeight || 0
    };
  }

  /* 最初から用意 */
  if (document.documentElement) {
    ensurePortal();
  } else {
    document.addEventListener('DOMContentLoaded', ensurePortal);
  }

  window.KKPortal = {
    ensure: ensurePortal,
    mount: mount,
    viewport: viewport,
    id: PORTAL_ID
  };
})();
