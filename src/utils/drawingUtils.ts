import { Landmark, POSE_LANDMARKS } from '../types/pose';

/**
 * Canvas上にランドマークを描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param landmarks - MediaPipeのランドマーク配列
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number
): void {
  ctx.fillStyle = '#00ff00';
  
  landmarks.forEach((landmark, index) => {
    // 重要なランドマークのみを描画
    const importantIndices = [
      POSE_LANDMARKS.NOSE,
      POSE_LANDMARKS.LEFT_EYE,
      POSE_LANDMARKS.RIGHT_EYE,
      POSE_LANDMARKS.LEFT_EAR,
      POSE_LANDMARKS.RIGHT_EAR,
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
    ];

    if (importantIndices.includes(index)) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

/**
 * Canvas上に骨格線（スケルトン）を描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param landmarks - MediaPipeのランドマーク配列
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number
): void {
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;

  // 描画する接続線
  const connections = [
    [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_EYE],
    [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_EYE],
    [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EAR],
    [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EAR],
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  ];

  connections.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    if (start && end) {
      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.stroke();
    }
  });
}

/**
 * 肩の水平線を描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param landmarks - MediaPipeのランドマーク配列
 * @param width - Canvas幅
 * @param height - Canvas高さ
 * @param isValid - 肩が水平かどうか
 */
export function drawShoulderLine(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  isValid: boolean
): void {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  if (!leftShoulder || !rightShoulder) return;

  ctx.strokeStyle = isValid ? '#00ff00' : '#ff0000';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.moveTo(leftShoulder.x * width, leftShoulder.y * height);
  ctx.lineTo(rightShoulder.x * width, rightShoulder.y * height);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * 首の傾き角度線を描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param landmarks - MediaPipeのランドマーク配列
 * @param width - Canvas幅
 * @param height - Canvas高さ
 * @param angle - 角度
 */
export function drawNeckAngleLine(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  angle: number
): void {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const nose = landmarks[POSE_LANDMARKS.NOSE];

  if (!leftShoulder || !rightShoulder || !nose) return;

  // 両肩の中点を計算
  const midX = ((leftShoulder.x + rightShoulder.x) / 2) * width;
  const midY = ((leftShoulder.y + rightShoulder.y) / 2) * height;
  const noseX = nose.x * width;
  const noseY = nose.y * height;

  // 中点から鼻への線を描画
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.lineTo(noseX, noseY);
  ctx.stroke();

  // 垂直線を描画（参照用）
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.lineTo(midX, midY - 100);
  ctx.stroke();
  ctx.setLineDash([]);

  // 角度テキストを描画
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`${angle.toFixed(1)}°`, midX + 10, midY - 50);
}

/**
 * 撮影ガイドラインオーバーレイを描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function drawGuideline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // 顔の位置ガイド（楕円）
  const faceGuideX = width / 2;
  const faceGuideY = height * 0.3;
  const faceGuideRadiusX = width * 0.15;
  const faceGuideRadiusY = height * 0.2;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  
  ctx.beginPath();
  ctx.ellipse(faceGuideX, faceGuideY, faceGuideRadiusX, faceGuideRadiusY, 0, 0, 2 * Math.PI);
  ctx.stroke();

  // 肩の位置ガイド（水平線）
  const shoulderY = height * 0.5;
  ctx.beginPath();
  ctx.moveTo(width * 0.2, shoulderY);
  ctx.lineTo(width * 0.8, shoulderY);
  ctx.stroke();

  ctx.setLineDash([]);

  // ガイドテキスト
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('顔をここに合わせてください', faceGuideX, faceGuideY - faceGuideRadiusY - 10);
  ctx.fillText('肩のラインを水平に', faceGuideX, shoulderY + 30);
}

/**
 * エラーメッセージをCanvas上に描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param message - メッセージ
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function drawErrorMessage(
  ctx: CanvasRenderingContext2D,
  message: string,
  width: number,
  height: number
): void {
  // 半透明の背景
  ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
  ctx.fillRect(0, height - 80, width, 80);

  // エラーメッセージ
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(message, width / 2, height - 45);
}

/**
 * 成功メッセージをCanvas上に描画
 * 
 * @param ctx - Canvasコンテキスト
 * @param message - メッセージ
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function drawSuccessMessage(
  ctx: CanvasRenderingContext2D,
  message: string,
  width: number,
  height: number
): void {
  // 半透明の背景
  ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
  ctx.fillRect(0, height - 60, width, 60);

  // 成功メッセージ
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(message, width / 2, height - 30);
}

/**
 * Canvas全体をクリア
 * 
 * @param ctx - Canvasコンテキスト
 * @param width - Canvas幅
 * @param height - Canvas高さ
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
}
