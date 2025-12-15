import { Landmark, POSE_LANDMARKS } from '../types/pose';
import { stabilizeShoulders, estimateAcromion } from './landmarkUtils';

/**
 * 2点間の角度を計算（ラジアンから度へ変換）
 * 
 * @param x1 - 始点のX座標
 * @param y1 - 始点のY座標
 * @param x2 - 終点のX座標
 * @param y2 - 終点のY座標
 * @returns 角度（度数法）
 */
export function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
  const radians = Math.atan2(y2 - y1, x2 - x1);
  return radians * (180 / Math.PI);
}

/**
 * 肩の水平角度を計算（代償動作検知用）
 * 左肩と右肩のY座標の差から水平からの傾きを計算
 * 
 * @param landmarks - MediaPipeのランドマーク配列
 * @param imageType - 画像タイプ（右側屈/左側屈の判定用、オプショナル）
 * @returns 肩の傾き角度（度）
 *          imageType指定時：
 *            - 右側屈（right）: 右に傾く = 正の値（+）
 *            - 左側屈（left）: 左に傾く = 正の値（+）
 *          imageType未指定時（従来の動作）：
 *            - 正の値：右肩が下がっている（右に傾いている）
 *            - 負の値：左肩が下がっている（左に傾いている）
 *          0：完全に水平
 */
export function calculateShoulderAngle(landmarks: Landmark[], imageType?: string): number {
  // 肩峰の位置を推定
  const leftAcromion = estimateAcromion(landmarks, 'left');
  const rightAcromion = estimateAcromion(landmarks, 'right');

  if (!leftAcromion || !rightAcromion) {
    throw new Error('肩峰の推定に失敗しました');
  }

  // 肩峰のランドマークを安定化（対称性を利用して水平に近づける）
  const stabilized = stabilizeShoulders(leftAcromion, rightAcromion);

  // 左右の肩峰の座標差を計算
  const dx = Math.abs(stabilized.left.x - stabilized.right.x);
  const dy = stabilized.left.y - stabilized.right.y;

  // デバッグログ
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  
  console.log('Shoulder landmarks (original):', {
    left: { x: leftShoulder?.x, y: leftShoulder?.y },
    right: { x: rightShoulder?.x, y: rightShoulder?.y }
  });
  console.log('Acromion (estimated):', {
    left: { x: leftAcromion.x, y: leftAcromion.y },
    right: { x: rightAcromion.x, y: rightAcromion.y }
  });
  console.log('Acromion (stabilized):', {
    left: { x: stabilized.left.x, y: stabilized.left.y },
    right: { x: stabilized.right.x, y: stabilized.right.y },
    dx, dy
  });

  // Y座標の差から傾きを計算
  const radians = Math.atan(dy / dx);
  let degrees = radians * (180 / Math.PI);

  // imageTypeに応じて符号を調整
  // 右側屈時: 右に傾く（右肩が下がる）をプラスにする
  // 左側屈時: 左に傾く（左肩が下がる）をプラスにする
  if (imageType === 'right' && degrees < 0) {
    // 右側屈時: 右肩が下がっている（負の値）→ プラスに反転
    degrees = -degrees;
  } else if (imageType === 'left' && degrees > 0) {
    // 左側屈時: 左肩が下がっている（正の値）→ プラスのまま（符号変換不要）
    // ※既に正の値なので何もしない
  } else if (imageType === 'left' && degrees < 0) {
    // 左側屈時: 右肩が下がっている（負の値）→ プラスに反転
    degrees = -degrees;
  }

  console.log('Shoulder angle calculation:', { 
    radians, 
    originalDegrees: radians * (180 / Math.PI),
    adjustedDegrees: degrees,
    imageType 
  });

  return degrees;
}

/**
 * 首の傾き角度を計算
 * 顎の位置を基準として、耳の中点までの角度を計算
 * MediaPipe Holisticの顔メッシュ（468点）が利用可能な場合はより高精度な計算を行う
 * 
 * @param landmarks - MediaPipeのランドマーク配列
 * @returns 首の傾き角度（度）正の値は右傾き、負の値は左傾き
 */
export function calculateNeckTiltAngle(landmarks: Landmark[]): number {
  // MediaPipe Holisticの顔メッシュが利用可能か確認
  console.log('🧮 [DEBUG] calculateNeckTiltAngle called');
  console.log('🧮 [DEBUG] Landmarks received:', landmarks);
  console.log('🧮 [DEBUG] Checking for faceLandmarks...');
  const faceLandmarks = (landmarks as any).faceLandmarks as Landmark[] | undefined;
  console.log('🧮 [DEBUG] faceLandmarks:', faceLandmarks ? `Found (${faceLandmarks.length} points)` : 'Not found');
  
  let chinX: number, chinY: number;
  let earCenterX: number, earCenterY: number;
  
  if (faceLandmarks && faceLandmarks.length >= 468) {
    // MediaPipe Holistic使用時：顔メッシュ468点から高精度に取得
    console.log('✅ [DEBUG] Using MediaPipe Holistic face mesh (468 points) for HIGH PRECISION');
    
    // 顎先のランドマーク（Face Mesh index 152）
    const chinTip = faceLandmarks[152];
    if (!chinTip) {
      throw new Error('顎先ランドマーク（Face Mesh 152）の検出に失敗しました');
    }
    chinX = chinTip.x;
    chinY = chinTip.y;
    
    // 耳の周辺ランドマークから高精度な耳の中点を計算
    // 左耳: index 234 (耳の前), 127 (耳のトップ付近)
    // 右耳: index 454 (耳の前), 356 (耳のトップ付近)
    const leftEarPoints = [faceLandmarks[234], faceLandmarks[127]].filter(p => p);
    const rightEarPoints = [faceLandmarks[454], faceLandmarks[356]].filter(p => p);
    
    if (leftEarPoints.length === 0 || rightEarPoints.length === 0) {
      throw new Error('耳のランドマーク（Face Mesh）の検出に失敗しました');
    }
    
    const leftEarX = leftEarPoints.reduce((sum, p) => sum + p.x, 0) / leftEarPoints.length;
    const leftEarY = leftEarPoints.reduce((sum, p) => sum + p.y, 0) / leftEarPoints.length;
    const rightEarX = rightEarPoints.reduce((sum, p) => sum + p.x, 0) / rightEarPoints.length;
    const rightEarY = rightEarPoints.reduce((sum, p) => sum + p.y, 0) / rightEarPoints.length;
    
    earCenterX = (leftEarX + rightEarX) / 2;
    earCenterY = (leftEarY + rightEarY) / 2;
    
    console.log('High precision landmarks from face mesh:', {
      chinTip: { x: chinX.toFixed(4), y: chinY.toFixed(4) },
      leftEar: { x: leftEarX.toFixed(4), y: leftEarY.toFixed(4) },
      rightEar: { x: rightEarX.toFixed(4), y: rightEarY.toFixed(4) }
    });
  } else {
    // MediaPipe Pose使用時：従来の方法（口の中点で顎を推定）
    console.log('⚠️ [DEBUG] Using MediaPipe Pose (33 points) - STANDARD PRECISION (fallback)');
    
    const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
    const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];
    const mouthLeft = landmarks[POSE_LANDMARKS.MOUTH_LEFT];
    const mouthRight = landmarks[POSE_LANDMARKS.MOUTH_RIGHT];

    // 顎の位置を計算（口の中点）
    if (!mouthLeft || !mouthRight || 
        !mouthLeft.visibility || !mouthRight.visibility ||
        mouthLeft.visibility <= 0.5 || mouthRight.visibility <= 0.5) {
      throw new Error('顎（口）の検出に失敗しました');
    }

    chinX = (mouthLeft.x + mouthRight.x) / 2;
    chinY = (mouthLeft.y + mouthRight.y) / 2;

    // 耳の中点を計算（頭頂部の代表点）
    if (!leftEar || !rightEar || 
        !leftEar.visibility || !rightEar.visibility ||
        leftEar.visibility <= 0.5 || rightEar.visibility <= 0.5) {
      throw new Error('耳の検出に失敗しました');
    }

    earCenterX = (leftEar.x + rightEar.x) / 2;
    earCenterY = (leftEar.y + rightEar.y) / 2;
  }

  // 顎から耳の中点へのベクトルと垂直線のなす角を計算
  const dx = earCenterX - chinX;
  const dy = chinY - earCenterY; // Y軸は下向きなので反転（耳は顎より上）

  // atan2を使用して角度を計算（垂直線からの傾き）
  const radians = Math.atan2(dx, dy);
  const degrees = radians * (180 / Math.PI);

  console.log('Neck tilt angle calculation:', {
    method: faceLandmarks ? 'Holistic (High Precision)' : 'Pose (Standard)',
    chin: { x: chinX.toFixed(3), y: chinY.toFixed(3) },
    earCenter: { x: earCenterX.toFixed(3), y: earCenterY.toFixed(3) },
    dx: dx.toFixed(4), 
    dy: dy.toFixed(4),
    degrees: degrees.toFixed(2) + '°'
  });

  return degrees;
}

/**
 * 正面画像を基準とした側屈角度の計算
 * 
 * @param neutralAngle - 正面時の角度
 * @param tiltAngle - 側屈時の角度
 * @returns 側屈角度（絶対値）
 */
export function calculateLateralFlexionAngle(
  neutralAngle: number,
  tiltAngle: number
): number {
  // 正面からの差分を計算
  const diff = Math.abs(tiltAngle - neutralAngle);
  return diff;
}

/**
 * 角度を度分秒形式でフォーマット
 * 
 * @param degrees - 角度（度）
 * @returns フォーマットされた文字列
 */
export function formatAngle(degrees: number): string {
  const absoluteDegrees = Math.abs(degrees);
  const deg = Math.floor(absoluteDegrees);
  const minFloat = (absoluteDegrees - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60);

  if (min === 0 && sec === 0) {
    return `${deg}°`;
  } else if (sec === 0) {
    return `${deg}°${min}'`;
  }
  return `${deg}°${min}'${sec}"`;
}

/**
 * 2つのランドマーク間の距離を計算
 * 
 * @param landmark1 - ランドマーク1
 * @param landmark2 - ランドマーク2
 * @returns ユークリッド距離
 */
export function calculateDistance(landmark1: Landmark, landmark2: Landmark): number {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  const dz = landmark1.z - landmark2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 3点から角度を計算（頂点を中心とした角度）
 * 
 * @param point1 - 点1
 * @param vertex - 頂点
 * @param point2 - 点2
 * @returns 角度（度）
 */
export function calculateAngleFromThreePoints(
  point1: Landmark,
  vertex: Landmark,
  point2: Landmark
): number {
  // ベクトルを計算
  const vector1 = {
    x: point1.x - vertex.x,
    y: point1.y - vertex.y,
  };
  const vector2 = {
    x: point2.x - vertex.x,
    y: point2.y - vertex.y,
  };

  // 内積を計算
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;

  // ベクトルの大きさを計算
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

  // cosθ = (a・b) / (|a||b|)
  const cosAngle = dotProduct / (magnitude1 * magnitude2);

  // ラジアンから度に変換
  const radians = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  return radians * (180 / Math.PI);
}
