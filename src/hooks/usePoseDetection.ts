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
        console.log('🚀 [DEBUG] Loading MediaPipe Holistic from CDN...');
        console.log('🚀 [DEBUG] window.Holistic exists?', !!window.Holistic);
        if (!window.Holistic) {
          console.log('🚀 [DEBUG] Holistic not found, loading script...');
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js';
            script.onload = () => {
              console.log('✅ [DEBUG] MediaPipe Holistic script loaded successfully');
              console.log('✅ [DEBUG] window.Holistic now available?', !!window.Holistic);
              resolve(undefined);
            };
            script.onerror = (err) => {
              console.error('❌ [DEBUG] Failed to load Holistic script:', err);
              reject(err);
            };
            document.head.appendChild(script);
          });
        } else {
          console.log('✅ [DEBUG] MediaPipe Holistic already loaded');
        }
        
        // MediaPipe Holisticのインスタンスを作成
        console.log('🔧 [DEBUG] Initializing MediaPipe Holistic instance...');
        console.log('🔧 [DEBUG] Creating new window.Holistic()...');
        const holisticInstance = new window.Holistic({
          locateFile: (file: string) => {
            console.log('📦 [DEBUG] Loading MediaPipe file:', file);
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
          }
        });
        console.log('✅ [DEBUG] Holistic instance created:', holisticInstance);

        // オプションを設定（精度向上のため最適化）
        console.log('⚙️ [DEBUG] Setting Holistic options...');
        const options = {
          modelComplexity: 2,              // 2: 最高精度モデル
          smoothLandmarks: true,            // スムージング有効
          enableSegmentation: false,        // セグメンテーション無効（高速化）
          smoothSegmentation: false,
          refineFaceLandmarks: true,        // 顔ランドマークの精度向上（468点）
          minDetectionConfidence: 0.7,      // 検出信頼度を70%に引き上げ
          minTrackingConfidence: 0.7        // トラッキング信頼度を70%に引き上げ
        };
        console.log('⚙️ [DEBUG] Options:', options);
        holisticInstance.setOptions(options);
        console.log('✅ [DEBUG] Options set successfully');

        // 結果のコールバックを設定
        console.log('📊 [DEBUG] Setting onResults callback...');
        holisticInstance.onResults((results: HolisticResults) => {
          console.log('🎯 [DEBUG] ===== MediaPipe Holistic onResults called =====');
          console.log('🎯 [DEBUG] Results object:', results);
          console.log('🎯 [DEBUG] Pose landmarks:', results.poseLandmarks ? `Found (${results.poseLandmarks.length} points)` : 'Not found');
          console.log('🎯 [DEBUG] Face landmarks:', results.faceLandmarks ? `✅ Found (${results.faceLandmarks.length} points)` : '❌ Not found');
          console.log('🎯 [DEBUG] Left hand:', results.leftHandLandmarks ? 'Found' : 'Not found');
          console.log('🎯 [DEBUG] Right hand:', results.rightHandLandmarks ? 'Found' : 'Not found');
          
          if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks as Landmark[];
            landmarksRef.current = landmarks;
            console.log('✅ [DEBUG] Pose landmarks saved to ref:', landmarks.length);
            
            // 顔のランドマークも保存（後で使用するため）
            if (results.faceLandmarks) {
              console.log('✅ [DEBUG] Face landmarks detected:', results.faceLandmarks.length, 'points');
              console.log('✅ [DEBUG] Sample face landmarks:', {
                chinTip_152: results.faceLandmarks[152],
                leftEar_234: results.faceLandmarks[234],
                rightEar_454: results.faceLandmarks[454]
              });
              // グローバルに保存して顎と耳の精度向上に使用
              (landmarksRef.current as any).faceLandmarks = results.faceLandmarks;
              console.log('✅ [DEBUG] Face landmarks attached to pose landmarks');
            } else {
              console.warn('⚠️ [DEBUG] No face landmarks detected - will use standard Pose method');
            }
            
            if (onResults) {
              onResults(landmarks);
            }
          } else {
            console.warn('❌ [DEBUG] No pose landmarks detected in image');
            landmarksRef.current = null;
          }
          console.log('🎯 [DEBUG] ===== End of onResults =====');
        });
        console.log('✅ [DEBUG] onResults callback set');

        // 初期化を待つ
        console.log('🔄 [DEBUG] Initializing Holistic instance...');
        await holisticInstance.initialize();
        console.log('✅ [DEBUG] Holistic instance initialized successfully');

        if (isMounted) {
          setPose(holisticInstance);
          setError(null);
          console.log('✅ [DEBUG] Holistic instance stored in state');
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
      
      console.log('🖼️ [DEBUG] Processing image with MediaPipe Holistic...', processImg.width, 'x', processImg.height);
      console.log('🖼️ [DEBUG] Sending image to Holistic.send()...');
      await pose.send({ image: processImg });
      console.log('✅ [DEBUG] Image sent to Holistic, waiting for results...');
      
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
