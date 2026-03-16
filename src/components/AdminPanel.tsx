import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { SiteSettings, BioTrend, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { X, Save, Plus, LogOut, Settings, BarChart3 } from 'lucide-react';
import { signOut } from 'firebase/auth';

interface AdminPanelProps {
  settings: SiteSettings;
  trends: BioTrend[];
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ settings, trends, onClose }) => {
  const [activeTab, setActiveTab] = useState<'site' | 'trends'>('site');
  const [localSettings, setLocalSettings] = useState(settings);
  const [newTrend, setNewTrend] = useState<Partial<BioTrend>>({
    keyword: '',
    marketShare: 0,
    growthRate: [10, 20, 30, 40, 50, 60],
    connectivity: 3
  });

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), localSettings);
      alert('설정이 저장되었습니다.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  };

  const handleAddTrend = async () => {
    try {
      if (!newTrend.keyword) return alert('키워드를 입력하세요.');
      await addDoc(collection(db, 'trends'), newTrend);
      alert('트렌드 데이터가 추가되었습니다.');
      setNewTrend({ keyword: '', marketShare: 0, growthRate: [10, 20, 30, 40, 50, 60], connectivity: 3 });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'trends');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof SiteSettings) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'openingCeremonyImages' | 'officeViewImages', limit: number) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Process only up to the limit
    const filesToProcess = files.slice(0, limit);
    const newImages: string[] = [];

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        if (newImages.length === filesToProcess.length) {
          setLocalSettings(prev => ({ ...prev, [field]: newImages }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">관리자 리모컨</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Admin Control Center</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">메인 제목</label>
              <input 
                value={localSettings.heroTitle}
                onChange={e => setLocalSettings(prev => ({ ...prev, heroTitle: e.target.value }))}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">설명 문구</label>
              <textarea 
                value={localSettings.heroDescription}
                onChange={e => setLocalSettings(prev => ({ ...prev, heroDescription: e.target.value }))}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-32 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">메인 사진</label>
                <input type="file" onChange={e => handleImageUpload(e, 'heroImage')} className="text-xs text-slate-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">사무국 사진 (대표)</label>
                <input type="file" onChange={e => handleImageUpload(e, 'officeImage')} className="text-xs text-slate-500" />
              </div>
            </div>
            <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">갤러리 세부 관리</h4>
              
              {/* Opening Ceremony Images */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">개소식 현장 사진 (최대 6장)</label>
                <div className="grid grid-cols-3 gap-2">
                  {localSettings.openingCeremonyImages?.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          const newImages = [...(localSettings.openingCeremonyImages || [])];
                          newImages.splice(idx, 1);
                          setLocalSettings(prev => ({ ...prev, openingCeremonyImages: newImages }));
                        }}
                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(localSettings.openingCeremonyImages?.length || 0) < 6 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-emerald-500 hover:text-emerald-500 cursor-pointer transition">
                      <Plus size={20} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLocalSettings(prev => ({ 
                                ...prev, 
                                openingCeremonyImages: [...(prev.openingCeremonyImages || []), reader.result as string] 
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Office View Images */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">사무국 전경 사진 (최대 3장)</label>
                <div className="grid grid-cols-3 gap-2">
                  {localSettings.officeViewImages?.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          const newImages = [...(localSettings.officeViewImages || [])];
                          newImages.splice(idx, 1);
                          setLocalSettings(prev => ({ ...prev, officeViewImages: newImages }));
                        }}
                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(localSettings.officeViewImages?.length || 0) < 3 && (
                    <label className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-emerald-500 hover:text-emerald-500 cursor-pointer transition">
                      <Plus size={20} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLocalSettings(prev => ({ 
                                ...prev, 
                                officeViewImages: [...(prev.officeViewImages || []), reader.result as string] 
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">유튜브 링크</label>
              <input 
                value={localSettings.videoUrl}
                onChange={e => setLocalSettings(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
            <button 
              onClick={handleSaveSettings}
              className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition flex items-center justify-center gap-2"
            >
              <Save size={18} /> 실시간 저장하기
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button 
            onClick={() => signOut(auth)}
            className="text-xs text-red-500 font-bold flex items-center gap-2 hover:opacity-70"
          >
            <LogOut size={14} /> 로그아웃
          </button>
          <p className="text-[10px] text-slate-400">© 2026 WFIRM Korea Admin System</p>
        </div>
      </div>
    </div>
  );
};
