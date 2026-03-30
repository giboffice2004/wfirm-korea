// ================================================================
//  관리자 패널 모듈
// ================================================================
import { textFields, renderAll, renderNews, renderGallery, DEFAULT_BG_IMAGES } from "./render.js";
import { db }           from "./firebase-config.js";
import { getCurrentUser, logout } from "./auth.js";
import { createUploadWidget }     from "./cloudinary.js";
import { ref, set }               from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

let _appState = {};
let _setAppState; // main.js에서 주입

export function initAdmin(appState, setAppState) {
  _appState    = appState;
  _setAppState = setAppState;

  // 패널 열기/닫기
  document.getElementById('btn-admin-close-x')?.addEventListener('click',      closePanel);
  document.getElementById('btn-admin-close-bottom')?.addEventListener('click', closePanel);

  // 저장 버튼
  document.getElementById('btn-final-save')?.addEventListener('click', saveData);
}

export function openAdminPanel(appState) {
  _appState = appState;
  const panel = document.getElementById('admin-panel');
  if (!panel) return;
  panel.style.display = 'flex'; // 레이아웃을 위해 flex로 변경
  setTimeout(() => panel.classList.add('active'), 10);
  syncToAdmin();
}

function closePanel() {
  const panel = document.getElementById('admin-panel');
  if (panel) {
    panel.classList.remove('active');
    setTimeout(() => { panel.style.display = 'none'; }, 400); // 애니메이션 시간(0.4s)에 맞춤
  }
}

// ── Admin UI → appState 동기화 ────────────────────────────
function syncToAdmin() {
  // 유튜브 ID
  const ytInput = document.getElementById('cfg-yt-id');
  if (ytInput) ytInput.value = _appState.content?.ytId || '';

  // 히어로 배경
  _buildHeroSlots();

  // 텍스트 섹션
  _buildTextInputs();

  // 갤러리
  _buildGallerySlots('c', 'adm-img-list-c', 'ceremony', '행사 사진');
  _buildGallerySlots('o', 'adm-img-list-o', 'office',   '사무국 시설');

  // 뉴스
  _buildNewsSlots();
}

// ── 히어로 배경 슬롯 ──────────────────────────────────────
function _buildHeroSlots() {
  const list = document.getElementById('adm-hero-list');
  if (!list) return;
  list.innerHTML = '';

  let bgs = _appState.theme?.bgImages || [];
  if (!bgs.length) bgs = DEFAULT_BG_IMAGES;
  bgs.forEach(url => _addHeroSlot(url));
  if (!list.children.length) _addHeroSlot('');
}

function _addHeroSlot(existingUrl = '') {
  const list = document.getElementById('adm-hero-list');
  if (!list) return;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;margin-bottom:12px;padding:20px;background:#fff;border-radius:14px;border:1.5px solid #e2e8f0;';

  const urlInput = document.createElement('input');
  urlInput.type        = 'text';
  urlInput.className   = 'admin-input hero-bg-url';
  urlInput.placeholder = '이미지 URL 직접 입력 또는 아래에서 업로드';
  urlInput.value       = existingUrl;
  urlInput.style.marginBottom = '8px';
  wrap.appendChild(urlInput);

  // Cloudinary 업로드 위젯
  createUploadWidget(wrap, (url) => { urlInput.value = url; });

  // 삭제 버튼
  const del = document.createElement('button');
  del.type      = 'button';
  del.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
  del.style.cssText = 'position:absolute;top:10px;right:12px;background:none;border:none;color:#ff4d4d;font-size:20px;cursor:pointer;';
  del.onclick   = () => wrap.remove();
  wrap.appendChild(del);

  list.appendChild(wrap);
}

// ── 텍스트 입력 빌드 ──────────────────────────────────────
function _buildTextInputs() {
  const tc = document.getElementById('admin-text-inputs');
  if (!tc) return;
  tc.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'admin-group';
  header.innerHTML = '<h4>2. 텍스트 및 스타일 통합 관리</h4>';
  tc.appendChild(header);

  textFields.forEach(f => {
    const o   = _appState.content?.[f.id] || {};
    const grp = document.createElement('div');
    grp.className = 'admin-group';
    grp.innerHTML = `
      <label style="font-size:13px;font-weight:900;">${f.label}</label>
      <textarea id="adm-txt-${f.id}" class="admin-input" style="margin-top:10px;">${o.text ?? f.def}</textarea>
      <div class="style-grid">
        <div>
          <label>폰트</label>
          <select id="adm-font-${f.id}" class="admin-input">
            <option value="'Noto Sans KR',sans-serif" ${(o.font||f.font).includes('Noto')?'selected':''}>고딕</option>
            <option value="'Inter',sans-serif"         ${(o.font||f.font).includes('Inter')?'selected':''}>테크</option>
          </select>
        </div>
        <div>
          <label>크기</label>
          <input type="text" id="adm-sz-${f.id}"    class="admin-input" value="${o.sz    ?? f.sz}">
        </div>
        <div>
          <label>색상</label>
          <input type="color"  id="adm-col-${f.id}"   style="width:100%;height:36px;border:none;border-radius:8px;" value="${o.col ?? f.col}">
        </div>
        <div>
          <label>정렬</label>
          <select id="adm-align-${f.id}" class="admin-input">
            <option value="left"   ${(o.align||f.align)==='left'  ?'selected':''}>좌</option>
            <option value="center" ${(o.align||f.align)==='center'?'selected':''}>중</option>
            <option value="right"  ${(o.align||f.align)==='right' ?'selected':''}>우</option>
          </select>
        </div>
      </div>`;
    tc.appendChild(grp);
  });
}

// ── 갤러리 슬롯 빌드/추가 ────────────────────────────────
function _buildGallerySlots(type, listId, key, label) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = '';
  const imgs  = _appState.images?.[key]            || [];
  const descs = _appState.images?.[`${key}Desc`]   || [];
  imgs.forEach((url, i) => _addGallerySlot(type, listId, url, descs[i] || ''));
}

function _addGallerySlot(type, listId, url = '', desc = '') {
  const list = document.getElementById(listId);
  if (!list) return;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;margin-bottom:12px;padding:20px;background:#fff;border-radius:14px;border:1.5px solid #e2e8f0;';

  const urlInput        = document.createElement('input');
  urlInput.type         = 'text';
  urlInput.className    = 'admin-input img-url';
  urlInput.placeholder  = '이미지 URL (직접 입력 또는 업로드)';
  urlInput.value        = url;
  wrap.appendChild(urlInput);

  // Cloudinary 업로드 위젯
  createUploadWidget(wrap, (uploadedUrl) => { urlInput.value = uploadedUrl; });

  const descInput       = document.createElement('input');
  descInput.type        = 'text';
  descInput.className   = 'admin-input img-desc';
  descInput.placeholder = '사진 캡션';
  descInput.value       = desc;
  descInput.style.marginTop = '8px';
  wrap.appendChild(descInput);

  const del = document.createElement('button');
  del.type      = 'button';
  del.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
  del.style.cssText = 'position:absolute;top:10px;right:12px;background:none;border:none;color:#ff4d4d;font-size:20px;cursor:pointer;';
  del.onclick   = () => wrap.remove();
  wrap.appendChild(del);

  list.appendChild(wrap);
}

// ── 뉴스 슬롯 ────────────────────────────────────────────
function _buildNewsSlots() {
  const list = document.getElementById('adm-news-list');
  if (!list) return;
  list.innerHTML = '';
  (_appState.news || []).forEach(n => _addNewsSlot(n));
}

function _addNewsSlot(n = {}) {
  const list = document.getElementById('adm-news-list');
  if (!list) return;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;margin-bottom:12px;padding:20px;background:#fff;border-radius:14px;border:1.5px solid #e2e8f0;';
  wrap.innerHTML = `
    <div style="display:flex;gap:10px;">
      <input type="text" class="admin-input news-date" placeholder="2000-00-00" value="${n.date || ''}">
      <input type="text" class="admin-input news-tag"  placeholder="출처/분류"   value="${n.tag  || ''}">
    </div>
    <input type="text" class="admin-input news-title" placeholder="뉴스 제목"         value="${n.title || ''}">
    <input type="text" class="admin-input news-url"   placeholder="원본 링크 URL"     value="${n.url   || ''}" style="margin-bottom:0;">
    <button type="button" onclick="this.parentElement.remove()"
      style="position:absolute;top:10px;right:12px;background:none;border:none;color:#ff4d4d;font-size:20px;cursor:pointer;">
      <i class="fa-solid fa-circle-xmark"></i>
    </button>`;
  list.appendChild(wrap);
}

// ── 전역 노출 (인라인 onclick용) ──────────────────────────
window.addGallerySlot = (type) => {
  const listId = type === 'c' ? 'adm-img-list-c' : 'adm-img-list-o';
  _addGallerySlot(type, listId);
};
window.addHeroSlot   = () => _addHeroSlot();
window.addNewsSlot   = () => _addNewsSlot();

// ── 저장 ─────────────────────────────────────────────────
async function saveData() {
  if (!getCurrentUser()) {
    alert('로그인이 필요합니다.');
    return;
  }

  const statusEl = document.getElementById('save-status');
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  let dateError = false;

  document.querySelectorAll('.news-date').forEach(input => {
    const valid = !input.value.trim() || dateRegex.test(input.value.trim());
    input.classList.toggle('error', !valid);
    if (!valid) dateError = true;
  });

  if (dateError) {
    _showStatus(statusEl, '❌ 날짜 형식 오류 (YYYY-MM-DD)', '#fff5f5', '#ff4d4d');
    return;
  }

  _showStatus(statusEl, '동기화 중...', 'transparent', 'var(--accent-purple)');

  // 히어로 배경
  _appState.theme.bgImages = [];
  document.querySelectorAll('#adm-hero-list div').forEach(div => {
    const url = div.querySelector('.hero-bg-url')?.value?.trim();
    if (url) _appState.theme.bgImages.push(url);
  });

  // 유튜브 ID
  _appState.content.ytId = document.getElementById('cfg-yt-id')?.value || '';

  // 텍스트
  textFields.forEach(f => {
    _appState.content[f.id] = {
      text:  document.getElementById(`adm-txt-${f.id}`)?.value   || '',
      sz:    document.getElementById(`adm-sz-${f.id}`)?.value    || f.sz,
      col:   document.getElementById(`adm-col-${f.id}`)?.value   || f.col,
      align: document.getElementById(`adm-align-${f.id}`)?.value || f.align,
      font:  document.getElementById(`adm-font-${f.id}`)?.value  || f.font,
    };
  });

  // 갤러리 — ceremony
  _appState.images.ceremony     = [];
  _appState.images.ceremonyDesc = [];
  document.querySelectorAll('#adm-img-list-c > div').forEach(div => {
    const url = div.querySelector('.img-url')?.value?.trim();
    if (url) {
      _appState.images.ceremony.push(url);
      _appState.images.ceremonyDesc.push(div.querySelector('.img-desc')?.value || '');
    }
  });

  // 갤러리 — office
  _appState.images.office     = [];
  _appState.images.officeDesc = [];
  document.querySelectorAll('#adm-img-list-o > div').forEach(div => {
    const url = div.querySelector('.img-url')?.value?.trim();
    if (url) {
      _appState.images.office.push(url);
      _appState.images.officeDesc.push(div.querySelector('.img-desc')?.value || '');
    }
  });

  // 뉴스
  _appState.news = [];
  document.querySelectorAll('#adm-news-list > div').forEach(div => {
    const title = div.querySelector('.news-title')?.value?.trim();
    if (title) {
      _appState.news.push({
        date:  div.querySelector('.news-date')?.value?.trim() || '',
        tag:   div.querySelector('.news-tag')?.value?.trim()  || '',
        title, url: div.querySelector('.news-url')?.value?.trim() || ''
      });
    }
  });

  try {
    await set(ref(db, 'wfirm'), _appState);
    _showStatus(statusEl, '✅ 동기화 완료!', '#f0fff9', 'var(--primary)');
    if (_setAppState) _setAppState(_appState);
    renderAll(_appState);
  } catch (e) {
    console.error('[Firebase Save]', e);
    _showStatus(statusEl, '❌ 저장 실패 — 로그인 상태를 확인하세요', '#fff5f5', '#ff4d4d');
  }

  setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 3500);
}

function _showStatus(el, msg, bg, color) {
  if (!el) return;
  el.innerText          = msg;
  el.style.background   = bg;
  el.style.color        = color;
  el.style.display      = 'block';
}
