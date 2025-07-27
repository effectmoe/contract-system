'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, RotateCcw, Check, X } from 'lucide-react';

interface SignatureCaptureProps {
  onSign: (signatureDataUrl: string) => void;
  onCancel: () => void;
  partyName: string;
}

export default function SignatureCapture({ 
  onSign, 
  onCancel, 
  partyName 
}: SignatureCaptureProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Resize canvas to fit container
    const resizeCanvas = () => {
      if (sigCanvas.current) {
        const canvas = sigCanvas.current.getCanvas();
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleBegin = () => {
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const handleSign = () => {
    if (sigCanvas.current && !isEmpty) {
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      onSign(dataUrl);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          電子署名
        </h3>
        <p className="text-gray-600">
          {partyName}様、以下の枠内にご署名ください
        </p>
      </div>

      {/* Signature Canvas */}
      <div className="relative mb-4">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={handleClear}
            className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            title="クリア"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="border-2 border-gray-300 rounded-lg bg-gray-50 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isEmpty && (
              <div className="text-gray-400 flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                <span>ここに署名してください</span>
              </div>
            )}
          </div>

          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: 'w-full h-48 cursor-crosshair',
              style: { width: '100%', height: '192px' }
            }}
            backgroundColor="transparent"
            penColor="black"
            minWidth={1}
            maxWidth={3}
            onBegin={handleBegin}
            onEnd={handleEnd}
          />
        </div>

        {/* Signature line */}
        <div className="absolute bottom-8 left-8 right-8 border-b-2 border-gray-400"></div>
      </div>

      {/* Legal notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          この署名は法的拘束力を持つ電子署名として扱われます。
          署名することで、契約内容に同意したものとみなされます。
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSign}
          disabled={isEmpty}
          className="btn-primary flex items-center gap-2 flex-1"
        >
          <Check className="w-4 h-4" />
          署名を確定
        </button>
        
        <button
          onClick={onCancel}
          className="btn-secondary flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          キャンセル
        </button>
      </div>

      {/* Status indicator */}
      {isDrawing && (
        <div className="mt-2 text-center text-sm text-gray-500">
          署名中...
        </div>
      )}
    </div>
  );
}