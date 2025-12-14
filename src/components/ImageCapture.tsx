import React, { useState, useRef, useEffect } from 'react';
import { ImageType } from '../types/pose';
import { useCamera } from '../hooks/useCamera';
import { drawGuideline } from '../utils/drawingUtils';

interface ImageCaptureProps {
  imageType: ImageType;
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  [ImageType.NEUTRAL]: '正面画像',
  [ImageType.RIGHT_TILT]: '右側屈画像',
  [ImageType.LEFT_TILT]: '左側屈画像',
};

const IMAGE_TYPE_INSTRUCTIONS: Record<ImageType, string> = {
  [ImageType.NEUTRAL]: 'まっすぐ前を向いてください',
  [ImageType.RIGHT_TILT]: '肩を動かさずに、首だけを右に傾けてください',
  [ImageType.LEFT_TILT]: '肩を動かさずに、首だけを左に傾けてください',
};

export const ImageCapture: React.FC<ImageCaptureProps> = ({
  imageType,
  onCapture,
  onCancel,
}) => {
  const { videoRef, isStreaming, error, startCamera, stopCamera, captureImage } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showGuideline, setShowGuideline] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // ガイドラインを描画
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !isStreaming || !showGuideline) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawFrame = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      drawGuideline(ctx, canvas.width, canvas.height);

      animationId = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isStreaming, showGuideline]);

  const handleCapture = () => {
    const dataUrl = captureImage();
    if (dataUrl) {
      stopCamera();
      onCapture(dataUrl);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        stopCamera();
        onCapture(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{IMAGE_TYPE_LABELS[imageType]}</h2>
          <p className="text-gray-600 mb-4">{IMAGE_TYPE_INSTRUCTIONS[imageType]}</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              className="w-full h-auto"
              style={{ maxHeight: '60vh' }}
              autoPlay
              playsInline
              muted
            />
            {showGuideline && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showGuideline}
                onChange={(e) => setShowGuideline(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">ガイドラインを表示</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCapture}
              disabled={!isStreaming}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              📸 撮影する
            </button>

            <label className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition-colors text-center">
              📁 ファイルから選択
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                stopCamera();
                onCancel();
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
