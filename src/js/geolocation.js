/**
 * kyushu-kenshu-2026 — geolocation.js
 * 現在地取得 → 最寄り訪問地・日程ハイライト
 * 近傍バッジはヘッダー下（モバイルで FAB と重ならない位置）
 */
(function () {
  'use strict';

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

  function highlightDay(day) {
    document.querySelectorAll('.day-nav a[data-day]').forEach(function (a) {
      a.classList.remove('is-near');
      if (a.getAttribute('data-day') === String(day)) {
        a.classList.add('is-near');
      }
    });
  }

  function headerBottom() {
    var h = document.querySelector('.site-header');
    if (!h) return 56;
    var r = h.getBoundingClientRect();
    return Math.max(48, Math.round(r.bottom));
  }

  function showNearBadge(result) {
    var existing = document.getElementById('kk-near-badge');
    if (existing) existing.remove();
    if (!result || !result.loc) return;

    var el = document.createElement('div');
    el.id = 'kk-near-badge';
    el.className = 'kk-near-badge';
    el.setAttribute('role', 'status');

    var top = headerBottom() + 8;
    el.style.cssText =
      'position:fixed;' +
      'top:' + top + 'px;' +
      'left:max(0.75rem, env(safe-area-inset-left));' +
      'right:auto;' +
      'bottom:auto;' +
      'z-index:95;' +
      'max-width:min(17.5rem, calc(100vw - 5.5rem));' +
      'padding:0.6rem 0.85rem;' +
      'border-radius:10px;' +
      'background:color-mix(in srgb, var(--rt-card, #151a24) 94%, transparent);' +
      'border:1px solid color-mix(in srgb, var(--rt-accent, #c9a227) 45%, transparent);' +
      'color:var(--rt-text, #e8eef7);' +
      'font-size:0.76rem;' +
      'line-height:1.45;' +
      'box-shadow:0 8px 24px rgba(0,0,0,0.32);' +
      'backdrop-filter:blur(12px);' +
      '-webkit-backdrop-filter:blur(12px);' +
      'pointer-events:auto;';

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

    document.body.appendChild(el);

    var closeBtn = document.getElementById('kk-near-close');
    if (closeBtn) {
      closeBtn.style.cssText =
        'margin-top:0.35rem;font-size:0.7rem;opacity:0.75;background:none;border:none;' +
        'color:inherit;cursor:pointer;padding:0.2rem 0;touch-action:manipulation;';
      closeBtn.addEventListener('click', function () { el.remove(); });
    }

    if (result.loc.day) highlightDay(result.loc.day);

    if (window.KKTheme && typeof window.KKTheme.setCoords === 'function') {
      window.KKTheme.setCoords(result.loc.lat, result.loc.lon);
    }

    // ヘッダー高さ変化に追従（回転など）
    window.addEventListener('resize', function onR() {
      if (!document.getElementById('kk-near-badge')) {
        window.removeEventListener('resize', onR);
        return;
      }
      el.style.top = (headerBottom() + 8) + 'px';
    });
  }

  function onSuccess(pos) {
    var lat = pos.coords.latitude;
    var lon = pos.coords.longitude;
    try {
      sessionStorage.setItem('kk-geo', JSON.stringify({
        t: Date.now(),
        lat: lat,
        lon: lon
      }));
    } catch (e) {}
    var result = findNearest(lat, lon);
    showNearBadge(result);
  }

  function onError() {
    try {
      var cached = sessionStorage.getItem('kk-geo');
      if (cached) {
        var o = JSON.parse(cached);
        if (o && o.lat != null && Date.now() - o.t < 30 * 60 * 1000) {
          showNearBadge(findNearest(o.lat, o.lon));
        }
      }
    } catch (e) {}
  }

  function requestGeo() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 5 * 60 * 1000
    });
  }

  function boot() {
    setTimeout(requestGeo, 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.KKGeo = {
    request: requestGeo,
    findNearest: findNearest
  };
})();
