const LABELS = {
  native:    'Native',
  ios:       'iOS / Apple',
  twitter:   'Twitter (Twemoji)',
  google:    'Google Noto',
  facebook:  'Facebook / Meta',
  joypixels: 'JoyPixels',
  openmoji:  'OpenMoji',
  blobmoji:  'Blobmoji',
  samsung:   'Samsung One UI',
  whatsapp:  'WhatsApp',
  windows:   'Windows Fluent',
};

document.addEventListener('DOMContentLoaded', () => {
  const cards     = document.querySelectorAll('.card');
  const applyBtn  = document.getElementById('applyBtn');
  const dot       = document.getElementById('dot');
  const stxt      = document.getElementById('stxt');
  const expandBtn = document.getElementById('expandBtn');
  let selected    = 'native';

  chrome.storage.local.get(['emojiStyle'], r => {
    selected = r.emojiStyle || 'native';
    syncUI(selected);
    if (selected !== 'native') setStatus(true, (LABELS[selected] || selected) + ' is active');
  });

  
  document.querySelectorAll('.prev img').forEach(img => {
    if (img.complete && img.naturalWidth > 0) { img.classList.add('ok'); return; }
    img.onload  = () => img.classList.add('ok');
    img.onerror = () => { img.style.display = 'none'; };
  });

  cards.forEach(c => c.addEventListener('click', () => {
    selected = c.dataset.style; syncUI(selected);
  }));

  applyBtn.addEventListener('click', () => {
    chrome.storage.local.set({ emojiStyle: selected }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (!tabs || !tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_STYLE', style: selected }, () => {
          void chrome.runtime.lastError;
        });
      });
      setStatus(true, (LABELS[selected] || selected) + ' applied! ✓');
      setTimeout(() => setStatus(selected !== 'native',
        selected === 'native' ? 'Native style restored' : (LABELS[selected] || selected) + ' active'
      ), 2000);
    });
  });

  expandBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    window.close();
  });
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key.toLowerCase() === 'e') {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      window.close();
    }
  });

  function syncUI(style) {
    cards.forEach(c => c.classList.toggle('sel', c.dataset.style === style));
    applyBtn.textContent = style === 'native' ? 'Apply (Restore Native)' : 'Apply ' + (LABELS[style] || style);
  }
  function setStatus(active, msg) {
    dot.className  = 'dot'  + (active ? ' on' : '');
    stxt.className = 'stxt' + (active ? ' on' : '');
    stxt.textContent = msg;
  }
});
