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
            g.querySelector('.news-date').value = n.date || '';
            g.querySelector('.news-tag').value = n.tag || '';
            g.querySelector('.news-title').value = n.title || '';
            g.querySelector('.news-url').value = n.url || '';
        });
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

    // Immediate Execution Logic (Manual Trigger - High failure probability via CORS)
    const scrapNowBtn = document.getElementById('btn-scrap-now');
    if (scrapNowBtn) {
        scrapNowBtn.onclick = async () => {
            const status = document.getElementById('scrap-status');
            const keyword = document.getElementById('scrap-keyword').value.trim() || "재생의료";
            const periodVal = document.getElementById('scrap-period').value;
            
            status.innerText = `📡 1회성 강제 수집 시도 중... (구글 뉴스)`;
            status.style.display = 'block';
            status.style.color = '#4338ca';
            scrapNowBtn.disabled = true;

            let query = keyword;
            if (periodVal) {
                query += ` when:${periodVal}`;
            }
            const targetUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;

            const proxies = [
                (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
                (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                (url) => `https://api.codetabs.com/v1/proxy?url=${encodeURIComponent(url)}`
            ];

            let xmlText = "";
            let success = false;

            for (const getProxyUrl of proxies) {
                try {
                    const proxyUrl = getProxyUrl(targetUrl);
                    const response = await fetch(proxyUrl, { cache: 'no-store' });
                    if (response.ok) {
                        xmlText = await response.text();
                        if (xmlText && xmlText.includes('<item>')) {
                            success = true;
                            break;
                        }
                    }
                } catch (e) {
                    console.warn("Proxy attempt failed, trying next...");
                }
            }

            if (!success) {
                status.innerText = '❌ 수집 실패 (브라우저 정책/프록시 서버 차단).\n→ 설정 저장 시 서버가 내일 아침 무조건 찾아옵니다.';
                status.style.color = '#ef4444';
                setTimeout(() => {
                    status.style.display = 'none';
                    scrapNowBtn.disabled = false;
                }, 5000);
                return;
            }

            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                const items = xmlDoc.querySelectorAll('item');
                let addedCount = 0;
                
                if (!appState.news) appState.news = [];
                const existingTitles = new Set(appState.news.map(n => n.title));

                items.forEach((item, idx) => {
                    if (idx >= 10) return;

                    const title = item.querySelector('title')?.textContent.trim() || "";
                    const link = item.querySelector('link')?.textContent.trim() || "";
                    const pubDate = item.querySelector('pubDate')?.textContent || "";
                    
                    if (title && link) {
                        let dateObj = new Date(pubDate);
                        if (isNaN(dateObj.getTime())) dateObj = new Date();
                        
                        const yyyy = dateObj.getFullYear();
                        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const dd = String(dateObj.getDate()).padStart(2, '0');
                        const dateFormatted = `${yyyy}-${mm}-${dd}`;

                        if (!existingTitles.has(title)) {
                            appState.news.unshift({
                                date: dateFormatted,
                                tag: 'NEWS',
                                title: title,
                                url: link
                            });
                            existingTitles.add(title);
                            addedCount++;
                        }
                    }
                });

                if (addedCount > 0) {
                    await db.ref('wfirm').set(appState);
                    status.innerText = `✅ 완료: ${addedCount}개의 새 뉴스가 즉각 추가되었습니다!`;
                    syncToAdmin(); 
                    renderNews(1); 
                } else {
                    status.innerText = 'ℹ️ 추가할 새로운 소식이 없습니다.';
                }
            } catch (e) {
                console.error(e);
                status.innerText = '❌ 데이터 분석 중 오류 발생';
            }

            setTimeout(() => {
                status.style.display = 'none';
                scrapNowBtn.disabled = false;
            }, 4000);
        };
    }

    loadData();
});
