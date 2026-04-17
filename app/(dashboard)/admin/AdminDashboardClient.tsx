'use client';

import { useState } from 'react';

type AdminDashboardClientProps = {
  users: any[];
  gameResults: any[];
};

export default function AdminDashboardClient({ users, gameResults }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'results'>('users');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  const toggleUser = (userId: string) => {
    setExpandedUserId(prev => prev === userId ? null : userId);
  };

  const toggleResult = (resultId: string) => {
    setExpandedResultId(prev => prev === resultId ? null : resultId);
  };

  return (
    <div className="mt-8">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6">
        <button 
          className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Колдонуучулар
        </button>
        <button 
          className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'results' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          onClick={() => setActiveTab('results')}
        >
          Оюн Жыйынтыктары
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
        {activeTab === 'users' && (
          <div className="flex flex-col">
            {users.map(user => (
              <div key={user.id} className="border-b border-slate-100 last:border-0">
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => toggleUser(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm uppercase">
                      {user.name ? user.name.slice(0, 2) : (user.email ? user.email.slice(0, 2) : 'U')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{user.name || 'Аты жок'}</h3>
                      <p className="text-xs text-slate-500">{user.email || 'Email жок'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0 text-sm">
                    <div className="flex flex-col items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                      <span className="font-bold">{user._count.themes}</span>
                      <span className="text-[10px] uppercase">Тема</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1 bg-green-50 text-green-700 rounded-lg">
                      <span className="font-bold">{user._count.games}</span>
                      <span className="text-[10px] uppercase">Оюн</span>
                    </div>
                    <span className="text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${expandedUserId === user.id ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>

                {expandedUserId === user.id && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <h4 className="text-sm font-semibold mb-3 text-slate-700">Кошкон темалары:</h4>
                    {user.themes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {user.themes.map((theme: any) => (
                          <div key={theme.id} className="bg-white p-3 rounded-xl border border-slate-200">
                            <p className="font-medium text-slate-800 text-sm truncate">{theme.title}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${theme.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {theme.status}
                              </span>
                              <span className="text-xs text-slate-500">{theme._count.words} сөз</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Бир да тема кошо элек</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="flex flex-col">
            {gameResults.map(result => (
              <div key={result.id} className="border-b border-slate-100 last:border-0">
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => toggleResult(result.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm uppercase">
                      {result.player_or_team_name?.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{result.player_or_team_name}</h3>
                      <p className="text-xs text-slate-500">
                        Тема: {result.theme?.title || 'Белгисиз'} | Убакыт: {new Date(result.played_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0 text-sm">
                    <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded-md font-bold">Упай: {result.score}</span>
                    <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 rounded-md font-bold">Ката: {result.mistakes_count}</span>
                    <span className="text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${expandedResultId === result.id ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>

                {expandedResultId === result.id && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <h4 className="text-sm font-semibold mb-3 text-slate-700">Жооптор тору (Тарых):</h4>
                    <div className="bg-white border text-sm border-slate-200 rounded-lg p-3 max-h-60 overflow-y-auto font-mono whitespace-pre-wrap text-slate-600">
                      {(() => {
                        try {
                          const history = JSON.parse(result.history);
                          if (!history || history.length === 0) return 'Маалымат жок';
                          return history.map((h: any, i: number) => (
                            <div key={i} className={`flex gap-2 p-1 rounded ${h.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                              <span>{i + 1}.</span>
                              <span className="font-semibold">{h.word?.word || '?'}</span>
                              <span className="text-slate-400">-&gt;</span>
                              <span>{h.guess || '(бош)'}</span>
                              <span>{h.isCorrect ? '✓' : '✗'}</span>
                            </div>
                          ));
                        } catch (e) {
                          return result.history;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {gameResults.length === 0 && (
              <div className="p-8 text-center text-slate-500">Бир да оюн жыйынтыгы жок</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
