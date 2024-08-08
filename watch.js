const debug = false; 
//const debug = true;

if (debug) console.log('NicoLiveOpener - watch.js');

let watchedUserPages = {};

// トグルボタンを追加する関数
function addToggleButton() {
  if (debug) console.log('addToggleButton');
  const actionMenu = document.querySelector('.action-menu');
  if (actionMenu && !document.getElementById('niconico-live-watcher-toggle')) {
    if (debug) console.log('#10');

    const containerDiv = document.createElement('div');
    containerDiv.style.textAlign = 'center';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'niconico-live-watcher-checkbox';

    const br = document.createElement('br');

    const label = document.createElement('label');
    label.style.fontSize = 'small';
    label.style.whiteSpace = 'nowrap';
    label.htmlFor = 'niconico-live-watcher-checkbox';
    label.textContent = '自動入場';

    containerDiv.appendChild(checkbox);
    containerDiv.appendChild(br);
    containerDiv.appendChild(label);

    actionMenu.prepend(containerDiv);

    // チェックボックスに対してイベントリスナーを追加
    checkbox.addEventListener('change', handleCheckboxChange);

    // ユーザURLを取得して登録済みの場合初期チェックを設定
    let userPageUrl = document.querySelector('.user-information-area a')?.href;
    if (debug) console.log('#37 ' + userPageUrl);
    if (userPageUrl) {
      userPageUrl = userPageUrl.split('?')[0]
      chrome.storage.local.get('watchedUserPages', (result) => {
        if (debug) console.log('#41 ', result);
        watchedUserPages = result.watchedUserPages || {};
        if (watchedUserPages[userPageUrl]) {
          checkbox.checked = true;
        }
      });
    }
    return true; // ボタンが追加されたことを示す
  }
  return false; // ボタンがまだ追加されていないことを示す
}

// チェックボックスの変更ハンドラ
function handleCheckboxChange(event) {
  const checkbox = event.target;
  let userPageUrl = document.querySelector('.user-information-area a')?.href;
  if (userPageUrl) {
    userPageUrl = userPageUrl.split('?')[0]
    if (checkbox.checked) {
      watchedUserPages[userPageUrl] = 1;
    } else {
      delete watchedUserPages[userPageUrl];
    }
    chrome.storage.local.set({ watchedUserPages: watchedUserPages }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save watched user pages:', chrome.runtime.lastError);
      }
    });
  }
}

// ページ読み込み完了後にトグルボタン追加を試みる
window.addEventListener('load', () => {
  // 最大60秒間、0.5秒ごとにトグルボタン追加を試みる
  const maxAttempts = 120; // 60秒 / 0.5秒 = 120回
  let attempts = 0;

  const intervalId = setInterval(() => {
    if (addToggleButton() || attempts >= maxAttempts) {
      clearInterval(intervalId);
    }
    attempts++;
  }, 500);
});