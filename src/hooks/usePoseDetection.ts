import { useEffect, useRef, useState } from 'react';
import { Pose, Results } from '@mediapipe/pose';
import { Landmark } from '../types/pose';

interface UsePoseDetectionProps {
  onResults?: (landmarks: Landmark[]) => void;
}

interface UsePoseDetectionReturn {
  pose: Pose | null;
  isLoading: boolean;
  error: string | null;
  processImage: (imageElement: HTMLImageElement) => Promise<Landmark[] | null>;
}

/**
 * MediaPipe Poseを使用した姿勢検出のカスタムフック
 */
export function usePoseDetection({ onResults }: UsePoseDetectionProps = {}): UsePoseDetectionReturn {
  const [pose, setPose] = useState<Pose | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializePose = async () => {
      try {
        setIsLoading(true);
        
        // MediaPipe Poseのインスタンスを作成
        const poseInstance = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        // オプションを設定
        poseInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // 結果のコールバックを設定
        poseInstance.onResults((results: Results) => {
          if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks as Landmark[];
            landmarksRef.current = landmarks;
            
            if (onResults) {
              onResults(landmarks);
            }
          }
        });

        // 初期化を待つ
        await poseInstance.initialize();

        if (isMounted) {
          setPose(poseInstance);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Pose initialization error:', err);
          setError(err instanceof Error ? err.message : 'Poseの初期化に失敗しました');
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
   * 画像を処理してランドマークを取得
   */
  const processImage = async (imageElement: HTMLImageElement): Promise<Landmark[] | null> => {
    if (!pose) {
      setError('Poseが初期化されていません');
      return null;
    }

    try {
      landmarksRef.current = null;
      await pose.send({ image: imageElement });
      
      // 結果が非同期で返ってくるので少し待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
