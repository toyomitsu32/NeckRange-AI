import { useState } from 'react';
import { ImageType, Landmark, DiagnosisResult as DiagnosisResultType } from './types/pose';
import { ImageCapture } from './components/ImageCapture';
import { PoseAnalysis } from './components/PoseAnalysis';
import { DiagnosisResult } from './components/DiagnosisResult';
import {
  evaluateFlexibility,
  evaluateAsymmetry,
  generateRecommendations,
} from './utils/validationUtils';
import { calculateLateralFlexionAngle } from './utils/angleUtils';

interface CapturedImage {
  type: ImageType;
  url: string;
  landmarks?: Landmark[];
  angle?: number;
  shoulderAngle?: number;
}

type AppState = 'intro' | 'capture' | 'analyze' | 'result';

function App() {
  const [appState, setAppState] = useState<AppState>('intro');
  const [currentImageType, setCurrentImageType] = useState<ImageType>(ImageType.NEUTRAL);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResultType | null>(null);

  const handleStartCapture = () => {
    setAppState('capture');
    setCurrentImageType(ImageType.NEUTRAL);
    setCapturedImages([]);
    setError(null);
  };

  const handleImageCaptured = (dataUrl: string) => {
    setCapturedImages(prev => [
      ...prev,
      { type: currentImageType, url: dataUrl }
    ]);
    setAppState('analyze');
  };

  const handleAnalysisComplete = (landmarks: Landmark[], angle: number, shoulderAngle?: number) => {
    const updatedImages = capturedImages.map(img =>
      img.type === currentImageType
        ? { ...img, landmarks, angle, shoulderAngle }
        : img
    );
    setCapturedImages(updatedImages);
    setError(null);

    // 次の画像へ進む
    if (currentImageType === ImageType.NEUTRAL) {
      setCurrentImageType(ImageType.RIGHT_TILT);
      setAppState('capture');
    } else if (currentImageType === ImageType.RIGHT_TILT) {
      setCurrentImageType(ImageType.LEFT_TILT);
      setAppState('capture');
    } else {
      // すべての画像が揃ったので診断を実行
      calculateDiagnosis(updatedImages);
    }
  };

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    // エラーが発生したら同じ画像を再撮影
    setTimeout(() => {
      setCapturedImages(prev => prev.filter(img => img.type !== currentImageType));
      setAppState('capture');
      setError(null);
    }, 3000);
  };

  const calculateDiagnosis = (images: CapturedImage[]) => {
    const neutral = images.find(img => img.type === ImageType.NEUTRAL);
    const right = images.find(img => img.type === ImageType.RIGHT_TILT);
    const left = images.find(img => img.type === ImageType.LEFT_TILT);

    if (!neutral?.angle || !right?.angle || !left?.angle ||
        !neutral?.landmarks || !right?.landmarks || !left?.landmarks) {
      setError('角度データが不足しています');
      return;
    }

    // 正面からの側屈角度を計算
    const rightAngle = calculateLateralFlexionAngle(neutral.angle, right.angle);
    const leftAngle = calculateLateralFlexionAngle(neutral.angle, left.angle);

    // 柔軟性と左右差を評価
    const rightFlexibility = evaluateFlexibility(rightAngle);
    const leftFlexibility = evaluateFlexibility(leftAngle);
    const asymmetry = evaluateAsymmetry(rightAngle, leftAngle);
    const asymmetryDiff = Math.abs(rightAngle - leftAngle);

    // 推奨事項を生成
    const recommendations = generateRecommendations(
      rightFlexibility,
      leftFlexibility,
      asymmetry,
      rightAngle,
      leftAngle
    );

    const result: DiagnosisResultType = {
      neutralAngle: neutral.angle,  // 正面（中心）の角度
      rightAngle,
      leftAngle,
      rightFlexibility,
      leftFlexibility,
      asymmetry,
      asymmetryDiff,
      recommendations,
      // 肩の傾き角度（側屈時）
      rightShoulderAngle: right.shoulderAngle,
      leftShoulderAngle: left.shoulderAngle,
      // 画像データを含める
      neutralImage: {
        type: neutral.type,
        url: neutral.url,
        landmarks: neutral.landmarks,
        angle: neutral.angle,
        shoulderAngle: neutral.shoulderAngle
      },
      rightImage: {
        type: right.type,
        url: right.url,
        landmarks: right.landmarks,
        angle: right.angle,
        shoulderAngle: right.shoulderAngle
      },
      leftImage: {
        type: left.type,
        url: left.url,
        landmarks: left.landmarks,
        angle: left.angle,
        shoulderAngle: left.shoulderAngle
      }
    };

    setDiagnosisResult(result);
    setAppState('result');
  };

  const handleReset = () => {
    setAppState('intro');
    setCapturedImages([]);
    setError(null);
    setDiagnosisResult(null);
    setCurrentImageType(ImageType.NEUTRAL);
  };

  const handleCancelCapture = () => {
    // 前の画像を削除
    setCapturedImages(prev => prev.filter(img => img.type !== currentImageType));
    
    // 最初の画像の場合はイントロに戻る
    if (currentImageType === ImageType.NEUTRAL) {
      setAppState('intro');
    } else if (currentImageType === ImageType.RIGHT_TILT) {
      // 正面画像の再撮影
      setCurrentImageType(ImageType.NEUTRAL);
      setAppState('capture');
    } else {
      // 右側屈画像の再撮影
      setCurrentImageType(ImageType.RIGHT_TILT);
      setAppState('capture');
    }
  };

  const getProgressText = () => {
    const total = 3;
    const current = capturedImages.filter(img => img.landmarks).length + 1;
    return `ステップ ${current} / ${total}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* ヘッダー */}
      <header className="glass-card shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🧘‍♂️</div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text">
                  NeckRange AI
                </h1>
                <p className="text-xs md:text-sm text-gray-600">AI首可動域測定</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full">
              <span className="text-xl">✨</span>
              <span className="text-sm font-semibold text-gray-700">プロ整体師レベルの診断</span>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-bold">エラー</p>
            <p>{error}</p>
          </div>
        )}

        {/* イントロ画面 */}
        {appState === 'intro' && (
          <div className="max-w-6xl mx-auto">
            {/* ヒーローセクション */}
            <div className="glass-card rounded-3xl p-8 md:p-12 mb-8 animate-fade-in-up">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-block mb-4">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      AI搭載・無料診断
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text leading-tight">
                    首の可動域を<br/>AIで測定
                  </h2>
                  <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                    スマホで撮影するだけで、首の柔軟性と左右のバランスを<br className="hidden md:block"/>
                    プロの整体師レベルで診断します
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-2xl">⚡</span>
                      <span className="font-medium">わずか3分</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-2xl">🎯</span>
                      <span className="font-medium">高精度AI診断</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-2xl">📊</span>
                      <span className="font-medium">詳細レポート</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div className="relative animate-float">
                    <div className="text-9xl text-center">🧘‍♂️</div>
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white/50 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg">
                      <span className="text-sm font-semibold text-gray-700">首の健康チェック</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3ステップ説明 */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="glass-card rounded-2xl p-6 hover-lift animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">正面を撮影</h3>
                <p className="text-gray-600 mb-4">まっすぐ前を向いた状態で撮影します</p>
                <div className="text-6xl text-center animate-pulse-soft">👤</div>
              </div>

              <div className="glass-card rounded-2xl p-6 hover-lift animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">右側屈を撮影</h3>
                <p className="text-gray-600 mb-4">肩を動かさず、首だけを右に傾けます</p>
                <div className="text-6xl text-center animate-pulse-soft" style={{animationDelay: '0.3s'}}>🙇</div>
              </div>

              <div className="glass-card rounded-2xl p-6 hover-lift animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <div className="bg-gradient-to-br from-pink-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">左側屈を撮影</h3>
                <p className="text-gray-600 mb-4">肩を動かさず、首だけを左に傾けます</p>
                <div className="text-6xl text-center animate-pulse-soft" style={{animationDelay: '0.6s'}}>🙇‍♂️</div>
              </div>
            </div>

            {/* 注意事項 */}
            <div className="glass-card rounded-2xl p-6 mb-8 border-l-4 border-yellow-500 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-3 text-gray-800">撮影のコツ</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-green-500">✓</span>
                      <span>肩を水平に保つ</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-green-500">✓</span>
                      <span>明るい場所で撮影</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-green-500">✓</span>
                      <span>顔と肩を画面内に</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-green-500">✓</span>
                      <span>痛みがあれば中止</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTAボタン */}
            <div className="text-center animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <button
                onClick={handleStartCapture}
                className="group relative inline-flex items-center justify-center px-12 py-5 text-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative flex items-center gap-3">
                  <span className="text-3xl animate-pulse-soft">🚀</span>
                  <span>測定を開始する</span>
                </span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
              </button>
              <p className="text-gray-500 mt-4 text-sm">
                所要時間: 約3分 | 完全無料 | 個人情報不要
              </p>
            </div>
          </div>
        )}

        {/* 画像キャプチャ */}
        {appState === 'capture' && (
          <div>
            <div className="text-center mb-4">
              <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                {getProgressText()}
              </span>
            </div>
            <ImageCapture
              imageType={currentImageType}
              onCapture={handleImageCaptured}
              onCancel={handleCancelCapture}
            />
          </div>
        )}

        {/* 画像解析 */}
        {appState === 'analyze' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                {getProgressText()}
              </span>
            </div>
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                画像を解析中...
              </h2>
              {capturedImages
                .filter(img => img.type === currentImageType)
                .map((img, index) => (
                  <PoseAnalysis
                    key={index}
                    imageUrl={img.url}
                    imageType={img.type}
                    onAnalysisComplete={handleAnalysisComplete}
                    onError={handleAnalysisError}
                  />
                ))}
            </div>
          </div>
        )}

        {/* 診断結果 */}
        {appState === 'result' && diagnosisResult && (
          <DiagnosisResult result={diagnosisResult} onReset={handleReset} />
        )}
      </main>

      {/* フッター */}
      <footer className="glass-card mt-16 py-8 border-t border-white/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <span className="text-2xl">🧘‍♂️</span>
                <span className="font-bold gradient-text text-lg">NeckRange AI</span>
              </div>
              <p className="text-sm text-gray-600">
                AI技術で首の健康をサポート
              </p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-800 mb-2">こんな方におすすめ</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>デスクワークが多い方</li>
                <li>首や肩のコリに悩む方</li>
                <li>姿勢改善を目指す方</li>
              </ul>
            </div>
            <div className="text-center md:text-right">
              <h4 className="font-semibold text-gray-800 mb-2">サポート</h4>
              <p className="text-sm text-gray-600">
                この診断は医療行為ではありません<br/>
                痛みがある場合は医師にご相談ください
              </p>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
            © 2024 NeckRange AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
