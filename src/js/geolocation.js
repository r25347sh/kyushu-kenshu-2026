/**
 * kyushu-kenshu-2026 — geolocation.js
 * 現在地 → 最寄り訪問地バッジ（ポータル内・常にビューポート追従）
 * リアルタイム版：起動時1回 + 時間間隔で再取得・距離再計算
 */
(function () {
  'use strict';

  // ===== 設定 =====
  var REFRESH_MS = 2 * 60 * 1000;   // 2分間隔（必要なら変更）
  var CACHE_MS   = 10 * 60 * 1000;  // キャッシュ有効 10分
  var GEO_OPTS = {
    enableHighAccuracy: false,      // バッテリー優先
    timeout: 10000,
    maximumAge: 60 * 1000           // 1分以内のキャッシュ位置はOK
  };

  var timerId = null;
  var lastResultKey = null;         // 同じ最寄り+距離帯なら再描画しない

  function haversineKm(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var toRad = function (d) { return d * Math.PI / 180; };
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function findNearest(lat, lon) {
    var list = window.KK_LOCATIONS || [];
    var best = null;
    var bestD = Infinity;
    for (var i = 0; i < list.length; i++) {
      var loc = list[i];
      if (loc.lat == null || loc.lon == null) continue;
      var d = haversineKm(lat, lon, loc.lat, loc.lon);
      if (d < bestD) {
        bestD = d;
        best = loc;
      }
    }
    return best ? { loc: best, km: bestD } : null;
  }

  /** 上位N件（将来カード複数表示用） */
  function findNearestN(lat, lon, n) {
    n = n || 3;
    var list = window.KK_LOCATIONS || [];
    var scored = [];
    for (var i = 0; i < list.length; i++) {
      var loc = list[i];
      if (loc.lat == null || loc.lon == null) continue;
      scored.push({ loc: loc, km: haversineKm(lat, lon, loc.lat, loc.lon) });
    }
    scored.sort(function (a, b) { return a.km - b.km; });
    return scored.slice(0, n);
  }

  function highlightDay(day) {
    document.querySelectorAll('.day-nav a[data-day]').forEach(function (a) {
      a.classList.remove('is-near');
      if (a.getAttribute('data-day') === String(day)) {
        a.classList.add('is-near');
      }
    });
  }

  function headerBottomInViewport() {
    var h = document.querySelector('.site-header');
    if (!h) return 56;
    var r = h.getBoundingClientRect();
    return Math.max(48, Math.round(r.bottom));
  }

  function placeBadge(el) {
    var top = headerBottomInViewport() + 8;
    el.style.top = top + 'px';
    el.style.left = 'max(0.75rem, env(safe-area-inset-left, 0px))';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  }

  function resultKey(result) {
    if (!result || !result.loc) return '';
    // 距離を100m単位で丸めて、微小変動で再描画しない
    var bucket = Math.round(result.km * 10); // 0.1km単位
    return result.loc.id + '|' + bucket;
  }

  function showNearBadge(result) {
    if (!result || !result.loc) return;

    var key = resultKey(result);
    if (key === lastResultKey) {
      // 距離帯が同じなら位置だけ追従（再生成しない）
      var existing = document.getElementById('kk-near-badge');
      if (existing) placeBadge(existing);
      return;
    }
    lastResultKey = key;

    var old = document.getElementById('kk-near-badge');
    if (old) old.remove();

    var el = document.createElement('div');
    el.id = 'kk-near-badge';
    el.className = 'kk-near-badge';
    el.setAttribute('role', 'status');

    var kmStr = result.km < 1
      ? Math.round(result.km * 1000) + ' m'
      : result.km.toFixed(1) + ' km';

    var linkHtml = '';
    if (result.loc.path && window.KK && window.KK.url) {
      linkHtml = ' <a href="' + window.KK.url(result.loc.path) + '" style="color:var(--rt-lab);font-weight:700;">詳細 →</a>';
    }

    el.innerHTML =
      '<strong style="color:var(--rt-accent);">現在地に近い場所</strong><br>' +
      result.loc.name +
      ' <span style="opacity:0.75;">(' + kmStr + ')</span>' +
      (result.loc.summary ? '<br><span style="opacity:0.8;">' + result.loc.summary + '</span>' : '') +
      linkHtml +
      '<br><button type="button" id="kk-near-close" class="kk-near-close">閉じる</button>';

    placeBadge(el);

    if (window.KKPortal && window.KKPortal.mount) {
      window.KKPortal.mount(el);
    } else {
      document.documentElement.appendChild(el);
      el.style.position = 'fixed';
    }

    var closeBtn = document.getElementById('kk-near-close');
    if (closeBtn) {
      closeBtn.style.cssText =
        'margin-top:0.35rem;font-size:0.7rem;opacity:0.75;background:none;border:none;' +
        'color:inherit;cursor:pointer;padding:0.2rem 0;touch-action:manipulation;';
      closeBtn.addEventListener('click', function () {
        el.remove();
        lastResultKey = null;
      });
    }

    if (result.loc.day) highlightDay(result.loc.day);

    if (window.KKTheme && typeof window.KKTheme.setCoords === 'function') {
      window.KKTheme.setCoords(result.loc.lat, result.loc.lon);
    }

    function onMove() {
      if (!document.getElementById('kk-near-badge')) {
        window.removeEventListener('scroll', onMove, true);
        window.removeEventListener('resize', onMove);
        return;
      }
      placeBadge(el);
    }
    window.addEventListener('scroll', onMove, { passive: true, capture: true });
    window.addEventListener('resize', onMove);
  }

  function onSuccess(pos) {
    var lat = pos.coords.latitude;
    var lon = pos.coords.longitude;
    try {
      sessionStorage.setItem('kk-geo', JSON.stringify({
        t: Date.now(), lat: lat, lon: lon
      }));
    } catch (e) {}
    showNearBadge(findNearest(lat, lon));
  }

  function onError() {
    try {
      var cached = sessionStorage.getItem('kk-geo');
      if (cached) {
        var o = JSON.parse(cached);
        if (o && o.lat != null && Date.now() - o.t < CACHE_MS) {
          showNearBadge(findNearest(o.lat, o.lon));
        }
      }
    } catch (e) {}
  }

  function requestGeo() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(onSuccess, onError, GEO_OPTS);
  }

  function start(intervalMs) {
    if (typeof intervalMs === 'number' && intervalMs > 0) {
      REFRESH_MS = intervalMs;
    }
    stop();
    requestGeo();                       // 即時1回
    timerId = setInterval(requestGeo, REFRESH_MS);
  }

  function stop() {
    if (timerId != null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function boot() {
    // ページが裏にいるときは止める（バッテリー対策）
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });
    setTimeout(function () { start(); }, 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.KKGeo = {
    request: requestGeo,
    start: start,
    stop: stop,
    findNearest: findNearest,
    findNearestN: findNearestN,
    setIntervalMs: function (ms) {
      REFRESH_MS = ms;
      if (timerId != null) start(ms);
    }
  };
})();
