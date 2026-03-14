# Firebase Setup Guide

「Spiral Up Logger」を動作させるために、Firebaseプロジェクトの作成と環境変数の設定が必要です。

## 1. Firebaseプロジェクトの作成
1. [Firebase Console](https://console.firebase.google.com/) にアクセス。
2. 「プロジェクトを追加」をクリック。
3. 任意のプロジェクト名（例: `spiral-up-logger`）を入力。

## 2. Webアプリの登録
1. プロジェクトダッシュボードで「Web」アイコンをクリック。
2. アプリのニックネームを入力して登録。
3. 表示される `firebaseConfig` オブジェクトの値をメモします。

## 3. 環境変数の設定
プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の内容を貼り付けます（メモした値を反映させてください）。

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 4. Firestore Database の有効化
1. Firebase Console の左メニューから「Firestore Database」を選択。
2. 「データベースの作成」をクリック。
3. ロケーションを選択し、「テストモードで開始」または「本番環境モード」を選択（開発時はテストモードがスムーズです）。

## 5. セキュリティルールの設定 (開発用)
Firestore の「ルール」タブで、読み書きを許可します（本番では認証が必要なように書き換えてください）。

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
