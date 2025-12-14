import React, { useEffect, useRef, useState } from 'react';
import { Landmark, ImageType } from '../types/pose';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { validateShoulderLevel } from '../utils/validationUtils';
import { calculateNeckTiltAngle } from '../utils/angleUtils';
import {
  drawLandmarks,
  drawSkeleton,
  drawShoulderLine,
  drawNeckAngleLine,
  drawErrorMessage,
  drawSuccessMessage,
} from '../utils/drawingUtils';

interface PoseAnalysisProps {
  imageUrl: string;
  imageType: ImageType;
  onAnalysisComplete: (landmarks: Landmark[], angle: number) => void;
  onError: (error: string) => void;
}

export const PoseAnalysis: React.FC<PoseAnalysisProps> = ({
  imageUrl,
  imageType,
  onAnalysisComplete,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const { processImage, isLoading: isPoseLoading } = usePoseDetection();

  useEffect(() => {
    const analyzeImage = async () => {
      if (isPoseLoading) return;

      setIsAnalyzing(true);

      try {
        // 画像を読み込み
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        imageRef.current = img;

        // ポーズ検出を実行
        const detectedLandmarks = await processImage(img);

        if (!detectedLandmarks || detectedLandmarks.length === 0) {
          onError('姿勢を検出できませんでした。別の画像を試してください。');
          return;
        }

        // Landmarks are used in drawAnalysisResult

        // 肩の水平検証（正面以外の場合）
        if (imageType !== ImageType.NEUTRAL) {
          const shoulderValidation = validateShoulderLevel(detectedLandmarks);
          
          if (!shoulderValidation.isValid) {
            onError(shoulderValidation.message);
            drawAnalysisResult(img, detectedLandmarks, false, shoulderValidation.message);
            return;
          }
        }

        // 首の角度を計算
        const neckAngle = calculateNeckTiltAngle(detectedLandmarks);

        // 解析結果を描画
        drawAnalysisResult(img, detectedLandmarks, true, `角度: ${neckAngle.toFixed(1)}°`);

        // 解析完了を通知
        onAnalysisComplete(detectedLandmarks, neckAngle);
      } catch (error) {
        console.error('Analysis error:', error);
        onError(
          error instanceof Error 
            ? error.message 
            : '画像の解析中にエラーが発生しました'
        );
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeImage();
  }, [imageUrl, imageType, isPoseLoading, processImage, onAnalysisComplete, onError]);

  const drawAnalysisResult = (
    img: HTMLImageElement,
    detectedLandmarks: Landmark[],
    isValid: boolean,
    message: string
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvasのサイズを画像に合わせる
    canvas.width = img.width;
    canvas.height = img.height;

    // 画像を描画
    ctx.drawImage(img, 0, 0);

    // ランドマークとスケルトンを描画
    drawLandmarks(ctx, detectedLandmarks, canvas.width, canvas.height);
    drawSkeleton(ctx, detectedLandmarks, canvas.width, canvas.height);

    // 肩のラインを描画
    const shoulderValidation = validateShoulderLevel(detectedLandmarks);
    drawShoulderLine(
      ctx,
      detectedLandmarks,
      canvas.width,
      canvas.height,
      shoulderValidation.isValid
    );

    // 首の角度ラインを描画
    try {
      const neckAngle = calculateNeckTiltAngle(detectedLandmarks);
      drawNeckAngleLine(ctx, detectedLandmarks, canvas.width, canvas.height, neckAngle);
    } catch (error) {
      // 角度計算エラーは無視
    }

    // メッセージを描画
    if (isValid) {
      drawSuccessMessage(ctx, message, canvas.width, canvas.height);
    } else {
      drawErrorMessage(ctx, message, canvas.width, canvas.height);
    }
  };

  return (
    <div className="w-full">
      {isAnalyzing && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-lg text-gray-700">画像を解析中...</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg shadow-lg"
        style={{ display: isAnalyzing ? 'none' : 'block' }}
      />
    </div>
  );
};
