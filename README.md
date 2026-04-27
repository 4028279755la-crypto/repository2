# 寿司ドラフト

ブラウザで遊べる寿司屋経営ドラフトゲーム。  
React + TypeScript + Zustand + Tailwind CSS v4 で構築。

## ゲーム概要

毎朝「朝市フェーズ」で食材をドラフト形式で仕入れ、「営業フェーズ」で客の注文をこなして売上と評判を稼ぐ。
食材の組み合わせによる「コンボ」でボーナスを狙いつつ、ランを通じて店を育てる。

## フェーズ構成

| フェーズ | 内容 |
|---|---|
| 朝市 (morning_market) | 食材ドラフト |
| 営業 (service) | 注文処理・コンボ発動 |
| 閉店 (closing) | 日次精算・評価 |
| ゲームオーバー (gameover) | ラン終了・のれん値確認 |

## 開発手順

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開く。

## ビルド

```bash
npm run build
npm run preview
```

## ディレクトリ構成

```
src/
  core/types.ts        # 全型定義
  data/                # ダミーJSON (食材・客・コンボ)
  store/gameStore.ts   # Zustand ストア
  ui/                  # React コンポーネント
  render/              # Phase 1 以降で素材描画
public/art/            # ピクセルアート素材 (Phase 1 以降)
```
