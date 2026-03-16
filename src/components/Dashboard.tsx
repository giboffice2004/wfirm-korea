import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { BioTrend } from '../types';
import { Star } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  trends: BioTrend[];
  searchQuery: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ trends, searchQuery }) => {
  const filteredTrends = trends.filter(t => 
    t.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTrend = filteredTrends[0] || trends[0];

  if (!activeTrend) return <div className="p-12 text-center text-slate-400">데이터를 불러오는 중...</div>;

  const lineData = {
    labels: ['2021', '2022', '2023', '2024', '2025', '2026'],
    datasets: [
      {
        label: `${activeTrend.keyword} 성장 추이`,
        data: activeTrend.growthRate,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const doughnutData = {
    labels: [activeTrend.keyword, '기타'],
    datasets: [
      {
        data: [activeTrend.marketShare, 100 - activeTrend.marketShare],
        backgroundColor: ['#10b981', '#f1f5f9'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Growth Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">📈 연도별 성장 추이</h3>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            {activeTrend.keyword}
          </span>
        </div>
        <div className="h-[300px]">
          <Line 
            data={lineData} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }} 
          />
        </div>
      </div>

      {/* Market Share & Connectivity */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">📊 시장 점유율</h3>
          <div className="h-[200px] flex items-center justify-center">
            <Doughnut 
              data={doughnutData} 
              options={{ 
                cutout: '70%',
                plugins: { legend: { display: false } }
              }} 
            />
            <div className="absolute text-center">
              <span className="block text-2xl font-bold text-slate-800">{activeTrend.marketShare}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Share</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-600 p-6 rounded-3xl shadow-lg text-white">
          <h3 className="text-sm font-medium opacity-80 mb-2">경북 산업 연계성</h3>
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={18} 
                fill={i < activeTrend.connectivity ? "white" : "transparent"} 
                className={i < activeTrend.connectivity ? "text-white" : "text-emerald-400"}
              />
            ))}
          </div>
          <p className="text-xs opacity-90 leading-relaxed">
            {activeTrend.keyword} 분야는 경북 바이오 클러스터와 높은 시너지를 창출하고 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
