/** index.html 専用スクリプト */
(function () {
  'use strict';
  function updateWxBadge() {
    var el = document.getElementById('wx-badge');
    if (!el) return;
    var root = document.documentElement;
    var period = root.dataset.period || '';
    var weather = root.dataset.weather || '';
    var temp = root.dataset.temp;
    var labels = {
      dawn: '夜明け', morning: '朝', noon: '昼', afternoon: '午後',
      dusk: '黄昏', night: '夜', late: '深夜',
      clear: '晴', partly: '薄曇', cloudy: '曇', fog: '霧',
      rain: '雨', 'rain-heavy': '大雨', snow: '雪', storm: '雷雨', unknown: ''
    };
    var parts = [];
    if (labels[period]) parts.push(labels[period]);
    if (labels[weather]) parts.push(labels[weather]);
    if (temp != null) parts.push(temp + '℃');
    el.textContent = parts.join(' · ');
  }
  setInterval(updateWxBadge, 5000);
  setTimeout(updateWxBadge, 800);
})();
