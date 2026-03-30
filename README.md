# WFIRM Korea 추진사무국 홈페이지

경상북도 글로벌 재생의료 거점, 첨단재생의료산업 혁신 허브 공식 임시 홈페이지입니다.

## 기술 스택

- **프론트엔드**: Vanilla HTML5 + CSS3 + ES Modules (빌드 도구 없음)
- **데이터베이스**: Firebase Realtime Database
- **인증**: Firebase Authentication (Email/Password)
- **이미지 호스팅**: Cloudinary
- **배포**: Firebase Hosting + GitHub Actions CI/CD

## 프로젝트 구조

```
wfirm-korea/
├── index.html                        # 메인 홈페이지
├── firebase.json                     # Firebase Hosting 설정
├── .firebaserc                       # Firebase 프로젝트 연결
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml       # GitHub Actions 자동 배포
└── src/
    ├── css/
    │   └── main.css                  # 메인 스타일시트 (모바일 최적화)
    └── js/
        ├── firebase-config.js        # Firebase 초기화
        ├── auth.js                   # Firebase Authentication
        ├── admin.js                  # 관리자 패널
        ├── cloudinary.js             # 이미지 업로드
        ├── render.js                 # 화면 렌더링
        └── main.js                   # 앱 진입점
```

## 배포 방법

### GitHub → Firebase 자동 배포 설정

1. `firebase login` 실행
2. `firebase init hosting` 실행 (이미 firebase.json 있으므로 덮어쓰지 않음)
3. `firebase hosting:github --project wfirm-korea-61be3` 실행
   → GitHub Secrets에 `FIREBASE_SERVICE_ACCOUNT_WFIRM_KOREA_61BE3` 자동 등록
4. GitHub에 push → 자동 배포

### 수동 배포

```bash
firebase deploy --only hosting
```

## Firebase Database 보안 규칙

Firebase Console → Realtime Database → Rules에서 아래 규칙 적용:

```json
{
  "rules": {
    "wfirm": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## 관리자 접근

- 홈페이지 우측 하단 작은 톱니바퀴(⚙️) 버튼 클릭
- Firebase Authentication에 등록된 이메일/비밀번호로 로그인
- **소스코드에 비밀번호 없음** — Firebase 서버가 직접 처리
