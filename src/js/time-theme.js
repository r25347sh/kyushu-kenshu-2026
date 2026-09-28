/**
 * kyushu-kenshu-2026 — time-theme.js
 * 時間帯・天気連動（reitansai time-theme を九州中心座標に適応）
 * デフォルト座標: 大分・別府付近（33.28, 131.50）
 */
(function () {
  'use strict';
  var ROOT = document.documentElement;
  var BODY = document.body;
  var LAT = 33.2795;
  var LON = 131.5000;
  var WEATHER_URL =
    'https://api.open-meteo.com/v1/forecast?latitude=' + LAT +
    '&longitude=' + LON +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m' +
    '&timezone=Asia%2FTokyo';

  var lastWeather = null;

  function getJST() {
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
    });
    var parts = fmt.formatToParts(new Date());
    var get = function (t) {
      return parseInt(parts.find(function (p) { return p.type === t; }).value, 10);
    };
    var h = get('hour'), m = get('minute'), s = get('second');
    return { h: h, m: m, s: s, hours: h + m / 60 + s / 3600 };
  }

  function periodFromHours(hours) {
    if (hours >= 4.5 && hours < 6.5) return 'dawn';
    if (hours >= 6.5 && hours < 10) return 'morning';
    if (hours >= 10 && hours < 15) return 'noon';
    if (hours >= 15 && hours < 17.5) return 'afternoon';
    if (hours >= 17.5 && hours < 19.5) return 'dusk';
    if (hours >= 19.5 && hours < 22.5) return 'night';
    return 'late';
  }

  function weatherKind(code, precip, cloud) {
    if (code == null) return 'unknown';
    if (code === 0) return 'clear';
    if (code <= 3) return cloud >= 70 ? 'cloudy' : 'partly';
    if (code >= 45 && code <= 48) return 'fog';
    if (code >= 51 && code <= 67) return precip > 2 ? 'rain-heavy' : 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 85 && code <= 86) return 'snow';
    if (code >= 95) return 'storm';
    return 'cloudy';
  }

  function paletteDark(period, kind, isDay, temp) {
    var map = {
      dawn: { hue: 18, sat: 42, bgL: 8, textL: 94, acc: 28 },
      morning: { hue: 195, sat: 38, bgL: 11, textL: 92, acc: 48 },
      noon: { hue: 205, sat: 32, bgL: 15, textL: 90, acc: 42 },
      afternoon: { hue: 32, sat: 40, bgL: 10, textL: 93, acc: 25 },
      dusk: { hue: 305, sat: 44, bgL: 7, textL: 94, acc: 330 },
      night: { hue: 235, sat: 48, bgL: 5, textL: 93, acc: 185 },
      late: { hue: 250, sat: 46, bgL: 4, textL: 91, acc: 210 }
    };
    var b = map[period] || map.night;
    var overlay = { hueShift: 0, satMul: 1, bgDelta: 0, glow: null, grain: 0.04, accShift: 0 };
    switch (kind) {
      case 'clear': overlay = { hueShift: isDay ? 22 : -14, satMul: 1.35, bgDelta: isDay ? 4 : -2, glow: isDay ? 'rgba(255,190,80,0.28)' : 'rgba(160,190,255,0.18)', grain: 0.02, accShift: isDay ? 15 : -20 }; break;
      case 'partly': overlay = { hueShift: 8, satMul: 1.1, bgDelta: 1, glow: 'rgba(140,180,230,0.16)', grain: 0.035, accShift: 5 }; break;
      case 'cloudy': overlay = { hueShift: -8, satMul: 0.55, bgDelta: -1, glow: 'rgba(100,120,150,0.12)', grain: 0.06, accShift: -10 }; break;
      case 'fog': overlay = { hueShift: -20, satMul: 0.35, bgDelta: 3, glow: 'rgba(180,190,200,0.22)', grain: 0.09, accShift: -15 }; break;
      case 'rain': overlay = { hueShift: 45, satMul: 1.05, bgDelta: -3, glow: 'rgba(60,130,220,0.28)', grain: 0.08, accShift: 40 }; break;
      case 'rain-heavy': overlay = { hueShift: 55, satMul: 1.0, bgDelta: -5, glow: 'rgba(40,90,200,0.35)', grain: 0.1, accShift: 50 }; break;
      case 'snow': overlay = { hueShift: -28, satMul: 0.28, bgDelta: 6, glow: 'rgba(230,240,255,0.32)', grain: 0.05, accShift: -30 }; break;
      case 'storm': overlay = { hueShift: 70, satMul: 1.45, bgDelta: -6, glow: 'rgba(140,70,255,0.38)', grain: 0.12, accShift: 80 }; break;
      default: overlay = { hueShift: 0, satMul: 0.9, bgDelta: 0, glow: 'rgba(100,140,200,0.14)', grain: 0.05 };
    }
    var tTint = 0;
    if (typeof temp === 'number') {
      if (temp >= 30) tTint = 20; else if (temp >= 25) tTint = 12; else if (temp >= 18) tTint = 4;
      else if (temp <= 2) tTint = -28; else if (temp <= 8) tTint = -16; else if (temp <= 14) tTint = -8;
    }
    var hue = (b.hue + overlay.hueShift + tTint + 360) % 360;
    var sat = Math.max(12, Math.min(62, b.sat * overlay.satMul));
    var bgL = Math.max(3, Math.min(22, b.bgL + overlay.bgDelta));
    var accHue = (b.acc + (overlay.accShift || 0) + 360) % 360;
    var accSat = Math.min(78, 58 + sat * 0.25);
    return {
      hue: hue,
      bg: 'hsl(' + hue + ' ' + sat + '% ' + bgL + '%)',
      bgSoft: 'hsl(' + hue + ' ' + Math.max(10, sat - 4) + '% ' + (bgL + 4) + '%)',
      card: 'hsl(' + hue + ' ' + (sat + 4) + '% ' + (bgL + 6) + '%)',
      cardHover: 'hsl(' + hue + ' ' + (sat + 8) + '% ' + (bgL + 10) + '%)',
      text: 'hsl(' + hue + ' 22% ' + b.textL + '%)',
      textMuted: 'hsl(' + hue + ' 16% 60%)',
      accent: 'hsl(' + accHue + ' ' + accSat + '% 54%)',
      accentSoft: 'hsla(' + accHue + ' ' + accSat + '% 50% / 0.28)',
      border: 'hsla(' + hue + ' 30% 72% / 0.22)',
      glow: overlay.glow || 'hsla(' + hue + ' 55% 50% / 0.22)',
      lab: 'hsl(' + ((hue + 150) % 360) + ' 62% 58%)',
      grain: overlay.grain, period: period, weather: kind, isDay: !!isDay, temp: temp
    };
  }

  function apply(p) {
    ROOT.style.setProperty('--rt-hue', p.hue);
    ROOT.style.setProperty('--rt-bg', p.bg);
    ROOT.style.setProperty('--rt-bg-soft', p.bgSoft);
    ROOT.style.setProperty('--rt-card', p.card);
    ROOT.style.setProperty('--rt-card-hover', p.cardHover);
    ROOT.style.setProperty('--rt-text', p.text);
    ROOT.style.setProperty('--rt-text-muted', p.textMuted);
    ROOT.style.setProperty('--rt-accent', p.accent);
    ROOT.style.setProperty('--rt-accent-soft', p.accentSoft);
    ROOT.style.setProperty('--rt-border', p.border);
    ROOT.style.setProperty('--rt-glow', p.glow);
    ROOT.style.setProperty('--rt-lab', p.lab);
    ROOT.style.setProperty('--rt-grain', p.grain);
    ROOT.dataset.period = p.period;
    ROOT.dataset.weather = p.weather;
    if (p.temp != null) ROOT.dataset.temp = String(Math.round(p.temp));
    ROOT.dataset.place = 'beppu-oita';
    if (BODY) {
      BODY.dataset.period = p.period;
      BODY.dataset.weather = p.weather;
      BODY.classList.toggle('is-day', p.isDay);
      BODY.classList.toggle('is-night', !p.isDay);
    }
    var layer = document.getElementById('rt-atmosphere');
    if (layer) {
      layer.style.display = '';
      layer.className = 'rt-atmosphere wx-' + p.weather + ' pd-' + p.period + (p.isDay ? ' day' : ' night');
    }
  }

  function tickTime() {
    var j = getJST();
    var period = periodFromHours(j.hours);
    var w = lastWeather || {};
    var kind = weatherKind(w.weather_code, w.precipitation, w.cloud_cover);
    var isDay = w.is_day != null ? !!w.is_day : (j.hours >= 6 && j.hours < 18);
    var p = paletteDark(period, kind, isDay, w.temperature_2m);
    apply(p);
    return p;
  }

  function fetchWeather() {
    return fetch(WEATHER_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.current) {
          lastWeather = data.current;
          tickTime();
          try { sessionStorage.setItem('kk-wx', JSON.stringify({ t: Date.now(), c: data.current })); } catch (e) {}
        }
      })
      .catch(function () { tickTime(); });
  }

  function ensureAtmosphere() {
    if (document.getElementById('rt-atmosphere')) return;
    var el = document.createElement('div');
    el.id = 'rt-atmosphere';
    el.className = 'rt-atmosphere';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }

  function boot() {
    ensureAtmosphere();
    try {
      var cached = sessionStorage.getItem('kk-wx');
      if (cached) {
        var o = JSON.parse(cached);
        if (o && o.c && Date.now() - o.t < 15 * 60 * 1000) lastWeather = o.c;
      }
    } catch (e) {}
    tickTime();
    fetchWeather();
    setInterval(tickTime, 30000);
    setInterval(fetchWeather, 10 * 60 * 1000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { tickTime(); fetchWeather(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.KKTheme = {
    tick: tickTime,
    fetchWeather: fetchWeather,
    setCoords: function (lat, lon) {
      LAT = lat; LON = lon;
      WEATHER_URL =
        'https://api.open-meteo.com/v1/forecast?latitude=' + LAT +
        '&longitude=' + LON +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m' +
        '&timezone=Asia%2FTokyo';
      fetchWeather();
    }
  };
})();
