"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // بيطبع الخطأ في الكونسول (لو كنت فاتح من كمبيوتر)
    console.error("💥 الكراش حصل هنا:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-red-50 p-6 text-left" dir="ltr">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border-2 border-red-500">
        <h2 className="text-2xl font-bold text-red-700 mb-4">🚨 كراش في التطبيق!</h2>
        
        <p className="text-gray-700 font-bold mb-2">رسالة الخطأ (صور دي أو انسخها):</p>
        <div className="bg-gray-950 text-red-400 p-4 rounded-xl overflow-auto text-sm font-mono mb-4 border border-gray-800">
          {error.message}
        </div>

        <p className="text-gray-700 font-bold mb-2">مكان المشكلة (Stack Trace):</p>
        <div className="bg-gray-950 text-gray-400 p-4 rounded-xl overflow-auto text-xs font-mono max-h-64 border border-gray-800">
          {error.stack}
        </div>

        <button
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-red-600 px-4 py-3 text-white font-bold hover:bg-red-700 w-full transition-colors"
        >
          🔄 حاول تفتح الصفحة تاني
        </button>
      </div>
    </div>
  );
}
