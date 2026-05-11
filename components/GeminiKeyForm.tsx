'use client';

import { useState } from 'react';
import { saveGeminiKeyAction, deleteGeminiKeyAction } from '@/app/actions/user-actions';

interface Props {
  hasKey: boolean;
  maskedKey: string | null;
}

export default function GeminiKeyForm({ hasKey, maskedKey }: Props) {
  const [isOpen, setIsOpen] = useState(!hasKey);
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!inputKey.trim()) { setError('API ключди киргизиңиз.'); return; }
    setLoading(true);
    try {
      await saveGeminiKeyAction(inputKey.trim());
      setSuccess('API ключ ийгиликтүү сакталды!');
      setInputKey('');
      setIsOpen(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      setError(e.message || 'Ката кетти.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('API ключти өчүрөсүзбү? AI функциялар иштебей калат.')) return;
    setLoading(true);
    try {
      await deleteGeminiKeyAction();
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-violet-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            🤖
          </div>
          <div>
            <p className="font-bold text-violet-900 text-sm">Gemini AI</p>
            <p className="text-xs text-violet-600 mt-0.5">
              {hasKey ? `Ключ сакталган: ${maskedKey}` : 'API ключ кошулган жок'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasKey && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold border border-green-200">
              Активдүү
            </span>
          )}
          <span className="text-violet-400 text-lg">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-violet-200/60">
          <div className="pt-4">
            <div className="bg-white/70 border border-violet-100 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-violet-900 mb-1">Gemini API ключу деген эмне?</p>
              <p className="text-xs text-violet-700 leading-relaxed">
                Google Gemini AI сөздөрдү автоматтык түрдө генерациялоо үчүн ключ керек.
                Бекер алуу үчүн Google AI Studio'го өтүңүз.
              </p>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <span>🔑</span>
                Google AI Studio'дон бекер ключ алуу →
              </a>
            </div>

            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium flex items-center gap-2">
                <span>✅</span>
                <span>{success}</span>
              </div>
            )}

            <label className="block text-sm font-semibold text-violet-900 mb-2">
              {hasKey ? 'Жаңы API ключ (алмаштыруу үчүн)' : 'Gemini API ключуңузду жазыңыз'}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 pr-12 bg-white border border-violet-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-violet-400 focus:outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-600 text-lg"
                title={showKey ? 'Жашыруу' : 'Көрүү'}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-violet-500 mt-1.5">
              Ключ шифрленип сакталат жана башкаларга көрсөтүлбөйт
            </p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                disabled={loading || !inputKey.trim()}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>💾 Сактоо</>
                )}
              </button>
              {hasKey && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                  title="Ключти өчүрүү"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
