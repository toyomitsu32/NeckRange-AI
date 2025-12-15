import React, { useEffect, useRef, useState } from 'react';
import { DiagnosisResult as DiagnosisResultType, CapturedImageData } from '../types/pose';
import {
  getFlexibilityLabel,
  getAsymmetryLabel,
  getAsymmetryColor,
} from '../utils/validationUtils';
import {
  drawLandmarks,
  drawSkeleton,
  drawShoulderLine,
  drawNeckAngleLine,
} from '../utils/drawingUtils';

interface DiagnosisResultProps {
  result: DiagnosisResultType;
  onReset: () => void;
}

/**
 * 画像に骨格と角度の線を描画するコンポーネント
 */
const AnnotatedImage: React.FC<{ imageData: CapturedImageData; title: string }> = ({ imageData, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // キャンバスサイズを画像に合わせる
      canvas.width = img.width;
      canvas.height = img.height;

      // 画像を描画
      ctx.drawImage(img, 0, 0);

      // 骨格を描画
      drawSkeleton(ctx, imageData.landmarks, canvas.width, canvas.height);
      drawLandmarks(ctx, imageData.landmarks, canvas.width, canvas.height);

      // 肩の線を描画（緑色で水平を示す）
      drawShoulderLine(ctx, imageData.landmarks, canvas.width, canvas.height, true);

      // 首の角度線を描画
      drawNeckAngleLine(ctx, imageData.landmarks, canvas.width, canvas.height, imageData.angle);
    };

    img.src = imageData.url;
  }, [imageData]);

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200/50">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-3 font-semibold text-center">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{title}</span>
        </div>
      </div>
      <div className="relative p-2">
        <canvas ref={canvasRef} className="w-full h-auto rounded-lg" />
      </div>
    </div>
  );
};

/**
 * 円形プログレスバー
 */
const CircularProgress: React.FC<{ value: number; max: number; label: string; color: string }> = ({ value, max, label, color }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="54"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="64"
            cy="64"
            r="54"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{value.toFixed(1)}°</div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium text-gray-600">{label}</div>
    </div>
  );
};

/**
 * スコアカード
 */
const ScoreCard: React.FC<{ 
  title: string; 
  score: number; 
  label: string; 
  icon: React.ReactNode;
  gradient: string;
  details?: { label: string; value: string }[];
}> = ({ title, score, label, icon, gradient, details }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className={`relative bg-gradient-to-br ${gradient} rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-500"></div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {icon}
              <span>{title}</span>
            </h3>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-6xl font-black text-white mb-2 drop-shadow-lg">
              {score.toFixed(1)}°
            </div>
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-sm font-bold text-white">{label}</span>
            </div>
          </div>

          {details && details.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/20 space-y-3">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center text-white/90">
                  <span className="text-sm font-medium">{detail.label}</span>
                  <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ result, onReset }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
              <svg className="inline-block w-5 h-5 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analysis Complete
            </div>
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-4">
            診断結果
          </h1>
          <p className="text-gray-600 text-lg">首の可動域と姿勢バランスの分析レポート</p>
        </div>

        {/* 正面角度 - ヒーローセクション */}
        <div className="mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>正面（中心）の首の角度</span>
              </h2>
              <div className="flex justify-center">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl opacity-20"></div>
                    <div className="relative text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {result.neutralAngle.toFixed(1)}°
                    </div>
                  </div>
                  <p className="mt-4 text-gray-600 font-medium">※ 0度が完全に垂直な状態です</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 側屈測定結果 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <ScoreCard
            title="右側屈"
            score={result.rightAngle}
            label={getFlexibilityLabel(result.rightFlexibility)}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
            gradient="from-blue-500 to-blue-600"
            details={[
              { label: "首の傾き（垂直から）", value: `${result.rightImage?.angle.toFixed(1)}°` },
              ...(result.rightShoulderAngle !== undefined ? [{ 
                label: "肩の傾き（水平から）", 
                value: `${result.rightShoulderAngle.toFixed(1)}°` 
              }] : [])
            ]}
          />
          
          <ScoreCard
            title="左側屈"
            score={result.leftAngle}
            label={getFlexibilityLabel(result.leftFlexibility)}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>}
            gradient="from-green-500 to-emerald-600"
            details={[
              { label: "首の傾き（垂直から）", value: `${result.leftImage?.angle.toFixed(1)}°` },
              ...(result.leftShoulderAngle !== undefined ? [{ 
                label: "肩の傾き（水平から）", 
                value: `${result.leftShoulderAngle.toFixed(1)}°` 
              }] : [])
            ]}
          />
        </div>

        {/* 左右バランス */}
        <div className="mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span>左右のバランス</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <CircularProgress value={result.rightAngle} max={60} label="右側屈" color="text-blue-600" />
              <div className="flex flex-col items-center justify-center">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                  {result.asymmetryDiff.toFixed(1)}°
                </div>
                <div className="text-sm font-medium text-gray-600 mb-3">左右差</div>
                <div className={`inline-block px-6 py-2 rounded-full font-bold text-sm ${
                  getAsymmetryColor(result.asymmetry).includes('green') ? 'bg-green-100 text-green-700' :
                  getAsymmetryColor(result.asymmetry).includes('yellow') ? 'bg-yellow-100 text-yellow-700' :
                  getAsymmetryColor(result.asymmetry).includes('orange') ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getAsymmetryLabel(result.asymmetry)}
                </div>
              </div>
              <CircularProgress value={result.leftAngle} max={60} label="左側屈" color="text-green-600" />
            </div>
          </div>
        </div>

        {/* 解析画像 */}
        {result.neutralImage && result.rightImage && result.leftImage && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>解析画像</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <AnnotatedImage imageData={result.neutralImage} title="正面（中心）" />
              <AnnotatedImage imageData={result.rightImage} title="右側屈" />
              <AnnotatedImage imageData={result.leftImage} title="左側屈" />
            </div>
            
            {/* 凡例 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>ランドマーク凡例</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-green-500 rounded-full shadow"></span>
                  <span className="text-gray-700">骨格とランドマーク・肩のライン（水平時）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-red-500 rounded-full shadow"></span>
                  <span className="text-gray-700">肩のライン（傾斜時）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-yellow-500 rounded-full shadow"></span>
                  <span className="text-gray-700">首の傾き角度線（顎→耳の中点）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-white border-2 border-gray-400 rounded-full shadow"></span>
                  <span className="text-gray-700">水平・垂直基準線</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full shadow" style={{backgroundColor: '#ff00ff'}}></span>
                  <span className="text-gray-700">顎の位置（口の中点）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full shadow" style={{backgroundColor: '#00ffff'}}></span>
                  <span className="text-gray-700">耳の中点</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 評価基準 */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>可動域の評価</span>
            </h3>
            <div className="space-y-3">
              {[
                { label: '硬い', range: '30°未満', color: 'bg-red-500' },
                { label: 'やや硬い', range: '30°〜40°', color: 'bg-orange-500' },
                { label: '普通', range: '40°〜50°', color: 'bg-yellow-500' },
                { label: '柔軟', range: '50°以上', color: 'bg-green-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${item.color} rounded-full shadow`}></div>
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-600">{item.range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>左右差の評価</span>
            </h3>
            <div className="space-y-3">
              {[
                { label: '正常', range: '5°未満', color: 'bg-green-500' },
                { label: '軽度', range: '5°〜10°', color: 'bg-yellow-500' },
                { label: '中等度', range: '10°〜15°', color: 'bg-orange-500' },
                { label: '顕著', range: '15°以上', color: 'bg-red-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${item.color} rounded-full shadow`}></div>
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-600">{item.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 推奨事項 */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-lg p-8 mb-8 border border-amber-200/50">
          <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-3">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>推奨事項</span>
          </h3>
          <div className="space-y-4">
            {result.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-colors group">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>
                <p className="text-gray-700 leading-relaxed pt-1">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl shadow-lg p-6 mb-8 border border-red-200/50">
          <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>注意事項</span>
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            この診断はあくまで簡易的なものであり、医学的診断に代わるものではありません。
            痛みや異常を感じる場合は、必ず医療機関を受診してください。
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onReset}
            className="group flex-1 relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>再測定する</span>
            </div>
          </button>
          <button
            onClick={() => window.print()}
            className="group flex-1 relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>結果を印刷</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
