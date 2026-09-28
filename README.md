# 九州研修旅行 2026｜麗澤高等学校 5年

**令和8年（2026年）10月20日（火）〜10月23日（金）〈3泊4日〉**

麗澤高等学校 5学年 九州研修旅行 専用サイトです。  
日程スケジュール・訪問地情報・天気／時間帯連動デザイン・現在地連動を備えています。

**ライブURL（GitHub Pages有効化後）**  
https://r25347sh.github.io/kyushu-kenshu-2026/

## サイト構成

| パス | 内容 |
|------|------|
| `/` | 全体概要・日程ナビ |
| `/day1/`〜`/day4/` | 日付ごとのタイムラインとスポット詳細 |
| `/packing/` | 持ち物チェック |
| `/rules/` | 心得・宿舎ルール |
| `sources/09/` | 公式資料のテキスト要約 |

## デザイン・機能

- **放射状メニュー**（長押し / トリプルタップ）＋ **ハンバーガーFAB**（reitansai方式）
- **天気・時間帯連動** atmosphere（Open-Meteo + 時間帯パレット、デフォルト座標：別府付近）
- モバイルファースト・reduced-motion対応
- 各ページ専用CSS/JS + `default.css` / `default.js`

## 技術

- 純粋 HTML / CSS / JS（ビルド不要）
- ベースパス: `/kyushu-kenshu-2026/`

## 開発フェーズ

- [x] Phase 0: リポジトリ作成・sources・骨格
- [x] Phase 1: 共通レイアウト・atmosphere・MENU
- [x] Phase 2: 日別ページ（Day1詳細＋Day2〜4骨格）・packing/rules
- [ ] Phase 3: スポット詳細の充実・現在地ハイライト強化
- [ ] Phase 4: GitHub Pages有効化・最終調整

## ローカル確認

GitHub Pages の base path を考慮して相対パスで動作します。  
`file://` でもメニューの深さ計算に対応しています。

---

麗澤高等学校｜5学年
