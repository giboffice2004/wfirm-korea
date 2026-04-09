/* ============================================================
   UI Rendering & Component Engine
============================================================ */

const NEWS_PER_PAGE = 9;
const GALLERY_PER_PAGE = 6;

// Draft Site High-Fidelity Text Configuration (with hl-dark tags)
const textFields = [
    { id:'heroTitle',    targetId:'hero-title', label:'메인 타이틀', h:60, def:'<span>첨단재생의료산업</span><br><span class="hl">WFIRM Korea</span> <span>추진사무국</span>', sz:'', col:'#ffffff', align:'center', font:"'Inter',sans-serif" },
    { id:'heroSub',      targetId:'hero-subtitle', label:'서브 타이틀', h:40, def:'INNOVATIVE BIO-INDUSTRY HUB', sz:'', col:'#64ffda', align:'center', font:"'Inter',sans-serif" },
    { id:'heroBtn',      targetId:'hero-btn-text', label:'메인 버튼 텍스트', h:40, def:'🎞️ 개소식 보도자료 영상 보기', sz:'17.5px', col:'#0a192f', align:'center', font:"'Noto Sans KR',sans-serif" },
    { id:'introBody',    targetId:'intro-body', label:'소개 본문', h:120, def:'<span class="hl-dark" style="font-size:24px; color:#0044cc; line-height:1.4;">"경상북도가 글로벌 재생의료의 표준을 세웁니다."</span>\n\n안녕하십니까? WFIRM Korea 추진 사무국 방문을 진심으로 환영합니다.\n\n경상북도가 글로벌 재생의료 거점으로 도약하기 위한 첫 단추인 <span class="hl-dark">\'WFIRM Korea 추진 사무국\'</span>이 대한민국 바이오 산업의 혁신을 주도합니다.\n\n첨단재생의료는 인류의 난치병 극복을 위한 꿈의 기술이자, 국가의 미래를 결정지을 핵심 전략 산업입니다. 경상북도는 세계 최고 수준의 재생의학 역량을 보유한 <span class="hl-dark">\'미국 웨이크포레스트 재생의학연구소(WFIRM)\'</span>와 전략적 파트너십을 구축하여, 대한민국을 넘어 아시아를 대표하는 재생의료 허브로 도약하고자 합니다.\n\n경북의 탄탄한 바이오 인프라와 글로벌 기술력이 만나는 이곳에서, 미래 산업의 새로운 이정표를 세우겠습니다. 여러분의 적극적인 성원과 협력을 기대합니다.\n\n<span style="display:block;text-align:right;font-weight:900;color:var(--primary);margin-top:25px;font-size:18px;">- WFIRM Korea 추진 사무국 -</span>', sz:'19.5px', col:'#0a192f', align:'left', font:"'Noto Sans KR',sans-serif" },
    { id:'secAbout',     targetId:'secAbout-title', label:'사무국 소개 제목', h:40, def:'사무국 소개', sz:'36px', col:'#0a192f', align:'center', font:"'Noto Sans KR',sans-serif" },
    { id:'secVideo',     targetId:'secVideo-title', label:'영상 섹션 제목', h:40, def:'개소식 보도자료 영상', sz:'36px', col:'#0a192f', align:'center', font:"'Noto Sans KR',sans-serif" },
    { id:'secNews',      targetId:'secNews-title',  label:'최신 동향 제목', h:40, def:'🔬 재생의료산업 최신 동향', sz:'36px', col:'#0a192f', align:'center', font:"'Noto Sans KR',sans-serif" },
    { id:'galT1',        targetId:'galT1-title', label:'사진 섹션 1 제목', h:40, def:'WFIRM Korea 사진', sz:'36px', col:'#0a192f', align:'center', font:"'Noto Sans KR',sans-serif" },
    { id:'secSchedule',  targetId:'secSchedule-title', label:'안내 섹션 제목', h:40, def:'추진 사무국 안내', sz:'36px', col:'#0a192f', align:'center', font:"'Noto Sans KR',sans-serif" },
    { id:'schedDate',    targetId:'txt-sched-date', label:'근무시간 정보', h:40, def:'오전 9시 ~ 오후 6시<br>(주말 및 공휴일 휴무)', sz:'18px', col:'#0a192f', align:'center', font:"'Noto Sans KR',sans-serif" },
    { id:'schedLoc',     targetId:'txt-sched-loc', label:'장소 정보', h:40, def:'경북 안동시 풍산읍 산업단지2길 5<br>(재)경북바이오산업연구원', sz:'18px', col:'#0a192f', align:'center', font:"'Noto Sans KR',sans-serif" },
    { id:'schedContact', targetId:'txt-sched-contact', label:'문의 정보', h:40, def:'054-850-6973<br>WFIRM Korea 추진사무국', sz:'18px', col:'#0a192f', align:'center', font:"'Noto Sans KR',sans-serif" }
];

function renderAll() {
    // 1. Hero Ken Burns Slideshow Engine (6s fade)
    const heroSlidesContainer = document.getElementById('hero-slides-container');
    let bgUrls = appState.theme.bgImages || [];
    
    if(heroSlidesContainer) {
        heroSlidesContainer.innerHTML = '';
        bgUrls.forEach((url, index) => {
            const div = document.createElement('div');
            div.className = index === 0 ? 'slide active' : 'slide';
            div.style.backgroundImage = `url('${url}')`;
            heroSlidesContainer.appendChild(div);
        });

        if (window.heroSliderInterval) clearInterval(window.heroSliderInterval);
        if (bgUrls.length > 1) {
            window.heroSliderInterval = setInterval(() => {
                const slides = document.querySelectorAll('#hero-slides-container .slide');
                if (!slides.length) return;
                let activeIdx = Array.from(slides).findIndex(s => s.classList.contains('active'));
                slides[activeIdx].classList.remove('active');
                let nextIdx = (activeIdx + 1) % slides.length;
                slides[nextIdx].classList.add('active');
            }, 6000);
        }
    }

    // 2. High-Fidelity Text Rendering
    textFields.forEach(f => {
        const el = document.getElementById(f.targetId);
        const o = appState.content[f.id];
        if(el && o) {
            el.innerHTML = o.text || f.def;
            if(f.id !== 'heroTitle' && f.id !== 'heroSub') {
                el.style.fontSize = o.sz; 
            } else {
                el.style.fontSize = ''; 
            }
            el.style.color = o.col; 
            el.style.textAlign = o.align; 
            el.style.fontFamily = o.font;
        }
    });
    
    // 3. Multi-Video Rendering
    const ytContainer = document.getElementById('yt-container');
    if(ytContainer) {
        ytContainer.innerHTML = '';
        const ytIds = appState.content.ytIds || (appState.content.ytId ? [appState.content.ytId] : []);
        ytIds.forEach(id => {
            const wrapper = document.createElement('div');
            wrapper.style = "position:relative; padding-bottom:56.25%; height:0; border-radius:var(--radius-lg); overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.1); background:#000; margin-bottom:30px;";
            wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?rel=0" frameborder="0" allowfullscreen style="position:absolute; inset:0; width:100%; height:100%;"></iframe>`;
            ytContainer.appendChild(wrapper);
        });
    }
    
    renderDynamicTexts();
    renderNews(1);
    renderGallery(1, 'ceremony', 'ceremony-container', 'gallery-pagination');
    renderGallery(1, 'office', 'office-container', null);
}

function renderNews(page) {
    const container = document.getElementById('news-container');
    if(!container) return;
    
    // UI에서 현재 필터/정렬/검색 값 가져오기
    const sortVal = document.getElementById('news-sort-select')?.value || 'desc';
    const periodBtn = document.querySelector('.pill-btn.active');
    const periodVal = periodBtn ? periodBtn.dataset.value : 'all';
    const searchTerm = document.getElementById('news-search-input')?.value.toLowerCase().trim() || "";

    let newsList = [...(appState.news || [])].filter(n => n && n.title);

    // [1] 기간 필터링 (Period Filtering)
    if (periodVal !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let cutoff = new Date(startOfToday);
        
        if (periodVal === 'today') {
            cutoff = startOfToday;
        } else if (periodVal === '1w') {
            cutoff.setDate(startOfToday.getDate() - 7);
        } else if (periodVal === '1m') {
            cutoff.setMonth(startOfToday.getMonth() - 1);
        } else if (periodVal === '3m') {
            cutoff.setMonth(startOfToday.getMonth() - 3);
        } else if (periodVal === '1y') {
            cutoff.setFullYear(startOfToday.getFullYear() - 1);
        }

        newsList = newsList.filter(n => {
            if (!n.date) return false;
            const parts = n.date.split(/[-.]/).map(Number);
            if (parts.length < 3) return false;
            const newsDate = new Date(parts[0], parts[1] - 1, parts[2]);
            return newsDate >= cutoff;
        });
    }

    // [2] 키워드 검색 필터링 (Search Filtering)
    if (searchTerm) {
        newsList = newsList.filter(n => {
            const titleMatch = n.title.toLowerCase().includes(searchTerm);
            const tagMatch = (n.tag || "").toLowerCase().includes(searchTerm);
            return titleMatch || tagMatch;
        });
    }

    // [3] 정렬 처리 (Sorting)
    // 중복 기사 감지 (제목 및 URL 기준)
    const seenTitles = new Map();
    const seenUrls = new Map();
    
    // 원본 데이터의 순서를 유지하며 중복 여부 판단 (오래된 것이 중복으로 처리됨)
    newsList.forEach(n => {
        const normTitle = n.title.trim().toLowerCase().replace(/[^a-zA-Z0-9가-힣]/g, '');
        const normUrl = (n.url || "").trim().split('?')[0].split('#')[0].trim();
        n.isDuplicate = false;

        if (normTitle && n.url) {
            if (seenTitles.has(normTitle) || seenUrls.has(normUrl)) {
                n.isDuplicate = true;
            } else {
                seenTitles.set(normTitle, true);
                seenUrls.set(normUrl, true);
            }
        }
    });

    newsList.sort((a,b) => {
        // 1순위: 중복 기사가 맨 위로
        if (a.isDuplicate !== b.isDuplicate) return a.isDuplicate ? -1 : 1;
        // 2순위: 날짜 내림차순(최신순)
        const da = a.date || "";
        const db = b.date || "";
        if (da === db) return a.title.localeCompare(b.title);
        return sortVal === 'desc' ? db.localeCompare(da) : da.localeCompare(db);
    });

    const start = (page - 1) * NEWS_PER_PAGE;
    const items = newsList.slice(start, start + NEWS_PER_PAGE);
    
    container.innerHTML = items.length ? '' : '<p style="text-align:center; grid-column:1/-1; padding:60px; font-weight:800;">조건에 맞는 뉴스가 없습니다.</p>';
    items.forEach(n => {
        const card = document.createElement('div');
        card.className = 'news-card' + (n.isDuplicate ? ' duplicate-mode' : '');
        if (n.url) card.onclick = () => window.open(n.url, '_blank');
        
        let dupBadge = n.isDuplicate ? '<span style="background:#ef4444; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; margin-right:8px; vertical-align:middle;">중복 의심</span>' : '';
        card.innerHTML = `<div class="news-meta"><span class="date">${n.date}</span><span class="source">${dupBadge}${n.tag||'UPDATE'}</span></div><div class="news-title">${n.title}</div>`;
        container.appendChild(card);
    });

    // 페이지네이션 활성화 (1-5개씩 그룹화)
    const total = Math.ceil(newsList.length / NEWS_PER_PAGE);
    const pagin = document.getElementById('news-pagination');
    if(pagin) {
        pagin.innerHTML = '';
        if(total > 1) {
            const currentGroup = Math.ceil(page / 5);
            const startPage = (currentGroup - 1) * 5 + 1;
            let endPage = startPage + 4;
            if (endPage > total) endPage = total;

            // [추가] 처음으로 버튼
            const firstBtn = document.createElement('button'); 
            firstBtn.innerText = '«'; firstBtn.className = 'page-btn';
            firstBtn.title = '처음으로';
            if (page === 1) firstBtn.disabled = true;
            firstBtn.onclick = () => { renderNews(1); document.getElementById('news').scrollIntoView({behavior:'smooth'}); };
            pagin.appendChild(firstBtn);

            // [추가] 5페이지 이전 버튼 (이전 그룹)
            const prevBlockBtn = document.createElement('button'); 
            prevBlockBtn.innerText = '‹‹'; prevBlockBtn.className = 'page-btn';
            prevBlockBtn.title = '5페이지 이전';
            if (currentGroup === 1) prevBlockBtn.disabled = true;
            prevBlockBtn.onclick = () => { renderNews(startPage - 1); document.getElementById('news').scrollIntoView({behavior:'smooth'}); };
            pagin.appendChild(prevBlockBtn);

            // [기존] 1페이지 이전 버튼
            const prevBtn = document.createElement('button'); 
            prevBtn.innerText = '‹'; prevBtn.className = 'page-btn';
            prevBtn.title = '이전 페이지';
            if (page === 1) prevBtn.disabled = true;
            prevBtn.onclick = () => { renderNews(page - 1); document.getElementById('news').scrollIntoView({behavior:'smooth'}); };
            pagin.appendChild(prevBtn);

            // 페이지 숫자 버튼
            for(let i=startPage; i<=endPage; i++) {
                const btn = document.createElement('button'); btn.innerText = i; 
                btn.className = 'page-btn' + (i===page?' active':'');
                btn.onclick = () => { renderNews(i); document.getElementById('news').scrollIntoView({behavior:'smooth'}); };
                pagin.appendChild(btn);
            }

            // [기존] 1페이지 다음 버튼
            const nextBtn = document.createElement('button'); 
            nextBtn.innerText = '›'; nextBtn.className = 'page-btn';
            nextBtn.title = '다음 페이지';
            if (page === total) nextBtn.disabled = true;
            nextBtn.onclick = () => { renderNews(page + 1); document.getElementById('news').scrollIntoView({behavior:'smooth'}); };
            pagin.appendChild(nextBtn);

            // [추가] 5페이지 다음 버튼 (다음 그룹)
            const nextBlockBtn = document.createElement('button'); 
            nextBlockBtn.innerText = '››'; nextBlockBtn.className = 'page-btn';
            nextBlockBtn.title = '5페이지 다음';
            if (endPage === total) nextBlockBtn.disabled = true;
            nextBlockBtn.onclick = () => { renderNews(endPage + 1); document.getElementById('news').scrollIntoView({behavior:'smooth'}); };
            pagin.appendChild(nextBlockBtn);

            // [추가] 끝으로 버튼
            const lastBtn = document.createElement('button'); 
            lastBtn.innerText = '»'; lastBtn.className = 'page-btn';
            lastBtn.title = '끝으로';
            if (page === total) lastBtn.disabled = true;
            lastBtn.onclick = () => { renderNews(total); document.getElementById('news').scrollIntoView({behavior:'smooth'}); };
            pagin.appendChild(lastBtn);
        }
    }

    // 필터 버튼 클릭 리스너 재설정 (버블링 방지 위해 초기화 후 설정)
    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderNews(1);
        };
    });
    
    const sortSelect = document.getElementById('news-sort-select');
    if(sortSelect) sortSelect.onchange = () => renderNews(1);
}

function renderGallery(page, key, containerId, paginId) {
    const container = document.getElementById(containerId);
    if(!container) return;

    const sourceImages = appState.images[key] || [];
    const sourceDesc = appState.images[`${key}Desc`] || [];
    const valid = sourceImages.map((url, i) => ({ url, desc: sourceDesc[i] })).filter(x => x.url);
    const items = (key === 'office') ? valid : valid.slice((page-1)*GALLERY_PER_PAGE, page*GALLERY_PER_PAGE);
    
    container.innerHTML = items.length ? '' : '<p style="text-align:center; grid-column:1/-1; padding:40px;">사진 준비 중</p>';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.onclick = () => { 
            const lbImg = document.getElementById('lightbox-img');
            const lb = document.getElementById('lightbox');
            if(lbImg && lb) { lbImg.src = item.url; lb.classList.add('open'); }
        };
        div.innerHTML = `<div class="gallery-img-wrap"><img src="${item.url}" loading="lazy"></div><div class="gallery-desc">${item.desc || ''}</div>`;
        container.appendChild(div);
    });

    if(paginId) {
        const total = Math.ceil(valid.length / GALLERY_PER_PAGE);
        const pagin = document.getElementById(paginId);
        if(pagin) {
            pagin.innerHTML = '';
            if(total > 1) {
                for(let i=1; i<=total; i++) {
                    const btn = document.createElement('button'); btn.innerText = i; 
                    btn.className = 'page-btn' + (i===page?' active':'');
                    btn.onclick = () => renderGallery(i, key, containerId, paginId);
                    pagin.appendChild(btn);
                }
            }
        }
    }
}

function renderDynamicTexts() {
    const container = document.getElementById('dynamic-extra-sections');
    if(!container) return;
    container.innerHTML = '';
    (appState.dynamicTexts || []).forEach(t => {
        const sec = document.createElement('section');
        sec.className = 'reveal dynamic-text-section';
        sec.innerHTML = `<div class="container"><h2 class="section-title">${t.title}</h2><div class="intro-wrapper"><div class="intro-text" style="width:100%; border-radius:var(--radius-lg);">${t.body.replace(/\n/g, '<br>')}</div></div></div>`;
        container.appendChild(sec);
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('active'); });
        }, { threshold: 0.1 });
        observer.observe(sec);
    });
}
