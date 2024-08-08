const debug = false; 
//const debug = true;

if (debug) console.log('NicoLiveOpener - follow.js');

let watchedUserPages = {};

// トグルボタンを追加する関数
function addToggleButton() {
  if (debug) console.log('addToggleButton');

  const userItems = document.querySelectorAll('.UserItem');
  // if (debug) console.log(userItems);
  if (debug) console.log(userItems.length);
  if(userItems.length > 0) {
    // 各 .UserItem に対して処理を実行
    userItems.forEach(userItem => {
      let userPageUrl = userItem.querySelector('a')?.href;
      if (debug) console.log(userPageUrl);
      if (userPageUrl) {
        userPageUrl = new URL(userPageUrl.split('?')[0] + '/live_programs', window.location.href).href;

        // 新しいボタン要素を作成
        const autoJoinButton = document.createElement('button');
        autoJoinButton.className = 'NC-FollowButton';
        autoJoinButton.dataset.isFollowing = 'false';
        autoJoinButton.style.position = 'absolute'; // 位置を調整するために絶対配置
        autoJoinButton.style.right = '128px'; // 指定された位置に配置
        autoJoinButton.innerHTML = '<span>自動入場する</span>';
        
        autoJoinButton.addEventListener('click', handleAutoJoinClick);

        // 新しいボタンを既存の「フォロー中」ボタンの後に追加
        userItem.appendChild(autoJoinButton);

        chrome.storage.local.get('watchedUserPages', (result) => {
          watchedUserPages = result.watchedUserPages || {};
          if (watchedUserPages[userPageUrl]) {
            autoJoinButton.dataset.isFollowing = 'true';
            autoJoinButton.innerHTML = '<span>自動入場中</span>'
          }
        });
      }
    });

    return true; // ボタンが追加されたことを示す
  }
  return false;
}



// チェックボックスの変更ハンドラ
function handleAutoJoinClick(event) {
  if (debug) console.log('handleAutoJoinClick');
  const autoJoinButton = event.currentTarget;
  if (debug) console.log(event.currentTarget);
  let userPageUrl = autoJoinButton.parentNode?.querySelector('a')?.href;
  if (userPageUrl) {
    userPageUrl = new URL(userPageUrl.split('?')[0] + '/live_programs', window.location.href).href;
    if (autoJoinButton.dataset.isFollowing == 'false') {
      autoJoinButton.dataset.isFollowing == 'true';
      autoJoinButton.innerHTML = '<span>自動入場中</span>';
      watchedUserPages[userPageUrl] = -1;
    } else {
      autoJoinButton.dataset.isFollowing == 'false';
      autoJoinButton.innerHTML = '<span>自動入場する</span>';
      delete watchedUserPages[userPageUrl];
    }
    chrome.storage.local.set({ watchedUserPages: watchedUserPages }, () => {
      if (debug) console.log(watchedUserPages);
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
