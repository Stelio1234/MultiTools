const DOT_TYPES = [
  { val:'square',         label:'Square',     d:'<rect x="3" y="3" width="16" height="16"/>' },
  { val:'dots',           label:'Dots',       d:'<circle cx="11" cy="11" r="8"/>' },
  { val:'rounded',        label:'Rounded',    d:'<rect x="3" y="3" width="16" height="16" rx="4"/>' },
  { val:'extra-rounded',  label:'X-Round',    d:'<rect x="3" y="3" width="16" height="16" rx="8"/>' },
  { val:'classy',         label:'Classy',     d:'<polygon points="11,3 19,11 11,19 3,11"/>' },
  { val:'classy-rounded', label:'Classy+',    d:'<polygon points="11,3 19,11 11,19 3,11"/>' },
  { val:'dots',           label:'Tiny Dots',  d:'<circle cx="11" cy="11" r="5"/>', scale:0.6, id:'tiny-dots' },
  { val:'square',         label:'Sm.Square',  d:'<rect x="6" y="6" width="10" height="10"/>', id:'small-sq' },
  { val:'square',         label:'Cross',      d:'<path d="M8 3h6v5h5v6h-5v5H8v-5H3V8h5z"/>', id:'cross' },
  { val:'classy',         label:'Diamond',    d:'<polygon points="11,2 20,11 11,20 2,11"/>', id:'diamond' },
  { val:'dots',           label:'Squircle',   d:'<rect x="4" y="4" width="14" height="14" rx="6"/>', id:'squircle' },
  { val:'extra-rounded',  label:'Pill',       d:'<rect x="2" y="6" width="18" height="10" rx="5"/>', id:'pill' },
];

const CORNER_SQ_TYPES = [
  { val:'square',         label:'Square',   d:'<rect x="3" y="3" width="16" height="16"/>' },
  { val:'extra-rounded',  label:'Round',    d:'<rect x="3" y="3" width="16" height="16" rx="8"/>' },
  { val:'dot',            label:'Circle',   d:'<circle cx="11" cy="11" r="8"/>' },
  { val:'square',         label:'Inner',    d:'<path d="M3 3h16v16H3zM6 6v10h10V6z" fill-rule="evenodd"/>', id:'inner' },
];

const CORNER_DOT_TYPES = [
  { val:'square',   label:'Square',  d:'<rect x="5" y="5" width="12" height="12"/>' },
  { val:'dot',      label:'Circle',  d:'<circle cx="11" cy="11" r="6"/>' },
  { val:'rounded',  label:'Round',   d:'<rect x="5" y="5" width="12" height="12" rx="3"/>' },
  { val:'classy',   label:'Diamond', d:'<polygon points="11,5 17,11 11,17 5,11"/>' },
];

const GRADIENT_PRESETS = [
  { from:'#000000', to:'#45a049', label:'Matrix' },
  { from:'#0f0c29', to:'#302b63', label:'Velvet' },
  { from:'#f7971e', to:'#ffd200', label:'Amber' },
  { from:'#c94b4b', to:'#4b134f', label:'Crimson' },
  { from:'#000000', to:'#1a1a2e', label:'Void' },
  { from:'#00b4db', to:'#0083b0', label:'Ocean' },
  { from:'#f953c6', to:'#b91d73', label:'Fuchsia' },
  { from:'#1a1a1a', to:'#ff6b35', label:'Ember' },
  { from:'#11998e', to:'#38ef7d', label:'Mint' },
  { from:'#4facfe', to:'#00f2fe', label:'Cyan' },
];

let dotType = 'square';
let dotTypeId = null;
let cornerSqType = 'square';
let cornerDotType = 'dot';
let logoData = '';

const qrCode = new QRCodeStyling({
  width:300, height:300, type:'canvas',
  data:'https://example.com',
  dotsOptions:{ color:'#000000', type:'square' },
  backgroundOptions:{ color:'#ffffff' },
  cornersSquareOptions:{ type:'square' },
  cornersDotOptions:{ type:'dot' },
});
qrCode.append(document.getElementById('qr-code'));

function svg(d) {
  return `<svg viewBox="0 0 22 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">${d}</svg>`;
}

function buildDotGrid() {
  const grid = document.getElementById('dot-grid');
  DOT_TYPES.forEach((d, i) => {
    const uid = d.id || d.val + i;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'dot-option' + (i === 0 ? ' active' : '');
    el.setAttribute("aria-pressed", String(el.classList.contains("active")));
    el.dataset.val = d.val;
    el.dataset.uid = uid;
    el.innerHTML = svg(d.d) + `<span>${d.label}</span>`;
    el.addEventListener('click', () => {
      dotType = d.val;
      dotTypeId = uid;
      document.querySelectorAll('#dot-grid .dot-option').forEach(x => { x.classList.remove('active'); x.setAttribute("aria-pressed", "false"); });
      el.classList.add('active');
      el.setAttribute('aria-pressed', 'true');
      updateQR();
    });
    grid.appendChild(el);
  });
}

function buildCornerGrids() {
  const sqGrid = document.getElementById('corner-sq-grid');
  CORNER_SQ_TYPES.forEach((d, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'corner-option' + (i === 0 ? ' active' : '');
    el.setAttribute("aria-pressed", String(el.classList.contains("active")));
    el.innerHTML = svg(d.d) + `<span>${d.label}</span>`;
    el.addEventListener('click', () => {
      cornerSqType = d.val;
      document.querySelectorAll('#corner-sq-grid .corner-option').forEach(x => { x.classList.remove('active'); x.setAttribute("aria-pressed", "false"); });
      el.classList.add('active');
      el.setAttribute('aria-pressed', 'true');
      updateQR();
    });
    sqGrid.appendChild(el);
  });

  const dotGrid = document.getElementById('corner-dot-grid');
  CORNER_DOT_TYPES.forEach((d, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'corner-option' + (i === 1 ? ' active' : '');
    el.setAttribute("aria-pressed", String(el.classList.contains("active")));
    el.innerHTML = svg(d.d) + `<span>${d.label}</span>`;
    el.addEventListener('click', () => {
      cornerDotType = d.val;
      document.querySelectorAll('#corner-dot-grid .corner-option').forEach(x => { x.classList.remove('active'); x.setAttribute("aria-pressed", "false"); });
      el.classList.add('active');
      el.setAttribute('aria-pressed', 'true');
      updateQR();
    });
    dotGrid.appendChild(el);
  });
}

function buildGradientPresets() {
  const wrap = document.getElementById('grad-presets');
  GRADIENT_PRESETS.forEach(p => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'gp';
    el.title = p.label;
    el.setAttribute("aria-label", p.label);
    el.style.background = `linear-gradient(135deg,${p.from},${p.to})`;
    el.addEventListener('click', () => {
      document.getElementById('color-from').value = p.from;
      document.getElementById('color-to').value = p.to;
      document.getElementById('use-gradient').checked = true;
      document.getElementById('gradient-controls').style.display = '';
      document.getElementById('solid-controls').style.display = 'none';
      updateGradientPreview();
      updateQR();
    });
    wrap.appendChild(el);
  });
}

function getAngle() {
  const d = document.getElementById('gradient-dir').value;
  if (d === 'custom') return parseFloat(document.getElementById('gradient-angle').value) || 0;
  return parseFloat(d);
}

function updateGradientPreview() {
  const from = document.getElementById('color-from').value;
  const to = document.getElementById('color-to').value;
  const mid = document.getElementById('color-mid').value;
  const threeStop = document.getElementById('three-stop').checked;
  const type = document.getElementById('gradient-type').value;
  const deg = getAngle() * (180 / Math.PI);
  let g;
  if (type === 'radial') {
    g = threeStop ? `radial-gradient(circle,${from},${mid},${to})` : `radial-gradient(circle,${from},${to})`;
  } else {
    g = threeStop ? `linear-gradient(${deg}deg,${from},${mid},${to})` : `linear-gradient(${deg}deg,${from},${to})`;
  }
  document.getElementById('gradient-preview').style.background = g;
}

function buildData() {
  const type = document.getElementById('qr-type').value;
  if (type === 'wifi') {
    const h = document.getElementById('wifi-hidden').checked ? 'H:true;' : '';
    return `WIFI:S:${v('wifi-ssid')};T:${v('wifi-type')};P:${v('wifi-pass')};${h};`;
  }
  if (type === 'phone') return `tel:${v('phone-num')}`;
  if (type === 'email') {
    let s = `mailto:${v('email-addr')}`;
    const params = [];
    if (v('email-subject')) params.push('subject=' + encodeURIComponent(v('email-subject')));
    if (v('email-body')) params.push('body=' + encodeURIComponent(v('email-body')));
    if (params.length) s += '?' + params.join('&');
    return s;
  }
  if (type === 'sms') {
    const n = v('sms-num'), m = v('sms-body');
    return m ? `sms:${n}?body=${encodeURIComponent(m)}` : `sms:${n}`;
  }
  if (type === 'vcard') {
    const lines = ['BEGIN:VCARD','VERSION:3.0',
      `N:${v('vc-last')};${v('vc-first')};;;`,
      `FN:${v('vc-first')} ${v('vc-last')}`,
    ];
    if (v('vc-org')) lines.push(`ORG:${v('vc-org')}`);
    if (v('vc-title')) lines.push(`TITLE:${v('vc-title')}`);
    if (v('vc-phone')) lines.push(`TEL;TYPE=WORK,VOICE:${v('vc-phone')}`);
    if (v('vc-mobile')) lines.push(`TEL;TYPE=CELL:${v('vc-mobile')}`);
    if (v('vc-email')) lines.push(`EMAIL:${v('vc-email')}`);
    if (v('vc-web')) lines.push(`URL:${v('vc-web')}`);
    if (v('vc-street')||v('vc-city')) lines.push(`ADR;TYPE=WORK:;;${v('vc-street')};${v('vc-city')};${v('vc-state')};${v('vc-zip')};${v('vc-country')}`);
    if (v('vc-note')) lines.push(`NOTE:${v('vc-note')}`);
    lines.push('END:VCARD');
    return lines.join('\n');
  }
  if (type === 'geo') return `geo:${v('geo-lat')},${v('geo-lng')}`;
  if (type === 'event') {
    const fmt = id => (document.getElementById(id).value||'').replace(/[-:T]/g,'').slice(0,15)+'Z';
    return `BEGIN:VEVENT\nSUMMARY:${v('ev-title')}\nLOCATION:${v('ev-loc')}\nDTSTART:${fmt('ev-start')}\nDTEND:${fmt('ev-end')}\nDESCRIPTION:${v('ev-desc')}\nEND:VEVENT`;
  }
  return v('content') || 'https://example.com';
}

function v(id) { return (document.getElementById(id)||{}).value || ''; }

function getSize() {
  const p = document.getElementById('size-preset').value;
  if (p === 'custom') return Math.min(2000, Math.max(50, parseInt(v('qr-size')) || 300));
  return parseInt(p);
}

function updateQR() {
  const size = getSize();
  const useGrad = document.getElementById('use-gradient').checked;
  const from = document.getElementById('color-from').value;
  const to = document.getElementById('color-to').value;
  const mid = document.getElementById('color-mid').value;
  const threeStop = document.getElementById('three-stop').checked;
  const gradType = document.getElementById('gradient-type').value;
  const angle = getAngle();
  const transBg = document.getElementById('transparent-bg').checked;
  const marginVal = parseInt(v('qr-margin')) || 0;
  const customCorner = document.getElementById('custom-corner-color').checked;

  let dotsOptions = { type: dotType };
  if (useGrad) {
    const stops = threeStop
      ? [{offset:0,color:from},{offset:0.5,color:mid},{offset:1,color:to}]
      : [{offset:0,color:from},{offset:1,color:to}];
    dotsOptions.gradient = { type:gradType, rotation:angle, colorStops:stops };
  } else {
    dotsOptions.color = document.getElementById('solid-color').value;
  }

  const cornersSquareOptions = { type: cornerSqType };
  const cornersDotOptions = { type: cornerDotType };
  if (customCorner) {
    cornersSquareOptions.gradient = {
      type:'linear', rotation:0.7854,
      colorStops:[{offset:0,color:document.getElementById('corner-from').value},{offset:1,color:document.getElementById('corner-to').value}]
    };
  }

  qrCode.update({
    width:size, height:size,
    data: buildData(),
    margin: marginVal,
    dotsOptions,
    backgroundOptions:{ color: transBg ? 'transparent' : document.getElementById('bg-color').value },
    cornersSquareOptions,
    cornersDotOptions,
    image: logoData || null,
    imageOptions:{
      crossOrigin:'anonymous',
      margin: parseInt(v('logo-margin')) || 5,
      imageSize: parseInt(v('logo-size')) / 100,
      hideBackgroundDots: document.getElementById('logo-hide-bg').checked,
    },
    qrOptions:{ errorCorrectionLevel: document.getElementById('error-level').value },
  });

  document.getElementById('info-size').textContent = size;
  document.getElementById('info-ec').textContent = document.getElementById('error-level').value;
  document.getElementById('info-dot').textContent = dotType;
  updateGradientPreview();
}

function togglePanel(id) {
  const panel = document.getElementById(id);
  const expanded = panel.classList.toggle('open');
  panel.querySelector('.panel-header').setAttribute('aria-expanded', String(expanded));
}

function showGroup(type) {
  ['g-text','g-wifi','g-phone','g-email','g-sms','g-vcard','g-geo','g-event'].forEach(g => {
    document.getElementById(g).style.display = 'none';
  });
  const map = {text:'g-text',wifi:'g-wifi',phone:'g-phone',email:'g-email',sms:'g-sms',vcard:'g-vcard',geo:'g-geo',event:'g-event'};
  if (map[type]) document.getElementById(map[type]).style.display = '';
}

$(document).ready(function () {
  buildDotGrid();
  buildCornerGrids();
  buildGradientPresets();
  updateGradientPreview();

  document.getElementById('qr-type').addEventListener('change', function() { showGroup(this.value); updateQR(); });

  document.getElementById('size-preset').addEventListener('change', function() {
    document.getElementById('custom-size-field').style.display = this.value === 'custom' ? '' : 'none';
    updateQR();
  });

  document.getElementById('gradient-dir').addEventListener('change', function() {
    document.getElementById('custom-angle-field').style.display = this.value === 'custom' ? '' : 'none';
    updateGradientPreview(); updateQR();
  });

  document.getElementById('use-gradient').addEventListener('change', function() {
    document.getElementById('gradient-controls').style.display = this.checked ? '' : 'none';
    document.getElementById('solid-controls').style.display = this.checked ? 'none' : '';
    updateQR();
  });

  document.getElementById('custom-corner-color').addEventListener('change', function() {
    document.getElementById('corner-color-controls').style.display = this.checked ? '' : 'none';
    updateQR();
  });

  document.getElementById('three-stop').addEventListener('change', function() {
    document.getElementById('stop3-wrap').style.display = this.checked ? '' : 'none';
    updateGradientPreview(); updateQR();
  });

  document.getElementById('qr-margin').addEventListener('input', function() {
    document.getElementById('margin-val').textContent = this.value + 'px';
    updateQR();
  });

  document.getElementById('logo-size').addEventListener('input', function() {
    document.getElementById('logo-size-val').textContent = this.value + '%';
    updateQR();
  });

  document.getElementById('logo-margin').addEventListener('input', function() {
    document.getElementById('logo-margin-val').textContent = this.value + 'px';
    updateQR();
  });

  document.getElementById('logo').addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return alert('Choose a PNG, JPEG, or WebP image up to 2 MB.');
    const reader = new FileReader();
    reader.onload = e => { logoData = e.target.result; updateQR(); };
    reader.readAsDataURL(file);
  });

  document.getElementById('remove-logo').addEventListener('click', function() {
    logoData = '';
    document.getElementById('logo').value = '';
    updateQR();
  });

  function doDownload() {
    qrCode.download({ name: v('file-name') || 'qr-code', extension: document.getElementById('export-format').value });
  }

  document.getElementById('download').addEventListener('click', doDownload);
  document.getElementById('dl-btn').addEventListener('click', doDownload);
  document.getElementById('reset-btn').addEventListener('click', () => location.reload());

  const liveIds = [
    'content','wifi-ssid','wifi-pass','wifi-type','wifi-hidden','phone-num',
    'email-addr','email-subject','email-body','sms-num','sms-body',
    'vc-first','vc-last','vc-org','vc-title','vc-phone','vc-mobile','vc-email','vc-web',
    'vc-street','vc-city','vc-state','vc-zip','vc-country','vc-note',
    'geo-lat','geo-lng','ev-title','ev-loc','ev-start','ev-end','ev-desc',
    'color-from','color-to','color-mid','bg-color','solid-color','corner-from','corner-to',
    'gradient-type','gradient-angle','gradient-dir','error-level','qr-size',
    'transparent-bg','logo-hide-bg','logo-size','logo-margin',
  ];
  liveIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener('input', () => { updateGradientPreview(); updateQR(); }); el.addEventListener('change', () => { updateGradientPreview(); updateQR(); }); }
  });

  updateQR();
});
