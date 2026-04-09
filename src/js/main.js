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
    ['1','3','4','5','6'].forEach((n, i) => {
        appState.images.ceremony[i]     = `${BASE}${n}.jpg?raw=true`;
        appState.images.ceremonyDesc[i] = ['개소식 단체','환영사','MOU 체결식','토론회','단체 사진'][i];
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
        div.classList.add('admin-slot-n'); // 페이지네이션을 위한 클래스 추가
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
        newsList.innerHTML = `
            <h5 style="font-size:14px; font-weight:800; color:#475569; margin-bottom:15px;">📰 수집된 개별 뉴스 데이터 목록 (직접 수정/삭제 가능)</h5>
            <!-- 관리자 패널 전용 프리미엄 검색창 -->
            <div class="admin-search-container" style="margin-bottom:15px;">
                <div class="search-box" style="display:flex; align-items:center; background:#fff; padding:10px 15px; border-radius:10px; border:1px solid #cbd5e1;">
                    <i class="fa-solid fa-magnifying-glass" style="color:#94a3b8; margin-right:10px;"></i>
                    <input type="text" id="admin-news-search" placeholder="관리 목록에서 기사 제목 또는 출처 검색..." style="border:none; outline:none; width:100%;" oninput="window.renderAdminNewsPage(1)">
                </div>
            </div>`;
        
        if (appState.news) {
            appState.news.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        (appState.news || []).forEach(n => {
            window.addSlot('n');
            const g = newsList.lastChild;
            g.querySelector('.news-date').value = n.date || '';
            g.querySelector('.news-tag').value = n.tag || '';
            g.querySelector('.news-title').value = n.title || '';
            g.querySelector('.news-url').value = n.url || '';
        });
        
        // 항목 초기화 후 1페이지 렌더링
        window.renderAdminNewsPage(1);
    }

    // Scrap settings Sync
    const scrapSettings = appState.scrapSettings || { keyword: '재생의료', period: '' };
    const kwInput = document.getElementById('scrap-keyword');
    const pdInput = document.getElementById('scrap-period');
    const currentLbl = document.getElementById('current-scrap-settings');
    if(kwInput) kwInput.value = scrapSettings.keyword;
    if(pdInput) pdInput.value = scrapSettings.period;
    if(currentLbl) {
        let pLabel = "전체";
        if(scrapSettings.period === '1d') pLabel = "최근 1일";
        else if(scrapSettings.period === '7d') pLabel = "최근 1주";
        else if(scrapSettings.period === '1m') pLabel = "최근 1개월";
        else if(scrapSettings.period === '3m') pLabel = "최근 3개월";
        else if(scrapSettings.period === '6m') pLabel = "최근 6개월";
        else if(scrapSettings.period === '1y') pLabel = "최근 1년";
        currentLbl.innerText = `키워드: [${scrapSettings.keyword}], 기간: [${pLabel}]`;
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

// Admin News Pagination Logic
window.adminNewsCurrentPage = 1;
window.renderAdminNewsPage = function(page) {
    const itemsPerPage = 10;
    const pagination = document.getElementById('adm-news-pagination');
    if (!pagination) return;

    const searchTerm = document.getElementById('admin-news-search')?.value.toLowerCase().trim() || "";
    let listItems = Array.from(document.querySelectorAll('#adm-news-list .admin-slot-n'));

    // [1] 관리자 검색 필터링
    if (searchTerm) {
        listItems.forEach(item => {
            const title = item.querySelector('.news-title').value.toLowerCase();
            const tag = item.querySelector('.news-tag').value.toLowerCase();
            if (title.includes(searchTerm) || tag.includes(searchTerm)) {
                item.dataset.filterMatch = "true";
            } else {
                item.dataset.filterMatch = "false";
                item.style.display = 'none';
            }
        });
        listItems = listItems.filter(item => item.dataset.filterMatch === "true");
    } else {
        listItems.forEach(item => item.dataset.filterMatch = "true");
    }

    // [2] 중복 감지 및 강조 표시 (전체 데이터 기준)
    const allItems = Array.from(document.querySelectorAll('#adm-news-list .admin-slot-n'));
    const seenTitles = new Map(); // 타이틀과 해당 아이템 매핑
    const seenUrls = new Map();   // URL과 해당 아이템 매핑
    
    allItems.forEach(item => {
        const title = item.querySelector('.news-title').value.trim().toLowerCase();
        const url = item.querySelector('.news-url').value.trim().toLowerCase();
        
        item.classList.remove('duplicate-card');
        // 기존 사유 배지 제거
        const oldBadge = item.querySelector('.duplicate-reason-badge');
        if (oldBadge) oldBadge.remove();

        if (title && url) {
            let reason = "";
            if (seenTitles.has(title)) reason = "제목 중복";
            if (seenUrls.has(url)) reason = reason ? "제목/URL 중복" : "URL 중복";

            if (reason) {
                item.classList.add('duplicate-card');
                const badge = document.createElement('div');
                badge.className = 'duplicate-reason-badge';
                badge.innerText = `⚠️ ${reason}`;
                item.appendChild(badge);
            } else {
                seenTitles.set(title, item);
                seenUrls.set(url, item);
            }
        }
    });

    const totalItems = listItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    window.adminNewsCurrentPage = page;

    // Show/Hide Items
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    listItems.forEach((item, index) => {
        if (index >= startIndex && index < endIndex) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });

    // Render Pagination Buttons
    pagination.innerHTML = '';
    
    // Previous Group Button (<)
    const currentGroup = Math.ceil(page / 5);
    const startPage = (currentGroup - 1) * 5 + 1;
    let endPage = startPage + 4;
    if (endPage > totalPages) endPage = totalPages;

    if (startPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerText = '‹';
        prevBtn.className = 'page-btn';
        prevBtn.onclick = () => {
            window.renderAdminNewsPage(startPage - 1);
            prevBtn.scrollIntoView({behavior: 'smooth', block: 'center'});
        };
        pagination.appendChild(prevBtn);
    }

    // Number Buttons
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = `page-btn ${i === page ? 'active' : ''}`;
        btn.onclick = () => {
            window.renderAdminNewsPage(i);
            btn.scrollIntoView({behavior: 'smooth', block: 'center'});
        };
        pagination.appendChild(btn);
    }

    // Next Group Button (>)
    if (endPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.innerText = '›';
        nextBtn.className = 'page-btn';
        nextBtn.onclick = () => {
            window.renderAdminNewsPage(endPage + 1);
            nextBtn.scrollIntoView({behavior: 'smooth', block: 'center'});
        };
        pagination.appendChild(nextBtn);
    }
};

window.addAdminNewsSlot = function() {
    window.addSlot('n');
    window.renderAdminNewsPage(1); // 새로 추가 후 1페이지로 이동시켜 보여줌
};


document.addEventListener('DOMContentLoaded', () => {
    // Admin Subtle Trigger & Login Close logic
    const gearBtn = document.getElementById('admin-btn-trigger');
    const loginOverlay = document.getElementById('login-overlay');
    const loginClose = document.getElementById('btn-login-close');
    
    if (gearBtn) gearBtn.onclick = () => loginOverlay.style.display='flex';
    if (loginClose) loginClose.onclick = () => loginOverlay.style.display='none';
    
    // 뉴스 검색 입력 실시간 연동 (사용자 페이지)
    const newsSearchInput = document.getElementById('news-search-input');
    if (newsSearchInput) {
        newsSearchInput.oninput = () => {
            renderNews(1);
        };
    }

    // 관리자 패널용 뉴스 검색 실시간 연동
    const adminNewsSearch = document.getElementById('admin-news-search');
    if (adminNewsSearch) {
        adminNewsSearch.oninput = () => {
            window.renderAdminNewsPage(1);
        };
    }
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
        const saveBtn = document.getElementById('btn-final-save');
        
        status.innerText = '저장 중...'; 
        status.style.display = 'block';
        status.style.color = 'var(--primary)';
        saveBtn.disabled = true;

        // 타임아웃 감시 (전송이 10초 이상 지연될 경우 안내)
        const saveTimeout = setTimeout(() => {
            if (saveBtn.disabled) {
                status.innerText = '⚠️ 응답이 지연되고 있습니다. 네트워크 상태를 확인해 주세요.';
                status.style.color = '#f59e0b';
                saveBtn.disabled = false;
            }
        }, 12000);

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
            clearTimeout(saveTimeout);
            status.innerText = '✅ 저장완료';
            status.style.color = '#10b981';
            renderAll();
        } catch(e) { 
            clearTimeout(saveTimeout);
            console.error("Save Error:", e);
            status.innerText = '❌ 저장 중 오류 발생 (데이터 권한 또는 네트워크 확인)';
            status.style.color = '#ef4444';
        }
        
        saveBtn.disabled = false;
        setTimeout(() => {
            if (status.innerText.includes('완료') || status.innerText.includes('오류')) {
                status.style.display='none';
            }
        }, 4000);
    };

    // Interaction Observer for reveal effects
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Save Scrap Settings Logic
    const saveScrapBtn = document.getElementById('btn-save-scrap-settings');
    if (saveScrapBtn) {
        saveScrapBtn.onclick = async () => {
            const status = document.getElementById('scrap-status');
            const keyword = document.getElementById('scrap-keyword').value.trim() || '재생의료';
            const period = document.getElementById('scrap-period').value;
            
            appState.scrapSettings = { keyword, period };
            
            status.innerText = `🔄 수집 설정을 저장하는 중...`;
            status.style.display = 'block';
            status.style.color = '#10b981';
            saveScrapBtn.disabled = true;

            try {
                await db.ref('wfirm').set(appState);
                status.innerText = `✅ 완료: "${keyword}" 검색 설정이 등록되었습니다. 매일 아침 9시(한국시간)에 서버가 자동으로 뉴스를 수집합니다.`;
                syncToAdmin(); // Sync UI
            } catch (e) {
                console.error(e);
                status.innerText = '❌ 설정 저장 중 오류가 발생했습니다.';
                status.style.color = '#ef4444';
            }

            setTimeout(() => {
                status.style.display = 'none';
                saveScrapBtn.disabled = false;
            }, 5000);
        };
    }

    // Immediate Execution Logic (Manual Trigger via rss2json)
    const scrapNowBtn = document.getElementById('btn-scrap-now');
    if (scrapNowBtn) {
        scrapNowBtn.onclick = async () => {
            const status = document.getElementById('scrap-status');
            const keyword = document.getElementById('scrap-keyword').value.trim() || "재생의료";
            const periodVal = document.getElementById('scrap-period').value;
            
            status.innerText = `📡 구글 뉴스 검색 중... (${keyword})`;
            status.style.display = 'block';
            status.style.color = '#4338ca';
            scrapNowBtn.disabled = true;

            let query = keyword;
            if (periodVal) {
                query += ` when:${periodVal}`;
            }
            const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
            const targetUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(googleNewsUrl)}&api_key=`;

            try {
                const response = await fetch(targetUrl, { cache: 'no-store' });
                const json = await response.json();

                if (json.status !== 'ok' || !json.items) {
                    throw new Error("RSS 데이터를 가져오지 못했습니다.");
                }

                let addedCount = 0;
                if (!appState.news) appState.news = [];
                const existingTitles = new Set(appState.news.map(n => n.title.trim()));
                const existingUrls = new Set(appState.news.map(n => n.url.trim()));

                json.items.slice(0, 15).forEach(item => {
                    const title = item.title || "";
                    const link = item.link || "";
                    const pubDate = item.pubDate || "";
                    
                    if (title && link) {
                        // Date parsing (rss2json returns "YYYY-MM-DD HH:mm:ss" format)
                        let dateObj = new Date(pubDate.replace(/-/g, '/'));
                        if (isNaN(dateObj.getTime())) dateObj = new Date();
                        
                        const yyyy = dateObj.getFullYear();
                        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const dd = String(dateObj.getDate()).padStart(2, '0');
                        const dateFormatted = `${yyyy}-${mm}-${dd}`;

                        // HTML Entity Decoding
                        const tempDiv = document.createElement("div");
                        tempDiv.innerHTML = title;
                        const decodedTitle = tempDiv.textContent || tempDiv.innerText || "";

                        // 출처(언론사) 추출 로직 (' - 언론사명' 형태 파싱)
                        let publisher = "Google News";
                        let finalTitle = decodedTitle;
                        const lastDashIdx = decodedTitle.lastIndexOf(' - ');
                        if (lastDashIdx !== -1) {
                            publisher = decodedTitle.substring(lastDashIdx + 3).trim();
                            finalTitle = decodedTitle.substring(0, lastDashIdx).trim(); 
                        }

                        // 엄격한 중복 체크: 제목 또는 URL 중 하나라도 있으면 제외
                        const isDuplicate = existingTitles.has(finalTitle.trim()) || existingUrls.has(link.trim());

                        if (!isDuplicate) {
                            appState.news.unshift({
                                date: dateFormatted,
                                tag: publisher,
                                title: finalTitle,
                                url: link
                            });
                            existingTitles.add(finalTitle.trim());
                            existingUrls.add(link.trim());
                            addedCount++;
                        }
                    }
                });

                if (addedCount > 0) {
                    // 수집 후 날짜순 정렬 보장
                    appState.news.sort((a, b) => new Date(b.date) - new Date(a.date));
                    await db.ref('wfirm').set(appState);
                    status.innerText = `✅ 완료: ${addedCount}개의 새 뉴스가 즉각 추가되었습니다!`;
                    syncToAdmin(); 
                    renderNews(1); 
                } else {
                    status.innerText = 'ℹ️ 이미 최신 상태이거나 새로 추가할 소식이 없습니다.';
                }
            } catch (e) {
                console.error("수집 오류:", e);
                status.innerText = '❌ 수집 실패 (네트워크 연결 혹은 파싱 오류 발생)';
                status.style.color = '#ef4444';
            }

            setTimeout(() => {
                status.style.display = 'none';
                scrapNowBtn.disabled = false;
            }, 4000);
        };
    }

    loadData();
});
