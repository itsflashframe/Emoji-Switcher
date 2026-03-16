const PREVIEW_CACHE = 'esw-previews-v1';
const PREVIEW_URLS = [
  'https://emojicdn.elk.sh/%F0%9F%98%8A?style=apple',
  'https://emojicdn.elk.sh/%F0%9F%94%A5?style=apple',
  'https://emojicdn.elk.sh/%F0%9F%8E%89?style=apple',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f60a.svg',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f525.svg',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f389.svg',
  'https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/emoji_u1f60a.svg',
  'https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/emoji_u1f525.svg',
  'https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/emoji_u1f389.svg',
  'https://emojicdn.elk.sh/%F0%9F%98%8A?style=facebook',
  'https://emojicdn.elk.sh/%F0%9F%94%A5?style=facebook',
  'https://emojicdn.elk.sh/%F0%9F%8E%89?style=facebook',
  'https://cdn.jsdelivr.net/npm/joypixels@8.0.0/assets/svg/1f60a.svg',
  'https://cdn.jsdelivr.net/npm/joypixels@8.0.0/assets/svg/1f525.svg',
  'https://cdn.jsdelivr.net/npm/joypixels@8.0.0/assets/svg/1f389.svg',
  'https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F60A.svg',
  'https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F525.svg',
  'https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F389.svg',
  'https://cdn.jsdelivr.net/gh/C1710/blobmoji@main/svg/emoji_u1f60a.svg',
  'https://cdn.jsdelivr.net/gh/C1710/blobmoji@main/svg/emoji_u1f525.svg',
  'https://cdn.jsdelivr.net/gh/C1710/blobmoji@main/svg/emoji_u1f389.svg',
  
  'https://cdn.jsdelivr.net/gh/realityripple/emoji/oneui/1f60a.png',
  'https://cdn.jsdelivr.net/gh/realityripple/emoji/oneui/1f525.png',
  'https://cdn.jsdelivr.net/gh/realityripple/emoji/oneui/1f389.png',
  
  'https://cdn.jsdelivr.net/gh/realityripple/emoji/whatsapp/1f60a.png',
  'https://cdn.jsdelivr.net/gh/realityripple/emoji/whatsapp/1f525.png',
  'https://cdn.jsdelivr.net/gh/realityripple/emoji/whatsapp/1f389.png',
  
  'https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/1f60a_3d.png',
  'https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/1f525_3d.png',
  'https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/1f389_3d.png',
];
async function warmCache() {
  let cache; try { cache = await caches.open(PREVIEW_CACHE); } catch (_) { return; }
  await Promise.allSettled(PREVIEW_URLS.map(async url => {
    try { if (!await cache.match(url)) { const r = await fetch(url); if (r.ok) await cache.put(url, r); } } catch (_) {}
  }));
}
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['emojiStyle'], r => { if (!r.emojiStyle) chrome.storage.local.set({ emojiStyle: 'native' }); });
  warmCache();
});
chrome.runtime.onStartup.addListener(warmCache);
chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg.type === 'APPLY_STYLE') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_STYLE', style: msg.style }, () => void chrome.runtime.lastError);
      sendResponse({});
    });
    return true;
  }
});
