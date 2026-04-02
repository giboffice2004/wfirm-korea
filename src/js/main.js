/* ============================================================
   Application State & Firebase Integration Hub
============================================================ */

const firebaseConfig = {
    apiKey:            "AIzaSyBNsFQ6viuZPRBkuawhZg66B9rrqhsIGe0",
    authDomain:        "wfirm-korea.firebaseapp.com",
    databaseURL:       "https://wfirm-korea-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId:         "wfirm-korea",
    storageBucket:     "wfirm-korea.firebasestorage.app",
    messagingSenderId: "968670622632",
    appId:             "1:968670622632:web:bd7a016ef5803e3174e39d"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Cloudinary Configuration (Confirmed by User)
const CL_NAME = 'dda5xcnyf';
const CL_PRESET = 'wfirm-korea';

// Global Cloudinary Upload Widget Handler
function openCloudinaryWidget(targetInput, btn) {
    if(!window.cloudinary) return alert('Cloudinary Library not loaded.');
    
    // 시각적 피드백: 버튼 로딩 상태 표시
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 로딩 중...';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    window.cloudinary.openUploadWidget({
        cloudName: CL_NAME, uploadPreset: CL_PRESET,
        sources: ['local', 'url', 'camera'], multiple: false, 
        cropping: false, // 크롭 기능 비활성화 (원본 유지)
        clientAllowedFormats: ["png", "gif", "jpeg", "jpg"],
        styles: { palette: { window: '#FFFFFF', windowBorder: '#90A0B3', tabIcon: '#0078FF', menuIcons: '#5A616A', textDark: '#000000', textLight: '#FFFFFF', link: '#0078FF', action: '#FF620C', inactiveTabIcon: '#0E2F5A', error: '#F44235', inProgress: '#0078FF', complete: '#20B832', sourceBg: '#E4EBF1' } }
    }, (error, result) => {
        // 창이 닫히거나 성공/실패 시 버튼 복구
        if (result.event === "close") {
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            btn.disabled = false;
        }

        if (!error && result && result.event === "success") {
            targetInput.value = result.info.secure_url;
            targetInput.style.backgroundColor = '#f0fff4';
            targetInput.style.borderColor = '#20B832';
        }
    });
}

let appState = {};

async function loadData() {
    try {
        const snap = await db.ref('wfirm').once('value');
        const data = snap.val();
        if (data) {
            appState = data;
            // Migration: ytId (String) -> ytIds (Array)
            if (appState.content && appState.content.ytId && !appState.content.ytIds) {
                appState.content.ytIds = [appState.content.ytId];
            }
            if (!appState.dynamicTexts) appState.dynamicTexts = [];
        } else {
            console.warn("No data found in database. Initializing default state.");
            initDefaultState();
        }
    } catch (e) {
        console.error("Firebase data load failed:", e);
        initDefaultState();
    }
    renderAll();
    syncToAdmin();
}

function initDefaultState() {
    const BASE = 'https://github.com/giboffice200407-cloud/wfirm-korea/blob/main/src/';
    appState = {
        theme: { 
            bgImages: [
                'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=2000',
                'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=2000',
                'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=2000'
            ] 
        },
        content: { ytIds: ['VHE52iEaPJ4'] },
        images: { ceremony: [], ceremonyDesc: [], office: [], officeDesc: [] },
        news: [],
        dynamicTexts: []
    };
    ['1','2','3','4','5','6'].forEach((n, i) => {
        appState.images.ceremony[i]     = `${BASE}${n}.jpg?raw=true`;
        appState.images.ceremonyDesc[i] = ['개소식 단체','현판 제막식','환영사','MOU 체결식','토론회','단체 사진'][i];
    });
    ['a','b','c'].forEach((n, i) => {
        appState.images.office[i]     = `${BASE}${n}${n === 'a' ? '.jpg' : '.JPG'}?raw=true`;
        appState.images.officeDesc[i] = ['추진사무국 전경','실험시설','연구 현장'][i];
    });
    textFields.forEach(f => {
        let sizeValue = f.sz;
        if(f.id === 'heroTitle' || f.id === 'heroSub') sizeValue = '';
        appState.content[f.id] = { text:f.def, sz:sizeValue, col:f.col, align:f.align, font:f.font };
    });
}

// Global Slot Management for Admin Panel
window.addSlot = function(type) {
    const listMap = { 
        'c':'adm-img-list-c', 
        'o':'adm-img-list-o', 
        'n':'adm-news-list', 
        'h':'adm-hero-list',
        'v':'adm-yt-list',
        't':'adm-extra-text-list'
    };
    const container = document.getElementById(listMap[type]);
    if(!container) return;

    const div = document.createElement('div');
    div.style = "position:relative; margin-bottom:12px; padding:20px; background:#fff; border-radius:15px; border:1px solid #ddd;";
    
    let content = '';
    if(type==='n') {
        content = `<div style="display:flex; gap:10px;"><input type="text" class="admin-input news-date" placeholder="2000-00-00"><input type="text" class="admin-input news-tag" placeholder="출처/분류"></div><input type="text" class="admin-input news-title" placeholder="뉴스 제목"><input type="text" class="admin-input news-url" placeholder="원본 링크 URL">`;
    } else if(type==='v') {
        content = `<input type="text" class="admin-input yt-id-val" placeholder="유튜브 비디오 ID (예: VHE52iEaPJ4)">`;
    } else if(type==='t') {
        content = `<input type="text" class="admin-input extra-text-title" placeholder="카테고리 제목 (예: 추가 안내 사항)"><textarea class="admin-input extra-text-body" style="height:100px;" placeholder="본문 내용을 입력하세요."></textarea>`;
    } else if(type==='h') {
        content = `
            <div style="display:flex; gap:8px;">
                <input type="text" class="admin-input hero-bg-url" placeholder="배경 이미지 URL" style="flex:1; margin-bottom:0;">
                <button class="upload-trigger" style="background:var(--accent); color:var(--primary); border:none; padding:0 15px; border-radius:12px; cursor:pointer; font-weight:900; font-size:12px;">사진 업로드</button>
            </div>`;
    } else {
        content = `
            <div style="display:flex; gap:8px; margin-bottom:12px;">
                <input type="text" class="admin-input img-url" placeholder="이미지 URL" style="flex:1; margin-bottom:0;">
                <button class="upload-trigger" style="background:var(--accent); color:var(--primary); border:none; padding:0 15px; border-radius:12px; cursor:pointer; font-weight:900; font-size:12px;">사진 업로드</button>
            </div>
            <input type="text" class="admin-input img-desc" placeholder="사진 캡션">`;
    }
    content += `<button onclick="this.parentElement.remove()" style="position:absolute; top:8px; right:8px; background:none; border:none; color:red; cursor:pointer; font-size:20px;">&times;</button>`;
    
    div.innerHTML = content;
    
    // Attach Upload Event
    const upBtn = div.querySelector('.upload-trigger');
    if(upBtn) {
        const input = div.querySelector('.hero-bg-url') || div.querySelector('.img-url');
        upBtn.onclick = () => openCloudinaryWidget(input, upBtn);
    }

    container.appendChild(div);
};

function syncToAdmin() {
    // Video IDs Sync
    const ytList = document.getElementById('adm-yt-list');
    if (ytList) {
        ytList.innerHTML = '';
        const ids = appState.content.ytIds || (appState.content.ytId ? [appState.content.ytId] : []);
        ids.forEach(id => {
            window.addSlot('v');
            ytList.lastChild.querySelector('.yt-id-val').value = id;
        });
    }

    // Backgrounds Sync
    const heroList = document.getElementById('adm-hero-list');
    if (heroList) {
        heroList.innerHTML = '';
        (appState.theme.bgImages || []).forEach(url => {
            window.addSlot('h');
            heroList.lastChild.querySelector('.hero-bg-url').value = url;
        });
    }

    // Text Sync
    const tc = document.getElementById('admin-text-inputs');
    if(tc) {
        tc.innerHTML = '<h4>2. 텍스트 및 스타일 통합 관리</h4>';
        textFields.forEach(f => {
            const o = appState.content[f.id] || { text: f.def, sz: f.sz, col: f.col, align: f.align, font: f.font };
            tc.innerHTML += `<div class="admin-group"><label style="font-weight:900;">${f.label}</label><textarea id="adm-txt-${f.id}" class="admin-input" style="height:100px;">${o.text || f.def}</textarea><div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px;"><input type="text" id="adm-sz-${f.id}" class="admin-input" value="${o.sz || f.sz}"><input type="color" id="adm-col-${f.id}" class="admin-input" value="${o.col || f.col}" style="padding:0;"><select id="adm-align-${f.id}" class="admin-input"><option value="left" ${o.align==='left'?'selected':''}>좌</option><option value="center" ${o.align==='center'?'selected':''}>중</option></select><select id="adm-font-${f.id}" class="admin-input"><option value="'Noto Sans KR',sans-serif" ${o.font==="'Noto Sans KR',sans-serif"?'selected':''}>고딕</option><option value="'Inter',sans-serif" ${o.font==="'Inter',sans-serif"?'selected':''}>테크</option></select></div></div>`;
        });
    }
    
    // List Sync Helpers
    const syncList = (key, listId, urlClass) => {
        const list = document.getElementById(listId);
        if(!list) return;
        list.innerHTML = '';
        (appState.images[key] || []).forEach((url, i) => {
            window.addSlot(key === 'ceremony' ? 'c' : 'o');
            const g = list.lastChild;
            g.querySelector('.img-url').value = url;
            g.querySelector('.img-desc').value = appState.images[`${key}Desc`][i] || '';
        });
    }
    syncList('ceremony', 'adm-img-list-c');
    syncList('office', 'adm-img-list-o');

    const newsList = document.getElementById('adm-news-list');
    if(newsList) {
        newsList.innerHTML = '';
        (appState.news || []).forEach(n => {
            window.addSlot('n');
            const g = newsList.lastChild;
            g.querySelector('.news-date').value = n.date;
            g.querySelector('.news-tag').value = n.tag;
            g.querySelector('.news-title').value = n.title;
            g.querySelector('.news-url').value = n.url;
        });
    }

    const extraTextList = document.getElementById('adm-extra-text-list');
    if(extraTextList) {
        extraTextList.innerHTML = '';
        (appState.dynamicTexts || []).forEach(t => {
            window.addSlot('t');
            const g = extraTextList.lastChild;
            g.querySelector('.extra-text-title').value = t.title;
            g.querySelector('.extra-text-body').value = t.body;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Admin Subtle Trigger & Login Close logic
    const gearBtn = document.getElementById('admin-btn-trigger');
    const loginOverlay = document.getElementById('login-overlay');
    const loginClose = document.getElementById('btn-login-close');
    
    if (gearBtn) gearBtn.onclick = () => loginOverlay.style.display='flex';
    if (loginClose) loginClose.onclick = () => loginOverlay.style.display='none';
    if (loginOverlay) {
        loginOverlay.onclick = (e) => {
            if (e.target === loginOverlay) loginOverlay.style.display='none';
        };
    }

    // Login logic
    document.getElementById('btn-login-submit').onclick = () => {
        const id = document.getElementById('login-id').value.trim();
        const pw = document.getElementById('login-pw').value.trim();
        if ((id === 'admin' || id === 'giboffice2004@gmail.com') && pw === 'me0979') {
            document.getElementById('login-overlay').style.display='none';
            document.getElementById('admin-panel').classList.add('open');
        } else {
            document.getElementById('login-error').style.display='block';
        }
    };

    document.getElementById('btn-admin-close-x').onclick = () => document.getElementById('admin-panel').classList.remove('open');
    document.getElementById('btn-admin-close-bottom').onclick = () => document.getElementById('admin-panel').classList.remove('open');

    // Final Save logic
    document.getElementById('btn-final-save').onclick = async () => {
        const status = document.getElementById('save-status');
        status.innerText = 'Synchronizing...'; 
        status.style.display = 'block';

        // Collect Videos
        appState.content.ytIds = Array.from(document.querySelectorAll('.yt-id-val')).map(i => i.value).filter(v => v);
        // Deprecated single ytId for old code compatibility
        appState.content.ytId = appState.content.ytIds[0] || '';

        // Collect Texts
        textFields.forEach(f => {
            appState.content[f.id] = {
                text:  document.getElementById(`adm-txt-${f.id}`).value,
                sz:    document.getElementById(`adm-sz-${f.id}`).value,
                col:   document.getElementById(`adm-col-${f.id}`).value,
                align: document.getElementById(`adm-align-${f.id}`).value,
                font:  document.getElementById(`adm-font-${f.id}`).value
            };
        });

        // Collect Images
        const collectImgs = (listId, key) => {
            appState.images[key] = []; appState.images[`${key}Desc`] = [];
            document.querySelectorAll(`#${listId} > div`).forEach(div => {
                appState.images[key].push(div.querySelector('.img-url').value);
                appState.images[`${key}Desc`].push(div.querySelector('.img-desc').value);
            });
        }
        collectImgs('adm-img-list-c', 'ceremony');
        collectImgs('adm-img-list-o', 'office');

        appState.news = Array.from(document.querySelectorAll('#adm-news-list > div')).map(div => ({
            date:  div.querySelector('.news-date').value,
            tag:   div.querySelector('.news-tag').value,
            title: div.querySelector('.news-title').value,
            url:   div.querySelector('.news-url').value
        })).filter(n => n.title);

        // Collect Dynamic Texts
        appState.dynamicTexts = Array.from(document.querySelectorAll('#adm-extra-text-list > div')).map(div => ({
            title: div.querySelector('.extra-text-title').value,
            body:  div.querySelector('.extra-text-body').value
        })).filter(t => t.title || t.body);

        try {
            await db.ref('wfirm').set(appState);
            status.innerText = '✅ Global Sync Completed!';
            renderAll();
        } catch(e) { status.innerText = '❌ Error occurred'; }
        setTimeout(() => status.style.display='none', 3000);
    };

    // Intersection Observer for reveal effects
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    loadData();
});
