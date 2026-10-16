/**
 * 九州研修旅行 2026 — 期間限定チャット
 * 有効: 2026-10-20 00:00 JST 〜 2026-10-23 23:59:59 JST
 * 方式: localStorage 履歴 + PeerJS ルーム同期（G⁵ Portal WebRTC 系を模倣）
 */
(function () {
  'use strict';

  var START = Date.UTC(2026, 9, 19, 15, 0, 0); /* 10/20 00:00 JST = 10/19 15:00 UTC */
  var END = Date.UTC(2026, 9, 23, 14, 59, 59); /* 10/23 23:59:59 JST */
  /* 開発・直前確認用に 10/16 からプレビュー開放（本番は START をそのまま） */
  var PREVIEW_FROM = Date.UTC(2026, 9, 15, 15, 0, 0); /* 10/16 00:00 JST */

  var STORAGE_KEY = 'kk-chat-v1';
  var peer = null;
  var conns = {};
  var myId = null;
  var nick = '';
  var room = 'sanban';
  var joined = false;

  function nowJst() {
    return Date.now();
  }

  function isActive() {
    var t = nowJst();
    /* プレビュー: 10/16〜も開ける。本旅行日は START〜END */
    return t >= PREVIEW_FROM && t <= END;
  }

  function isTripDays() {
    var t = nowJst();
    return t >= START && t <= END;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(ts) {
    try {
      return new Date(ts).toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      });
    } catch (e) {
      return '';
    }
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { rooms: {} };
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return { rooms: {} };
      if (!o.rooms) o.rooms = {};
      return o;
    } catch (e) {
      return { rooms: {} };
    }
  }

  function saveStore(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function getMessages(r) {
    var st = loadStore();
    var list = (st.rooms[r] && st.rooms[r].messages) || [];
    return list.slice(-200);
  }

  function pushMessage(r, msg) {
    var st = loadStore();
    if (!st.rooms[r]) st.rooms[r] = { messages: [] };
    st.rooms[r].messages.push(msg);
    if (st.rooms[r].messages.length > 300) {
      st.rooms[r].messages = st.rooms[r].messages.slice(-300);
    }
    saveStore(st);
  }

  function renderMessages() {
    var box = document.getElementById('kk-messages');
    if (!box) return;
    var list = getMessages(room);
    if (!list.length) {
      box.innerHTML = '<p class="kk-empty">まだメッセージはありません</p>';
      return;
    }
    var html = list
      .map(function (m) {
        var mine = m.peerId && myId && m.peerId === myId;
        return (
          '<div class="kk-bubble' +
          (mine ? ' mine' : '') +
          '">' +
          '<div class="meta">' +
          escapeHtml(m.nick || '匿名') +
          ' · ' +
          formatTime(m.ts) +
          '</div>' +
          '<div class="text">' +
          escapeHtml(m.text) +
          '</div></div>'
        );
      })
      .join('');
    var atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.innerHTML = html;
    if (atBottom) box.scrollTop = box.scrollHeight;
  }

  function setConnStatus(text) {
    var el = document.getElementById('kk-conn');
    if (el) el.textContent = text || '';
  }

  function roomPeerPrefix() {
    return 'kk2026-' + room + '-';
  }

  function broadcast(msg) {
    var payload = JSON.stringify({ type: 'chat', msg: msg });
    Object.keys(conns).forEach(function (id) {
      try {
        if (conns[id].open) conns[id].send(payload);
      } catch (e) {}
    });
  }

  function handleIncoming(data) {
    try {
      var o = typeof data === 'string' ? JSON.parse(data) : data;
      if (!o || o.type !== 'chat' || !o.msg) return;
      var m = o.msg;
      if (!m.text || !m.ts) return;
      /* 重複回避 */
      var list = getMessages(room);
      if (list.some(function (x) { return x.id === m.id; })) return;
      pushMessage(room, m);
      renderMessages();
    } catch (e) {}
  }

  function wireConn(c) {
    conns[c.peer] = c;
    c.on('data', handleIncoming);
    c.on('close', function () {
      delete conns[c.peer];
      setConnStatus('接続中: ' + Object.keys(conns).length + ' 台');
    });
    setConnStatus('接続中: ' + Object.keys(conns).length + ' 台');
  }

  function startPeer() {
    if (typeof Peer === 'undefined') {
      setConnStatus('PeerJS 未読込 — ローカル履歴のみ');
      return;
    }
    var id = roomPeerPrefix() + Math.random().toString(36).slice(2, 9);
    peer = new Peer(id, {
      debug: 0
    });
    peer.on('open', function (id) {
      myId = id;
      setConnStatus('Peer ID 取得済 — 同じルームの相手を探索中…');
      /* 簡易探索: 固定シード数に接続を試みる（同ルーム） */
      var seeds = ['a', 'b', 'c', 'd', 'e', 'host'];
      seeds.forEach(function (s) {
        var target = roomPeerPrefix() + s;
        if (target === id) return;
        try {
          var c = peer.connect(target, { reliable: true });
          c.on('open', function () { wireConn(c); });
        } catch (e) {}
      });
    });
    peer.on('connection', function (c) {
      c.on('open', function () { wireConn(c); });
    });
    peer.on('error', function (err) {
      /* peer-unavailable は無視 */
      if (err && err.type === 'peer-unavailable') return;
      setConnStatus('Peer: ' + (err.type || err.message || 'error'));
    });
  }

  function join() {
    var nickEl = document.getElementById('kk-nick');
    var roomEl = document.getElementById('kk-room');
    nick = (nickEl.value || '').trim() || '匿名';
    room = roomEl.value || 'sanban';
    try {
      localStorage.setItem('kk-chat-nick', nick);
      localStorage.setItem('kk-chat-room', room);
    } catch (e) {}
    joined = true;
    document.getElementById('kk-form').hidden = false;
    document.getElementById('kk-leave').hidden = false;
    document.getElementById('kk-join').hidden = true;
    nickEl.disabled = true;
    roomEl.disabled = true;
    renderMessages();
    startPeer();
  }

  function leave() {
    joined = false;
    Object.keys(conns).forEach(function (id) {
      try { conns[id].close(); } catch (e) {}
    });
    conns = {};
    if (peer) {
      try { peer.destroy(); } catch (e) {}
      peer = null;
    }
    myId = null;
    document.getElementById('kk-form').hidden = true;
    document.getElementById('kk-leave').hidden = true;
    document.getElementById('kk-join').hidden = false;
    document.getElementById('kk-nick').disabled = false;
    document.getElementById('kk-room').disabled = false;
    setConnStatus('');
  }

  function send(e) {
    e.preventDefault();
    if (!joined) return;
    var input = document.getElementById('kk-input');
    var text = (input.value || '').trim();
    if (!text) return;
    var msg = {
      id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6),
      nick: nick,
      text: text,
      ts: Date.now(),
      peerId: myId || 'local'
    };
    pushMessage(room, msg);
    broadcast(msg);
    input.value = '';
    renderMessages();
  }

  function boot() {
    var gate = document.getElementById('kk-chat-gate');
    var ui = document.getElementById('kk-chat-ui');
    var status = document.getElementById('kk-chat-status');

    if (!isActive()) {
      status.innerHTML =
        '<span class="ng">現在チャットは利用できません</span><br>' +
        '有効期間: 2026年10月20日（火）〜10月23日（金）';
      return;
    }

    var label = isTripDays()
      ? '<span class="ok">本旅行期間中 — チャット開放中</span>'
      : '<span class="ok">プレビュー開放中（本旅行: 10/20〜10/23）</span>';
    status.innerHTML = label + '<br>ニックネームを入れてルームに入室してください。';
    ui.hidden = false;

    try {
      var n = localStorage.getItem('kk-chat-nick');
      var r = localStorage.getItem('kk-chat-room');
      if (n) document.getElementById('kk-nick').value = n;
      if (r) document.getElementById('kk-room').value = r;
    } catch (e) {}

    document.getElementById('kk-join').addEventListener('click', join);
    document.getElementById('kk-leave').addEventListener('click', leave);
    document.getElementById('kk-form').addEventListener('submit', send);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
