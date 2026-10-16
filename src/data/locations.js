/**
 * 九州研修旅行 2026 — 訪問地座標・メタデータ
 * 距離計算・現在地ハイライト用
 * 更新: 2026-10-16 三班トーク・計画書反映（天文館周辺スポット追加）
 */
window.KK_LOCATIONS = [
  {
    id: 'haneda',
    name: '羽田空港',
    day: 1,
    lat: 35.5494,
    lon: 139.7798,
    role: 'departure'
  },
  {
    id: 'oita-airport',
    name: '大分空港',
    day: 1,
    lat: 33.4794,
    lon: 131.7372,
    role: 'arrival'
  },
  {
    id: 'usa-jingu',
    name: '宇佐神宮',
    day: 1,
    lat: 33.5258,
    lon: 131.3747,
    path: 'day1/usa-jingu.html',
    summary: '八幡神の総本宮'
  },
  {
    id: 'aono-domon',
    name: '青の洞門',
    day: 1,
    lat: 33.3835,
    lon: 131.1702,
    path: 'day1/aono-domon.html',
    summary: '禅海和尚が掘った洞門'
  },
  {
    id: 'nakatsu',
    name: '中津記念館',
    day: 1,
    lat: 33.5984,
    lon: 131.1884,
    path: 'day1/nakatsu.html',
    summary: '廣池千九郎先生ゆかり'
  },
  {
    id: 'beppu',
    name: '別府・城島高原ホテル',
    day: 1,
    lat: 33.2846,
    lon: 131.4912,
    path: 'day1/beppu.html',
    summary: '1日目宿泊'
  },
  {
    id: 'takachiho',
    name: '高千穂',
    day: 2,
    lat: 32.7114,
    lon: 131.3079,
    path: 'day2/takachiho.html',
    summary: '神話の里・神社・峡・天岩戸'
  },
  {
    id: 'aso',
    name: '阿蘇・ホテル角萬',
    day: 2,
    lat: 32.9378,
    lon: 131.0947,
    path: 'day2/index.html',
    summary: '2日目宿泊'
  },
  {
    id: 'chiran',
    name: '知覧',
    day: 3,
    lat: 31.3782,
    lon: 130.4415,
    path: 'day3/chiran.html',
    summary: '特攻平和会館・講話'
  },
  {
    id: 'nagasaki-hana',
    name: '長崎鼻',
    day: 3,
    lat: 31.1573,
    lon: 130.5884,
    path: 'day3/nagasaki-hana.html',
    summary: '薩摩半島最南端'
  },
  {
    id: 'ibusuki',
    name: '指宿海上ホテル',
    day: 3,
    lat: 31.2528,
    lon: 130.6331,
    path: 'day3/index.html',
    summary: '3日目宿泊'
  },
  {
    id: 'kagoshima',
    name: '鹿児島（自由行動）',
    day: 4,
    lat: 31.5966,
    lon: 130.5571,
    path: 'day4/kagoshima.html',
    summary: '班別自由行動 09:30〜14:20'
  },
  {
    id: 'saigo-statue',
    name: '西郷隆盛像',
    day: 4,
    lat: 31.5953,
    lon: 130.5535,
    path: 'day4/kagoshima.html',
    summary: '天文館近く・記念撮影スポット'
  },
  {
    id: 'terukuni',
    name: '照国神社',
    day: 4,
    lat: 31.5948,
    lon: 130.5501,
    path: 'day4/kagoshima.html',
    summary: '島津斉彬公を祀る・お参り'
  },
  {
    id: 'sweet-william',
    name: 'Sweet William Cafe',
    day: 4,
    lat: 31.5863,
    lon: 130.5563,
    path: 'day4/kagoshima.html',
    summary: 'マフィン・プリン（樋之口町）'
  },
  {
    id: 'mujaki',
    name: '天文館むじゃき',
    day: 4,
    lat: 31.5892,
    lon: 130.5560,
    path: 'day4/kagoshima.html',
    summary: '白熊（しろくま）発祥の店'
  },
  {
    id: 'tenmonkan',
    name: '天文館通り',
    day: 4,
    lat: 31.5900,
    lon: 130.5555,
    path: 'day4/kagoshima.html',
    summary: 'お土産・食べ歩きエリア'
  },
  {
    id: 'kuro-no-kiwami',
    name: '黒の極み（しゃぶしゃぶ）',
    day: 4,
    lat: 31.5895,
    lon: 130.5545,
    path: 'day4/kagoshima.html',
    summary: '黒豚しゃぶ候補（あぢもり代替）'
  },
  {
    id: 'kagoshima-airport',
    name: '鹿児島空港',
    day: 4,
    lat: 31.8034,
    lon: 130.7194,
    role: 'departure'
  }
];
