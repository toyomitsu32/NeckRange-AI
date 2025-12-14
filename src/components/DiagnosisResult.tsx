import React from 'react';
import { DiagnosisResult as DiagnosisResultType } from '../types/pose';
import {
  getFlexibilityLabel,
  getFlexibilityColor,
  getAsymmetryLabel,
  getAsymmetryColor,
} from '../utils/validationUtils';

interface DiagnosisResultProps {
  result: DiagnosisResultType;
  onReset: () => void;
}

export const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ result, onReset }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        📊 診断結果
      </h2>

      {/* 角度測定結果 */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* 右側屈 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
          <h3 className="text-xl font-semibold mb-4 text-blue-900">右側屈</h3>
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {result.rightAngle.toFixed(1)}°
            </div>
            <div className={`text-lg font-semibold ${getFlexibilityColor(result.rightFlexibility)}`}>
              {getFlexibilityLabel(result.rightFlexibility)}
            </div>
          </div>
        </div>

        {/* 左側屈 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
          <h3 className="text-xl font-semibold mb-4 text-green-900">左側屈</h3>
          <div className="text-center">
            <div className="text-5xl font-bold text-green-600 mb-2">
              {result.leftAngle.toFixed(1)}°
            </div>
            <div className={`text-lg font-semibold ${getFlexibilityColor(result.leftFlexibility)}`}>
              {getFlexibilityLabel(result.leftFlexibility)}
            </div>
          </div>
        </div>
      </div>

      {/* 左右差の評価 */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-purple-900">左右のバランス</h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            差: {result.asymmetryDiff.toFixed(1)}°
          </div>
          <div className={`text-lg font-semibold ${getAsymmetryColor(result.asymmetry)}`}>
            {getAsymmetryLabel(result.asymmetry)}
          </div>
        </div>
      </div>

      {/* 柔軟性の基準表 */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">📏 評価基準</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2 text-gray-700">可動域の評価</h4>
            <ul className="space-y-1 text-gray-600">
              <li className="flex justify-between">
                <span>硬い:</span>
                <span className="font-medium">30°未満</span>
              </li>
              <li className="flex justify-between">
                <span>やや硬い:</span>
                <span className="font-medium">30°〜40°</span>
              </li>
              <li className="flex justify-between">
                <span>普通:</span>
                <span className="font-medium">40°〜50°</span>
              </li>
              <li className="flex justify-between">
                <span>柔軟:</span>
                <span className="font-medium">50°以上</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-gray-700">左右差の評価</h4>
            <ul className="space-y-1 text-gray-600">
              <li className="flex justify-between">
                <span>正常:</span>
                <span className="font-medium">5°未満</span>
              </li>
              <li className="flex justify-between">
                <span>軽度:</span>
                <span className="font-medium">5°〜10°</span>
              </li>
              <li className="flex justify-between">
                <span>中等度:</span>
                <span className="font-medium">10°〜15°</span>
              </li>
              <li className="flex justify-between">
                <span>顕著:</span>
                <span className="font-medium">15°以上</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 推奨事項 */}
      <div className="bg-yellow-50 rounded-lg p-6 mb-8 border-2 border-yellow-200">
        <h3 className="text-xl font-semibold mb-4 text-yellow-900 flex items-center">
          💡 推奨事項
        </h3>
        <ul className="space-y-3">
          {result.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start">
              <span className="text-yellow-600 mr-2 mt-1">•</span>
              <span className="text-gray-700">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 注意事項 */}
      <div className="bg-red-50 rounded-lg p-6 mb-8 border-2 border-red-200">
        <h3 className="text-lg font-semibold mb-3 text-red-900 flex items-center">
          ⚠️ 注意事項
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          この診断はあくまで簡易的なものであり、医学的診断に代わるものではありません。
          痛みや異常を感じる場合は、必ず医療機関を受診してください。
        </p>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={onReset}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          🔄 再測定する
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          🖨️ 結果を印刷
        </button>
      </div>
    </div>
  );
};
