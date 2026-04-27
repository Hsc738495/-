/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Users, 
  Settings2, 
  Shuffle, 
  Copy, 
  RotateCcw, 
  Trash2,
  CheckCircle2,
  UserPlus,
  LayoutGrid,
  Quote,
  Sparkles,
  Download,
  FileText,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type GroupingMode = 'count' | 'size';

interface MeetingDetails {
  topic: string;
  dateTime: string;
  discussion: string;
  conclusion: string;
  nextMeeting: string;
}

interface GroupResult {
  members: string[];
  quote: string;
  details: MeetingDetails;
}

const MOTIVATIONAL_QUOTES = [
  "卓越源於合作，成功起於細節。",
  "團結就是力量，攜手共創輝煌。",
  "每一次的碰撞，都是創意的火花。",
  "齊心協力，沒有解決不了的難題。",
  "相信隊友，發揮你的無限可能。",
  "合作無間，共赴錦繡前程。",
  "心往一處想，勁往一處使。",
  "聚是一團火，散是滿天星。",
  "互助互學，共同進步。",
  "擁抱驚喜，創造專屬你們的奇蹟。",
  "集思廣益，共贏未來。",
  "勇於探索，團隊的極限由你們定義。"
];

const DEFAULT_STAFF: Record<string, string> = {
  '淑貞': '0001',
  '馨琳': '0002',
  '文慈': '0003',
  '虹瑤': '0004',
  '靜芬': '0005',
  '玉玲': '0006'
};

const DEFAULT_NAMES = Object.keys(DEFAULT_STAFF).join('\n');

const DEFAULT_DETAILS: MeetingDetails = {
  topic: '',
  dateTime: '',
  discussion: '',
  conclusion: '',
  nextMeeting: ''
};

export default function App() {
  const [inputText, setInputText] = useState(DEFAULT_NAMES);
  const [mode, setMode] = useState<GroupingMode>('count');
  const [value, setValue] = useState(2);
  const [results, setResults] = useState<GroupResult[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const getStaffId = (name: string) => DEFAULT_STAFF[name] || 'N/A';

  const participants = useMemo(() => {
    return inputText
      .split(/[\n,，]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }, [inputText]);

  const handleGroup = useCallback(() => {
    if (participants.length === 0) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const groups: string[][] = [];

    if (mode === 'count') {
      const numGroups = Math.max(1, value);
      for (let i = 0; i < numGroups; i++) {
        groups.push([]);
      }
      shuffled.forEach((person, index) => {
        groups[index % numGroups].push(person);
      });
    } else {
      const perGroup = Math.max(1, value);
      for (let i = 0; i < shuffled.length; i += perGroup) {
        groups.push(shuffled.slice(i, i + perGroup));
      }
    }

    const now = new Date().toLocaleString('zh-TW', { hour12: false });
    const finalGroups = groups
      .filter(g => g.length > 0)
      .map(members => ({
        members,
        quote: MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
        details: { ...DEFAULT_DETAILS, dateTime: now }
      }));

    setResults(finalGroups);
    setEditingIndex(null);
  }, [participants, mode, value]);

  const handleCopy = async () => {
    const text = results
      .map((group, i) => {
        const d = group.details;
        const memberList = group.members
          .map(name => `  - ${name} (工號: ${getStaffId(name)}) [簽名: ________]`)
          .join('\n');
          
        return `【第 ${i + 1} 組：${d.topic || '未命名主題'}】
✨ 鼓舞語錄：${group.quote}
👥 組員名單與簽到：\n${memberList}
📅 時間日期：${d.dateTime}
📝 討論內容：${d.discussion || '無'}
💡 最終結論：${d.conclusion || '無'}
🚀 下次會議：${d.nextMeeting || '未定'}`;
      })
      .join('\n\n' + '='.repeat(30) + '\n\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const exportToFile = () => {
    const data = {
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      results,
      participants
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `分組會議紀錄_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.results) setResults(data.results);
        if (data.participants) setInputText(data.participants.join('\n'));
      } catch (err) {
        alert('檔案格式錯誤，請匯入由本工具匯出的 JSON 文件。');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const updateDetails = (index: number, newDetails: Partial<MeetingDetails>) => {
    const updated = [...results];
    updated[index].details = { ...updated[index].details, ...newDetails };
    setResults(updated);
  };

  const clearAll = () => {
    if (confirm('確定要清除所有分組及名單資料嗎？')) {
      setInputText('');
      setResults([]);
      setEditingIndex(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 shadow-sm z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">智能分組助手</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-all flex items-center gap-2">
            <FileText size={16} className="text-indigo-500" />
            匯入文件
            <input type="file" accept=".json" onChange={importFromFile} className="hidden" />
          </label>
          <button 
            onClick={exportToFile}
            disabled={results.length === 0}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-30 flex items-center gap-2 group"
          >
            <Download size={16} className="text-indigo-500 group-hover:translate-y-0.5 transition-transform" />
            輸出文件
          </button>
          <div className="w-px h-6 bg-slate-200 mx-2" />
          <button 
            onClick={clearAll}
            className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-600 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            清空
          </button>
          <button 
            onClick={handleGroup}
            disabled={participants.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50 disabled:shadow-none active:scale-95 flex items-center gap-2 ml-2"
          >
            <Shuffle size={16} />
            隨機分組
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-84 border-r border-slate-200 bg-white flex flex-col p-6 shrink-0 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
          <div className="mb-8">
            <label className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
              <span className="flex items-center gap-2"><UserPlus size={14} className="text-slate-300" /> 成員清單錄入</span>
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100">{participants.length}</span>
            </label>
            <div className="relative group">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-56 p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-slate-300 font-medium leading-relaxed group-hover:border-slate-300" 
                placeholder="輸入姓名，每行一個或用逗號分隔..."
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
              <Settings2 size={14} className="text-slate-300" /> 分組引擎設置
            </label>
            <div className="space-y-5">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">分組優先級</p>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-inner">
                  <button
                    onClick={() => setMode('count')}
                    className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                      mode === 'count' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    組數優先
                  </button>
                  <button
                    onClick={() => setMode('size')}
                    className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                      mode === 'size' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    人數優先
                  </button>
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {mode === 'count' ? '目標總組數' : '每組期望人數'}
                  </p>
                  <span className="text-lg font-black text-indigo-600 font-mono">{value}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="range" 
                    min="1" 
                    max={Math.max(2, participants.length)} 
                    value={value}
                    onChange={(e) => setValue(parseInt(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] space-y-1">
              <p>最後生成: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p>v1.2.0 • PRO MODULE</p>
            </div>
            <Sparkles size={16} className="text-slate-100" />
          </div>
        </aside>

        {/* Results Area */}
        <section className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 relative">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-3">
                <LayoutGrid size={14} className="text-indigo-400" /> 分組會議紀錄儀表板
              </h2>
              {results.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
                  >
                    {isCopied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {isCopied ? '複製成功' : '複製全部紀錄'}
                  </button>
                </div>
              )}
            </div>

            {results.length === 0 ? (
              <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center text-slate-300 animate-pulse">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
                  <FileText size={48} className="opacity-10 text-indigo-500" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-black text-slate-400 tracking-tight">尚未生成任何分組</p>
                  <p className="text-sm font-bold text-slate-300 tracking-wider">請在左側錄入名單並啟動分組引擎</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 pb-12">
                <AnimatePresence mode="popLayout">
                  {results.map((group, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col group hover:border-indigo-400 transition-all duration-500"
                    >
                      <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/20 flex justify-between items-center group-hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-5">
                          <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-100">
                            #{index + 1}
                          </span>
                          <div>
                            <h3 className="font-black text-lg text-slate-800 flex items-center gap-3">
                              {group.details.topic || `第 ${index + 1} 小組`}
                              <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-widest">
                                {group.members.length} 成員
                              </span>
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">系統分配時間：{group.details.dateTime}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          className={`px-5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                            editingIndex === index 
                              ? 'bg-indigo-600 text-white shadow-indigo-100' 
                              : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                          }`}
                        >
                          <FileText size={14} className={editingIndex === index ? 'animate-pulse' : ''} />
                          {editingIndex === index ? '確認並關閉' : '撰寫會議紀錄'}
                          {editingIndex === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                          {group.members.map((name, i) => (
                            <div 
                              key={i} 
                              className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1 hover:bg-white hover:border-indigo-200 transition-all cursor-default"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-slate-800">{name}</span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-md">ID: {getStaffId(name)}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">簽名欄</span>
                                <div className="w-16 h-px bg-slate-200" />
                              </div>
                            </div>
                          ))}
                        </div>

                        <AnimatePresence>
                          {editingIndex === index && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100 mb-6">
                                <div className="space-y-5">
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5">
                                      小組目標 / 主題命名
                                    </label>
                                    <input 
                                      type="text" 
                                      value={group.details.topic}
                                      onChange={(e) => updateDetails(index, { topic: e.target.value })}
                                      className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                                      placeholder="請輸入本組討論核心..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5">
                                      會議召開時間
                                    </label>
                                    <input 
                                      type="text" 
                                      value={group.details.dateTime}
                                      onChange={(e) => updateDetails(index, { dateTime: e.target.value })}
                                      className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5">
                                      下次會議預定
                                    </label>
                                    <input 
                                      type="text" 
                                      value={group.details.nextMeeting}
                                      onChange={(e) => updateDetails(index, { nextMeeting: e.target.value })}
                                      className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                                      placeholder="例如：2024年6月初"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-5">
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 text-indigo-500">
                                      核心討論內容
                                    </label>
                                    <textarea 
                                      value={group.details.discussion}
                                      onChange={(e) => updateDetails(index, { discussion: e.target.value })}
                                      className="w-full h-32 p-4 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all font-bold leading-relaxed"
                                      placeholder="詳細記錄成員提出的觀點與爭議點..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 text-emerald-500">
                                      最終共識與結論
                                    </label>
                                    <textarea 
                                      value={group.details.conclusion}
                                      onChange={(e) => updateDetails(index, { conclusion: e.target.value })}
                                      className="w-full h-32 p-4 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none transition-all font-bold leading-relaxed"
                                      placeholder="總結會議的行動清單或最終定案..."
                                    />
                                  </div>
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                  <button 
                                    onClick={() => setEditingIndex(null)}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                  >
                                    <Save size={16} />
                                    儲存所有變更
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {editingIndex !== index && (
                          <div className="space-y-6">
                            <div className="flex items-start gap-4">
                              <span className="p-2 bg-indigo-50 rounded-xl text-indigo-400 shrink-0">
                                <Quote size={18} />
                              </span>
                              <p className="text-sm italic font-black text-slate-500 leading-[1.8] tracking-wide">
                                {group.quote}
                              </p>
                            </div>
                            
                            {(group.details.topic || group.details.conclusion) && (
                              <div className="pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">目前記錄主題</p>
                                  <p className="text-sm font-black text-slate-700 truncate">{group.details.topic || '未設定主題'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">下次開會排程</p>
                                  <p className="text-sm font-black text-indigo-600">{group.details.nextMeeting || '暫無排程'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">會議紀錄狀態</p>
                                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full ${
                                    group.details.conclusion 
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                                  }`}>
                                    {group.details.conclusion ? '已完成結論 ✅' : '待補充紀錄 📝'}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {!group.details.topic && !editingIndex && (
                              <button 
                                onClick={() => setEditingIndex(index)}
                                className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 font-bold text-xs hover:border-indigo-100 hover:text-indigo-400 hover:bg-indigo-50/10 transition-all"
                              >
                                + 開始為此小組填寫會議紀錄
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
