import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, collection, query, getDoc, setDoc } from 'firebase/firestore';
import { SiteSettings, BioTrend } from './types';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { getYouTubeId } from './utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Phone, Mail, Globe, Menu, X, Play, ShieldCheck, ArrowRight } from 'lucide-react';

const DEFAULT_SETTINGS: SiteSettings = {
  heroTitle: "첨단재생의료산업 WFIRM Korea 추진사무국",
  heroDescription: `안녕하십니까? WFIRM Korea 추진 사무국 홈페이지 방문을 진심으로 환영합니다.

경상북도가 글로벌 재생의료 거점으로 도약하기 위한 첫 단추인 'WFIRM Korea 추진 사무국'이 대한민국 바이오 산업의 혁신을 주도합니다.

첨단재생의료는 인류의 난치병 극복을 위한 꿈의 기술이자, 국가의 미래를 결정지을 핵심 전략 산업입니다.

경상북도는 세계 최고 수준의 재생의학 역량을 보유한 '미국 웨이크포레스트 재생의학연구소(WFIRM)'와 손잡고 대한민국을 넘어 아시아를 대표하는 재생의료 허브로 도약하고자 합니다.

여러분의 적극적인 성원과 협력을 기대합니다.

- WFIRM Korea 추진 사무국 -`,
  videoUrl: "https://youtu.be/C3uvn9_k6wI?si=07DVeSPqAIoLipu5",
  heroImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=2000",
  officeImage: "https://gib.re.kr/data/cms/74/20220415221607_5265716.jpg",
  location: "경북 안동시 풍산읍 산업단지 2길 5, (재)경북바이오산업연구원",
  contact: "054-850-6970",
  openingCeremonyImages: [],
  officeViewImages: []
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [trends, setTrends] = useState<BioTrend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Listen to settings
    const settingsRef = doc(db, 'settings', 'global');
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as SiteSettings);
      } else {
        setDoc(settingsRef, DEFAULT_SETTINGS);
      }
    });

    // Listen to trends
    const unsubTrends = onSnapshot(query(collection(db, 'trends')), (snapshot) => {
      const trendData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BioTrend));
      setTrends(trendData);
    });

    return () => {
      unsubSettings();
      unsubTrends();
    };
  }, []);

  const handleAdminLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const videoId = getYouTubeId(settings.videoUrl);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[1000] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">W</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">WFIRM <span className="text-slate-400 font-medium">KOREA</span></h1>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#intro" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">인사말</a>
            <a href="#video" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">개소식 영상</a>
            <a href="#gallery-opening" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">개소식 사진</a>
            <a href="#gallery-office" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">사무국 사진</a>
            <a href="#location" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">오시는 길</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <button 
                onClick={() => setIsAdminOpen(true)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition text-slate-600"
              >
                <ShieldCheck size={20} />
              </button>
            ) : (
              <button 
                onClick={handleAdminLogin}
                className="text-[10px] text-slate-300 hover:text-slate-500 uppercase tracking-widest font-bold"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="intro" className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full mb-6 uppercase tracking-widest">
                Bio-Tech Innovation Hub
              </span>
              <h2 className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-8 tracking-tight text-slate-900">
                {settings.heroTitle.split(' ').map((word, i) => (
                  <span key={i} className={word === 'WFIRM' || word === 'Korea' ? 'text-emerald-600' : ''}>{word} </span>
                ))}
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-xl whitespace-pre-wrap">
                {settings.heroDescription}
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#gallery-opening" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
                  개소식 사진 보기 <ArrowRight size={18} />
                </a>
                <a href="#video" className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                  <Play size={18} fill="currentColor" /> 영상 보기
                </a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white">
                <img 
                  src={settings.heroImage} 
                  alt="WFIRM Korea Hero" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 hidden md:block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Global Network</h4>
                    <p className="text-xs text-slate-400">WFIRM x Gyeongbuk</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">
                  세계 최고 수준의 연구진과 함께하는 글로벌 바이오 허브
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video" className="py-32 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">🎊 추진사무국 개소식 하이라이트</h3>
            <p className="text-slate-400 max-w-2xl mx-auto">
              첨단재생의료산업의 새로운 시대를 여는 역사적인 순간을 영상으로 확인하세요.
            </p>
          </div>

          <div className="max-w-4xl mx-auto aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white/10 bg-black mb-16">
            {videoId ? (
              <iframe 
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                allowFullScreen
                title="WFIRM Korea Opening Ceremony"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                영상을 불러올 수 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Opening Ceremony Gallery Section */}
      <section id="gallery-opening" className="py-32 px-6 bg-slate-900 text-white overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">📸 개소식 현장 갤러리</h3>
            <p className="text-slate-400 max-w-2xl mx-auto">
              첨단재생의료산업의 새로운 출발, 그 생생한 현장의 기록입니다.
            </p>
          </div>

          {settings.openingCeremonyImages && settings.openingCeremonyImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {settings.openingCeremonyImages.map((img, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelectedImage(img)}
                    className="aspect-square rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl group cursor-pointer"
                  >
                    <img 
                      src={img} 
                      alt={`Opening Ceremony ${idx}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                  </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <p className="text-slate-500">관리자 패널에서 사진을 업로드해주세요.</p>
            </div>
          )}
        </div>
      </section>

      {/* Office & Location */}
      <section id="location" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
            <div className="order-2 lg:order-1 space-y-6">
              {settings.officeViewImages && settings.officeViewImages.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {settings.officeViewImages.slice(0, 3).map((img, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedImage(img)}
                      className="aspect-video rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 cursor-pointer group"
                    >
                      <img 
                        src={img} 
                        alt={`WFIRM Korea Office ${idx}`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100">
                  <img 
                    src={settings.officeImage} 
                    alt="WFIRM Korea Office" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-3xl font-bold text-slate-900 mb-8">사무국 전경 및 위치</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">주소</h4>
                    <p className="text-slate-500 leading-relaxed">{settings.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">문의처</h4>
                    <p className="text-slate-500">{settings.contact}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">이메일</h4>
                    <p className="text-slate-500">contact@wfirm-korea.re.kr</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Office View Gallery */}
          {settings.officeViewImages && settings.officeViewImages.length > 0 && (
            <div className="mt-20" id="gallery-office">
              <h4 className="text-xl font-bold mb-8 text-slate-800">🏢 사무국 전경 갤러리</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {settings.officeViewImages.map((img, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelectedImage(img)}
                    className="aspect-video rounded-3xl overflow-hidden shadow-lg cursor-pointer group"
                  >
                    <img src={img} alt={`Office View ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {/* Map Section */}
          <div className="mt-20">
            <h4 className="text-xl font-bold mb-8 text-slate-800">📍 오시는 길 지도</h4>
            <div className="w-full h-[300px] md:h-[450px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3211.765!2d128.514652!3d36.594652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x356653063548f0e5%3A0x6d9e5f5f5f5f5f5f!2z6rK967aB67CU7J207Jik7IKw7JeF7Jew6rWs7JuQ!5e0!3m2!1sko!2skr!4v1710576000000!5m2!1sko!2skr" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">WFIRM <span className="text-slate-400 font-medium">KOREA</span></h1>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-slate-400 hover:text-slate-900 transition"><Globe size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition"><Search size={20} /></a>
            </div>
          </div>
          <div className="text-center md:text-left border-t border-slate-50 pt-12">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">© 2026 WFIRM Korea Promotion Office. All Rights Reserved.</p>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              본 페이지는 첨단재생의료산업 WFIRM Korea 추진사무국 개소식 및 글로벌 바이오 트렌드 분석을 위해 제작된 공식 임시 홈페이지입니다. 모든 데이터는 실시간으로 관리됩니다.
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Panel Overlay */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel 
            settings={settings} 
            trends={trends} 
            onClose={() => setIsAdminOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage} 
              alt="Enlarged view" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition"
              onClick={() => setSelectedImage(null)}
            >
              <X size={40} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
