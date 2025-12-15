import { useEffect, useRef, useState } from 'react';
import { Landmark } from '../types/pose';

// MediaPipe Holisticの型定義をグローバルから取得
declare global {
  interface Window {
    Holistic: any;
  }
}

type Holistic = any;
type HolisticResults = any;

interface UsePoseDetectionProps {
  onResults?: (landmarks: Landmark[]) => void;
}

interface UsePoseDetectionReturn {
  pose: Holistic | null;
  isLoading: boolean;
  error: string | null;
  processImage: (imageElement: HTMLImageElement) => Promise<Landmark[] | null>;
}

/**
 * MediaPipe Holisticを使用した姿勢検出のカスタムフック
 * (従来のPoseより高精度な顔468点+姿勢33点+手42点を検出)
 */
export function usePoseDetection({ onResults }: UsePoseDetectionProps = {}): UsePoseDetectionReturn {
  const [pose, setPose] = useState<Holistic | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializePose = async () => {
      try {
        setIsLoading(true);
        
        // MediaPipe HolisticをCDNから動的に読み込む
        console.log('Loading MediaPipe Holistic from CDN...');
        if (!window.Holistic) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          console.log('MediaPipe Holistic script loaded');
        }
        
        // MediaPipe Holisticのインスタンスを作成
        console.log('Initializing MediaPipe Holistic...');
        const holisticInstance = new window.Holistic({
          locateFile: (file: string) => {
            console.log('Loading MediaPipe file:', file);
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
          }
        });

        // オプションを設定（精度向上のため最適化）
        holisticInstance.setOptions({
          modelComplexity: 2,              // 2: 最高精度モデル
          smoothLandmarks: true,            // スムージング有効
          enableSegmentation: false,        // セグメンテーション無効（高速化）
          smoothSegmentation: false,
          refineFaceLandmarks: true,        // 顔ランドマークの精度向上（468点）
          minDetectionConfidence: 0.7,      // 検出信頼度を70%に引き上げ
          minTrackingConfidence: 0.7        // トラッキング信頼度を70%に引き上げ
        });

        // 結果のコールバックを設定
        holisticInstance.onResults((results: HolisticResults) => {
          console.log('MediaPipe Holistic onResults called:', {
            pose: results.poseLandmarks ? 'Found' : 'Not found',
            face: results.faceLandmarks ? `Found (${results.faceLandmarks.length} points)` : 'Not found',
            leftHand: results.leftHandLandmarks ? 'Found' : 'Not found',
            rightHand: results.rightHandLandmarks ? 'Found' : 'Not found'
          });
          
          if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks as Landmark[];
            landmarksRef.current = landmarks;
            console.log('Pose landmarks saved to ref:', landmarks.length);
            
            // 顔のランドマークも保存（後で使用するため）
            if (results.faceLandmarks) {
              console.log('Face landmarks detected:', results.faceLandmarks.length, 'points');
              // グローバルに保存して顎と耳の精度向上に使用
              (landmarksRef.current as any).faceLandmarks = results.faceLandmarks;
            }
            
            if (onResults) {
              onResults(landmarks);
            }
          } else {
            console.warn('No pose landmarks detected in image');
            landmarksRef.current = null;
          }
        });

        // 初期化を待つ
        await holisticInstance.initialize();

        if (isMounted) {
          setPose(holisticInstance);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Holistic initialization error:', err);
          setError(err instanceof Error ? err.message : 'MediaPipe Holisticの初期化に失敗しました');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializePose();

    return () => {
      isMounted = false;
      if (pose) {
        pose.close();
      }
    };
  }, []);

  /**
   * 画像をリサイズして適切なサイズに縮小
   */
  const resizeImage = (img: HTMLImageElement, maxWidth: number = 1280, maxHeight: number = 1280): HTMLImageElement => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    // アスペクト比を維持しながらリサイズ
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }

    const resizedImg = new Image();
    resizedImg.src = canvas.toDataURL('image/jpeg', 0.9);
    console.log(`Image resized from ${img.width}x${img.height} to ${width}x${height}`);
    return resizedImg;
  };

  /**
   * 画像を処理してランドマークを取得
   */
  const processImage = async (imageElement: HTMLImageElement): Promise<Landmark[] | null> => {
    if (!pose) {
      console.error('Pose is not initialized');
      setError('Poseが初期化されていません');
      return null;
    }

    try {
      landmarksRef.current = null;
      
      console.log('Original image size:', imageElement.width, 'x', imageElement.height);
      
      // 画像が大きすぎる場合はリサイズ
      let processImg = imageElement;
      if (imageElement.width > 1280 || imageElement.height > 1280) {
        processImg = resizeImage(imageElement);
        // リサイズ後の画像が読み込まれるまで待つ
        await new Promise<void>((resolve) => {
          if (processImg.complete) {
            resolve();
          } else {
            processImg.onload = () => resolve();
          }
        });
      }
      
      console.log('Processing image with MediaPipe Holistic...', processImg.width, 'x', processImg.height);
      await pose.send({ image: processImg });
      
      // 結果が非同期で返ってくるのを待つ（最大5秒）
      const maxWaitTime = 5000;
      const checkInterval = 100;
      let waited = 0;
      
      while (landmarksRef.current === null && waited < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }
      
      console.log('Wait time:', waited, 'ms');
      console.log('Landmarks detected:', landmarksRef.current ? (landmarksRef.current as Landmark[]).length : 'null');
      
      return landmarksRef.current;
    } catch (err) {
      console.error('Image processing error:', err);
      setError(err instanceof Error ? err.message : '画像の処理に失敗しました');
      return null;
    }
  };

  return {
    pose,
    isLoading,
    error,
    processImage,
  };
}
