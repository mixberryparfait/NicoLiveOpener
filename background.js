const debug = false; 
//const debug = true;

if (debug) console.log('NicoLiveOpener - background.js');

let watchedUserPages = {};

// 監視対象のユーザを定期的にチェック
function checkWatchedUserPages() {
  console.log("ユーザのチェックを開始します");
  chrome.storage.local.get('watchedUserPages', (result) => {
    const watchedUserPages = result.watchedUserPages || {};
    console.log("監視中のユーザページ:", JSON.stringify(watchedUserPages));
    for (let userPageUrl in watchedUserPages) {
      console.log("チェック中のユーザページ:", userPageUrl);
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
  const historyUrl = `https://live.nicovideo.jp/front/api/v1/user-broadcast-history?providerId=${userId}&providerType=user&limit=1`;

  fetch(historyUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const record = data['data']['programsList'][0];
      if (record && record['program']['schedule']['status'] === 'ON_AIR') {
        const liveId = record['id']['value']; // lv123456
        const liveUrl = `https://live.nicovideo.jp/watch/${liveId}`;
        const liveInt = parseInt(liveId.match(/(\d+)/)[1], 10); // 数字の部分だけ取り出す
        // 数字が新しければ開く
        if (liveInt > watchedUserPages[userPageUrl]) {
          console.log(`ライブ中の放送を検出: ${liveUrl} タブを開きます`);
          chrome.tabs.create({ url: liveUrl });
          // 同じURLを開かないよう数字を更新して保存
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
      console.log("エラーの詳細:" + error);
      console.log("エラーのスタックトレース:" + error.stack);
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