(function () {
  'use strict';

  const CLS       = 'esw-img';
  const DISC_ATTR = 'data-esw-disc';

  const EMOJI_RE = /(?:\p{RI}\p{RI}|\p{Extended_Pictographic}(?:\uFE0F)?(?:[\u{1F3FB}-\u{1F3FF}])?(?:\u{200D}(?:\p{Extended_Pictographic}(?:\uFE0F)?(?:[\u{1F3FB}-\u{1F3FF}])?))*)/gsu;

  const _urlCache = new Map();

  function toHex(emoji) {
    const out = [];
    for (let i = 0; i < emoji.length;) {
      const cp = emoji.codePointAt(i);
      if (cp !== 0xFE0F) out.push(cp.toString(16));
      i += cp > 0xFFFF ? 2 : 1;
    }
    return out;
  }

  function emojiUrl(emoji, style) {
    const key = style + emoji;
    if (_urlCache.has(key)) return _urlCache.get(key);
    const hex = toHex(emoji);
    if (!hex.length) { _urlCache.set(key, null); return null; }
    const j  = hex.join('-');
    const nj = hex.filter(h => h !== 'fe0f').join('_');
    const elk = s => `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=${s}`;
    const rr  = f => `https://cdn.jsdelivr.net/gh/realityripple/emoji/${f}/${j}.png`;
    const url = {
      ios:       elk('apple'),
      google:    elk('google'),
      facebook:  elk('facebook'),
      twitter:   elk('twitter'),
      twemoji:   `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${j}.svg`,
      noto:      `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/emoji_u${nj}.svg`,
      openmoji:  `https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/${j.toUpperCase()}.svg`,
      blobmoji:  `https://cdn.jsdelivr.net/gh/C1710/blobmoji@main/svg/emoji_u${nj}.svg`,
      joypixels: `https://cdn.jsdelivr.net/npm/joypixels@8.0.0/assets/svg/${hex.filter(h=>h!=='fe0f')[0]}.svg`,
      whatsapp:  rr('whatsapp'),
      samsung:   rr('oneui'),
      windows:   `https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/${j}_3d.png`,
    }[style] ?? null;
    _urlCache.set(key, url);
    return url;
  }

  function getDiscordSize(img) {
    const w = parseFloat(img.getAttribute('width')  || img.style.width)  || 0;
    const h = parseFloat(img.getAttribute('height') || img.style.height) || 0;
    if (w && h) return { w, h };
    const cs = window.getComputedStyle(img);
    const cw = parseFloat(cs.width)||0, ch = parseFloat(cs.height)||0;
    if (cw && ch) return { w:cw, h:ch };
    if (img.naturalWidth) return { w:img.naturalWidth, h:img.naturalHeight };
    if (img.closest('[class*="jumbo"],[class*="large"],[class*="jumboable"]')) return { w:48, h:48 };
    return null;
  }
  function applyDiscordSize(img, size) {
    if (!size) return;
    img.style.setProperty('width',      size.w+'px','important');
    img.style.setProperty('height',     size.h+'px','important');
    img.style.setProperty('min-width',  size.w+'px','important');
    img.style.setProperty('min-height', size.h+'px','important');
  }

  function processText(node, style) {
    const text = node.textContent;
    EMOJI_RE.lastIndex = 0;
    if (!EMOJI_RE.test(text)) return;
    EMOJI_RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while ((m = EMOJI_RE.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const emoji = m[0], cdnUrl = emojiUrl(emoji, style);
      if (cdnUrl) {
        const img = document.createElement('img');
        img.src = cdnUrl; img.alt = emoji; img.title = emoji;
        img.className = CLS;
        img.setAttribute('data-emoji', emoji);
        img.style.cssText = 'display:inline!important;width:1.1em!important;height:1.1em!important;vertical-align:-0.15em!important;margin:0 0.05em!important;object-fit:contain!important;border:none!important;background:transparent!important;box-shadow:none!important;max-width:none!important;';
        img.onerror = function () { this.replaceWith(document.createTextNode(this.getAttribute('data-emoji'))); };
        frag.appendChild(img);
      } else {
        frag.appendChild(document.createTextNode(emoji));
      }
      last = m.index + emoji.length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (frag.childNodes.length > 1 || (frag.firstChild && frag.firstChild.nodeType !== Node.TEXT_NODE))
      node.parentNode.replaceChild(frag, node);
  }

  const SKIP = new Set(['script','style','noscript','svg','canvas','textarea','input','code','pre']);

  function walkText(root, style) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (SKIP.has(p.tagName.toLowerCase())) return NodeFilter.FILTER_REJECT;
        if (p.classList?.contains(CLS)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = []; let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(n => processText(n, style));
  }

  function processDiscordImgs(root, style) {
    if (typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('img.emoji[alt],img[data-type="emoji"][alt],img[class*="emoji"][alt],img[aria-label][class*="emoji"]').forEach(img => {
      if (img.classList.contains(CLS)) return;
      const emoji = img.alt || img.getAttribute('aria-label') || '';
      if (!emoji) return;
      EMOJI_RE.lastIndex = 0; if (!EMOJI_RE.test(emoji)) return; EMOJI_RE.lastIndex = 0;
      const cdnUrl = emojiUrl(emoji, style);
      if (!cdnUrl) return;
      const size = getDiscordSize(img);
      if (!img.hasAttribute('data-esw-orig')) {
        img.setAttribute('data-esw-orig', img.src);
        if (size) img.setAttribute('data-esw-orig-size', JSON.stringify(size));
      }
      img.setAttribute(DISC_ATTR, cdnUrl); img.src = cdnUrl;
      applyDiscordSize(img, size);
      img.onerror = function () { const o=this.getAttribute('data-esw-orig'); if(o) this.src=o; };
    });
  }

  function revertAll() {
    document.querySelectorAll(`img.${CLS}`).forEach(img =>
      img.replaceWith(document.createTextNode(img.getAttribute('data-emoji')||img.alt||'')));
    document.querySelectorAll(`[${DISC_ATTR}]`).forEach(img => {
      const orig = img.getAttribute('data-esw-orig'); if (orig) img.src = orig;
      const os = img.getAttribute('data-esw-orig-size');
      if (os) try {
        const {w,h} = JSON.parse(os);
        ['width','height','min-width','min-height'].forEach(p => img.style.removeProperty(p));
        img.style.width = w+'px'; img.style.height = h+'px';
      } catch(_) {}
      img.removeAttribute(DISC_ATTR); img.removeAttribute('data-esw-orig'); img.removeAttribute('data-esw-orig-size');
    });
  }

  function swapSrcs(style) {
    document.querySelectorAll(`img.${CLS}`).forEach(img => {
      const u = emojiUrl(img.getAttribute('data-emoji'), style); if (u) img.src = u;
    });
    document.querySelectorAll(`[${DISC_ATTR}]`).forEach(img => {
      const emoji = img.alt||img.getAttribute('aria-label')||'';
      const u = emojiUrl(emoji, style); if (!u) return;
      img.setAttribute(DISC_ATTR, u); img.src = u;
      const os = img.getAttribute('data-esw-orig-size');
      if (os) try { applyDiscordSize(img, JSON.parse(os)); } catch(_) {}
    });
    processDiscordImgs(document.body, style);
  }

  let activeStyle='native', hasProcessed=false;
  function applyStyle(style) {
    if (style==='native') { revertAll(); stopObserver(); activeStyle='native'; hasProcessed=false; return; }
    if (hasProcessed) { swapSrcs(style); activeStyle=style; return; }
    if (document.body) { walkText(document.body, style); processDiscordImgs(document.body, style); }
    activeStyle=style; hasProcessed=true; startObserver();
  }

  let observer=null, obTimer=null;
  const obQueue=[];

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      processText(node, activeStyle);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      walkText(node, activeStyle);
      processDiscordImgs(node, activeStyle);

      if (node.shadowRoot) {
        walkText(node.shadowRoot, activeStyle);
      }
    }
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(mutations => {
      const nodes = [];
      mutations.forEach(({ addedNodes }) => addedNodes.forEach(n => nodes.push(n)));
      if (!nodes.length) return;

      const isYouTube = location.hostname.includes('youtube.com');

      if (isYouTube) {
        nodes.forEach(processNode);
      } else {
        nodes.forEach(n => obQueue.push(n));
        clearTimeout(obTimer);
        obTimer = setTimeout(() => obQueue.splice(0).forEach(processNode), 80);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (observer) { observer.disconnect(); observer = null; }
    clearTimeout(obTimer); obQueue.length = 0;
  }

  document.addEventListener('copy', e => {
    const sel = window.getSelection();
    if (!sel||sel.rangeCount===0||sel.isCollapsed) return;
    const frag = sel.getRangeAt(0).cloneContents();
    const ours = frag.querySelectorAll(`img.${CLS}`);
    const disc = frag.querySelectorAll(`[${DISC_ATTR}]`);
    if (!ours.length&&!disc.length) return;
    ours.forEach(img => img.replaceWith(document.createTextNode(img.getAttribute('data-emoji')||img.alt||'')));
    disc.forEach(img => img.replaceWith(document.createTextNode(img.alt||img.getAttribute('aria-label')||'')));
    const wrap = document.createElement('div'); wrap.appendChild(frag);
    try { e.clipboardData.setData('text/plain',wrap.textContent); e.clipboardData.setData('text/html',wrap.innerHTML); e.preventDefault(); } catch(_) {}
  });

  chrome.runtime.onMessage.addListener(msg => { if (msg.type==='SET_STYLE') applyStyle(msg.style); });
  chrome.storage.local.get(['emojiStyle'], r => { const s=r.emojiStyle||'native'; if(s!=='native') applyStyle(s); });
})();
