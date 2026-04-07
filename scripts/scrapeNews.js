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
    console.log(`🔍 검색 URL: ${searchUrl}`);
      
    const feed = await parser.parseURL(searchUrl);
    let addedCount = 0;
    
    const existingTitles = new Set(appState.news.map(n => n.title));
    
    for (const item of feed.items.slice(0, 10)) { // 상위 10개 검사
        const title = item.title;
        const link = item.link;
        const pubDate = item.pubDate;
        
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
    }
    
    if (addedCount > 0) {
        await ref.set(appState);
        console.log(`✅ 수집 완료: +${addedCount}개 신규 뉴스 메인페이지 등록됨.`);
    } else {
        console.log(`ℹ️ 수집 완료: 새롭게 등록할 뉴스가 없습니다.`);
    }
    
    console.log('--- 🎉 백엔드 뉴스 수집 완료 ---');
    process.exit(0);
  } catch (error) {
    console.error('💥 수집 프로세스 치명적 오류:', error);
    process.exit(1);
  }
}

scrapeNews();
