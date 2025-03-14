const debug = false;
//const debug = true;

if (debug) console.log('NicoLiveOpener - background.js');

let watchedUserPages = {};

// 監視対象のユーザを定期的にチェック
function checkWatchedUserPages() {
  console.log("ユーザのチェックを開始します");
  chrome.storage.local.get('watchedUserPages', (result) => {
    const watchedUserPages = result.watchedUserPages || {};
    if(debug) console.log("監視中のユーザページ:", JSON.stringify(watchedUserPages));
    for (let userPageUrl in watchedUserPages) {
      if(debug) console.log("チェック中のユーザページ:", userPageUrl);
      fetchLiveStatus(userPageUrl, watchedUserPages);
    }
  });
}

// ライブステータスを取得する関数
function fetchLiveStatus(userPageUrl, watchedUserPages) {
  console.log(`${userPageUrl} のステータスを取得中...`);

  const userIdMatch = userPageUrl.match(/user\/(\d+)/);
  if (!userIdMatch) {
    console.log(`ユーザIDがみつかりません: ${userPageUrl}`);
    return;
  }

  const userId = userIdMatch[1];
  const apiUrl = `https://api.feed.nicovideo.jp/v1/activities/actors/users/${userId}/publish?context=user_timeline_${userId}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      "Origin": "https://www.nicovideo.jp",
      "Referer": "https://www.nicovideo.jp/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "X-Frontend-Id": "6"
    },
    credentials: "include" // Cookie を自動送信
  })
  .then(async response => {
    if(debug) console.log(`HTTPステータス: ${response.status}`);

    const responseBody = await response.text();
    if(debug) console.log("レスポンスボディ:", responseBody);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseBody}`);
    }

    return JSON.parse(responseBody);
  })
  .then(data => {
    if(debug) console.log("取得したデータ:", data);

    // レスポンスデータからライブ配信情報を抽出
    const record = data.activities?.[0]; // 最初のレコードを取得
    const content = record?.content;
    if (content?.program?.statusCode == 'ON_AIR' && content?.url) {
      const liveUrl = record.content.url;
      const liveId = content?.id.match(/lv(\d+)/)?.[1]; // lv番号を抽出
      if (!liveId) {
        console.log("ライブIDの抽出に失敗しました");
        return;
      }

      const liveInt = parseInt(liveId, 10); // 数字の部分だけ取り出す
      if (liveInt > (watchedUserPages[userPageUrl] || 0)) {
        console.log(`ライブ中の放送を検出: ${liveUrl} タブを開きます`);
        chrome.tabs.create({ url: liveUrl });
        watchedUserPages[userPageUrl] = liveInt;
        chrome.storage.local.set({ watchedUserPages: watchedUserPages });
      } else {
        console.log(`${liveUrl} はすでに開かれています`);
      }
    } else {
      console.log(`${userPageUrl} でライブ中の放送は見つかりませんでした`);
    }
  })
  .catch(error => {
    console.error("エラーの詳細:", error.message);
    console.error("エラーのスタックトレース:", error.stack);
  });
}

// 拡張機能のインストール時にアラームを設定
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('checkUserPages', { periodInMinutes: 1 }); // 1分ごとにチェック
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkUserPages') {
    checkWatchedUserPages();
  }
});

// デバッグ用：インストール直後に1回チェックを実行
chrome.runtime.onInstalled.addListener(() => {
  checkWatchedUserPages();
});
