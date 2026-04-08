import admin from 'firebase-admin';
import Parser from 'rss-parser';

const parser = new Parser();

// 파이어베이스 서비스 계정 설정
let serviceAccount;
try {
  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saEnv) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT 환경 변수가 설정되지 않았습니다.');
  }
  serviceAccount = JSON.parse(saEnv);
} catch (e) {
  console.error('환경 변수(FIREBASE_SERVICE_ACCOUNT)를 파싱할 수 없습니다.', e.message);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://wfirm-korea-default-rtdb.asia-southeast1.firebasedatabase.app/"
  });
}

const db = admin.database();

async function scrapeNews() {
  console.log('--- [WFIRM Korea] 백엔드 뉴스 수집 엔진 가동 시작 ---');
  
  try {
    const ref = db.ref('wfirm');
    const snapshot = await ref.once('value');
    const appState = snapshot.val() || {};
    
    if (!appState.news) appState.news = [];
    
    // 수집 설정 가져오기 (없으면 기본값 사용)
    const settings = appState.scrapSettings || { keyword: '재생의료', period: '1m' };
    const keyword = settings.keyword || '재생의료';
    const period = settings.period || ''; // '1d', '7d', '1m', 등
    
    console.log(`📡 수집 설정: 키워드="${keyword}", 기간="${period || '전체'}"`);

    let query = keyword;
    if (period) {
        query += ` when:${period}`;
    }
    
    const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    console.log(`🔍 Google News RSS 요청: ${searchUrl}`);
      
    const feed = await parser.parseURL(searchUrl);
    
    if (!feed.items || feed.items.length === 0) {
        console.log('ℹ️ 검색 결과가 없습니다.');
        process.exit(0);
    }

    console.log(`📑 후보 뉴스 ${feed.items.length}개 발견. 중복 검사 및 정제 시작...`);

    let addedCount = 0;
    // 기존 뉴스들의 제목과 URL을 집합으로 만들어 빠른 중복 체크 준비 (정규화 적용)
    const existingTitles = new Set(appState.news.map(n => n.title.trim().toLowerCase()));
    const existingUrls = new Set(appState.news.map(n => (n.url || "").trim().toLowerCase()));
    
    for (const item of feed.items.slice(0, 15)) { 
        const rawTitle = item.title;
        const link = (item.link || "").trim().toLowerCase();
        const pubDate = item.pubDate;
        
        if (rawTitle && link) {
            // HTML Entity Decoding
            const decodedTitle = rawTitle
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .trim();

            let dateObj = new Date(pubDate);
            if (isNaN(dateObj.getTime())) dateObj = new Date(pubDate.replace(/-/g, '/')); 
            if (isNaN(dateObj.getTime())) dateObj = new Date();
            
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const dateFormatted = `${yyyy}-${mm}-${dd}`;

            let publisher = "Google News";
            let finalTitle = decodedTitle;
            const lastDashIdx = decodedTitle.lastIndexOf(' - ');
            if (lastDashIdx !== -1) {
                publisher = decodedTitle.substring(lastDashIdx + 3).trim();
                finalTitle = decodedTitle.substring(0, lastDashIdx).trim(); 
            }

            const finalTitleKey = finalTitle.trim().toLowerCase();

            // [핵심] 제목 또는 URL 중 하나라도 일치하면 중복으로 간주 (정규화된 키 기준)
            const isDuplicate = existingTitles.has(finalTitleKey) || existingUrls.has(link);

            if (!isDuplicate) {
                appState.news.unshift({
                    date: dateFormatted,
                    tag: publisher,
                    title: finalTitle,
                    url: item.link // 원본 링크 저장
                });
                existingTitles.add(finalTitleKey);
                existingUrls.add(link);
                addedCount++;
                console.log(`  [NEW] ${finalTitle} (${publisher})`);
            }
        }
    }
    
    if (addedCount > 0) {
        // 날짜 내림차순 정렬 후 DB 저장
        appState.news.sort((a, b) => new Date(b.date) - new Date(a.date));

        await ref.set(appState);
        console.log(`✅ 성공: +${addedCount}개 신규 뉴스 등록 완료.`);
    } else {
        console.log(`ℹ️ 상태: 새롭게 등록할 뉴스가 없습니다. (모두 중복이거나 검색 결과 없음)`);
    }
    
    console.log('--- 🎉 백엔드 뉴스 수집 프로세스 종료 ---');
    process.exit(0);
  } catch (error) {
    console.error('💥 수집 프로세스 치명적 오류:', error);
    process.exit(1);
  }
}

scrapeNews();
