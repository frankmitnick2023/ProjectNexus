import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, Auth, User, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, Firestore } from 'firebase/firestore';
import { 
  Layout, Plus, Search, Cloud, Settings, LogOut, 
  CreditCard, Loader2, Sparkles, Folder, 
  Bell, Command, ChevronRight, MoreHorizontal,
  Calendar, CheckCircle2, Circle, ArrowLeft, BrainCircuit
} from 'lucide-react';

// ==============================================================================
// 1. 🟢 配置区域 (引擎核心)
// ==============================================================================
const MANUAL_CONFIG = {
  // ⚠️ 确保填入你的 API Key
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58",
  authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" 
};

declare global {
  interface Window { __firebase_config?: string; __app_id?: string; __initial_auth_token?: string; }
}

// ==============================================================================
// 2. 🧩 积木式数据结构模拟 (为了演示功能)
// ==============================================================================
type Project = {
  id: string;
  title: string;
  description: string;
  progress: number;
  updatedAt: string;
  members: string[]; // 模拟团队成员头像颜色
  modules: Module[]; // 积木模块
};

type Module = {
  id: string;
  title: string;
  isCompleted: boolean;
  timeEstimate: string; // 碎片化时间估算
};

// 模拟数据
const DEMO_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'iOS 电商应用开发',
    description: '为客户构建的高端时尚购物 App，包含支付和 AR 试穿功能。',
    progress: 65,
    updatedAt: '2小时前',
    members: ['bg-blue-500', 'bg-pink-500', 'bg-yellow-500'],
    modules: [
      { id: 'm1', title: '用户登录与注册 UI', isCompleted: true, timeEstimate: '2h' },
      { id: 'm2', title: 'Stripe 支付接口对接', isCompleted: true, timeEstimate: '4h' },
      { id: 'm3', title: '商品详情页布局', isCompleted: false, timeEstimate: '3h' },
      { id: 'm4', title: 'AR 摄像头权限配置', isCompleted: false, timeEstimate: '1h' },
    ]
  },
  {
    id: '2',
    title: '公司内部 CRM 系统',
    description: '销售团队使用的客户管理后台。',
    progress: 30,
    updatedAt: '1天前',
    members: ['bg-green-500', 'bg-purple-500'],
    modules: [
      { id: 'crm1', title: '数据库架构设计', isCompleted: true, timeEstimate: '5h' },
      { id: 'crm2', title: '仪表盘图表组件', isCompleted: false, timeEstimate: '3h' },
    ]
  }
];

// ==============================================================================
// 3. 🎨 UI 组件区域
// ==============================================================================

// --- 侧边栏 ---
const Sidebar = ({ user, currentView, setView }: any) => (
  <div className="w-72 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 flex-shrink-0 hidden md:flex">
    <div className="p-6 flex items-center gap-3 text-white">
      <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
        <Layout size={22} className="text-white" />
      </div>
      <div>
        <h1 className="font-bold text-lg tracking-tight leading-none">Project Nexus</h1>
        <p className="text-[10px] text-indigo-300 font-medium tracking-wider mt-1 opacity-80">WORKSPACE</p>
      </div>
    </div>

    <div className="px-5 mb-6">
      <div className="relative group">
        <Search className="absolute left-3 top-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
        <input type="text" placeholder="快速查找..." className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-slate-800 text-slate-200" />
      </div>
    </div>

    <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
      <div className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Menu</div>
      <MenuItem icon={<Folder size={18} />} label="我的项目库" active={currentView === 'dashboard'} onClick={() => setView('dashboard')} count={DEMO_PROJECTS.length} />
      <MenuItem icon={<Cloud size={18} />} label="团队协作" />
      <MenuItem icon={<BrainCircuit size={18} />} label="AI 创意工坊" />
      
      <div className="mt-6 px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">System</div>
      <MenuItem icon={<Settings size={18} />} label="设置" />
      <MenuItem icon={<CreditCard size={18} />} label="订阅管理" />
    </nav>

    <div className="p-4 border-t border-slate-800/60 bg-[#0B1120]">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-4 mb-4 relative overflow-hidden cursor-pointer shadow-lg group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20"><Sparkles size={60} /></div>
        <h3 className="text-white font-bold text-sm flex items-center gap-2 relative z-10"><Sparkles size={14} /> 升级到 Pro</h3>
        <p className="text-indigo-100 text-xs mt-1 relative z-10">解锁无限项目与 AI 助手。</p>
      </div>
      
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm border border-slate-600">
          {user ? user.uid.slice(0, 1).toUpperCase() : <Loader2 size={14} className="animate-spin" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">{user ? 'Team Leader' : '连接中...'}</div>
          <div className="text-xs text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow"></span>在线</div>
        </div>
      </div>
    </div>
  </div>
);

const MenuItem = ({ icon, label, active, count, onClick }: any) => (
  <div onClick={onClick} className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${active ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}>
    <div className="flex items-center gap-3">{icon}<span className="text-sm font-medium">{label}</span></div>
    {count !== undefined && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{count}</span>}
  </div>
);

// --- 核心：主内容区域 (支持视图切换) ---
const MainContent = ({ user }: { user: User | null }) => {
  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 打开项目详情
  const openProject = (p: Project) => {
    setActiveProject(p);
    setView('detail');
  };

  // 模拟 AI 生成
  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowAIModal(false);
      alert("AI 已为你生成项目结构！(模拟成功)");
      // 这里未来会连接真实的 Gemini API
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar user={user} currentView={view} setView={setView} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white relative">
        {/* 顶部栏 */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {view === 'detail' && (
              <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
             <h2 className="text-lg font-bold text-slate-800">{view === 'dashboard' ? '概览' : activeProject?.title}</h2>
             <span className="text-slate-300 text-sm">/</span>
             <span className="text-slate-500 text-sm">{view === 'dashboard' ? '我的项目库' : '任务积木板'}</span>
          </div>
          <div className="flex items-center gap-3">
             <button className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={16} /></button>
             <button onClick={() => setShowAIModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg">
                <Plus size={16} /> 新建项目
             </button>
          </div>
        </header>

        {/* 内容画布 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
          <div className="max-w-6xl mx-auto">
            
            {/* 视图 1: 仪表盘 (Dashboard) */}
            {view === 'dashboard' && (
              <>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">欢迎回来, Leader</h1>
                    <p className="text-slate-500">你有 2 个正在进行的项目，共计 12 个待办模块。</p>
                  </div>
                  <div className="text-right hidden md:block">
                     <p className="text-sm text-slate-400">本周效率</p>
                     <p className="text-2xl font-bold text-emerald-500">+24%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* AI 快速入口卡片 */}
                  <div 
                    onClick={() => setShowAIModal(true)}
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl hover:shadow-indigo-200 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Sparkles size={24} />
                      </div>
                      <h3 className="font-bold text-xl mb-2">AI 创意生成器</h3>
                      <p className="text-indigo-100 text-sm opacity-90 leading-relaxed">
                        不知道如何开始？输入你的想法，AI 帮你把大项目拆解成小积木。
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-sm font-medium bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      <BrainCircuit size={16} /> 点击尝试
                    </div>
                  </div>

                  {/* 渲染项目列表 */}
                  {DEMO_PROJECTS.map(project => (
                    <div key={project.id} onClick={() => openProject(project)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">进行中</span>
                          <MoreHorizontal size={20} className="text-slate-300 group-hover:text-slate-500" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-6">{project.description}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span>进度 {project.progress}%</span>
                          <span>{project.updatedAt}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <div className="flex items-center -space-x-2">
                          {project.members.map((color, idx) => (
                            <div key={idx} className={`w-8 h-8 rounded-full border-2 border-white ${color} flex items-center justify-center text-white text-xs shadow-sm`}>
                              {idx + 1}
                            </div>
                          ))}
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-400 text-xs hover:bg-slate-200 cursor-pointer">
                            <Plus size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 视图 2: 项目详情 (积木拆解模式) */}
            {view === 'detail' && activeProject && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* 左侧：积木任务列表 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                        <Folder className="text-indigo-500" size={24}/> 
                        任务积木 
                        <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">{activeProject.modules.length}</span>
                      </h3>
                      <button className="text-indigo-600 text-sm font-medium hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Plus size={16} /> 添加积木
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeProject.modules.map(module => (
                        <div key={module.id} className={`p-4 rounded-xl border transition-all flex items-center gap-4 ${module.isCompleted ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'}`}>
                          <button className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${module.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-indigo-400 text-transparent'}`}>
                             <CheckCircle2 size={14} strokeWidth={3} />
                          </button>
                          <div className="flex-1">
                            <h4 className={`font-medium ${module.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{module.title}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12}/> 预计耗时: {module.timeEstimate}</span>
                              <span className="text-xs text-slate-400 flex items-center gap-1"><Circle size={8} fill={module.isCompleted ? '#22c55e' : '#f59e0b'} className={module.isCompleted ? 'text-green-500' : 'text-amber-500'} /> {module.isCompleted ? '已完成' : '待处理'}</span>
                            </div>
                          </div>
                          {!module.isCompleted && (
                            <button className="text-slate-400 hover:text-indigo-600 p-2"><ChevronRight size={20} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 右侧：项目概览与团队 */}
                  <div className="w-full md:w-80 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">项目进度</h4>
                      <div className="flex items-center justify-center relative w-32 h-32 mx-auto mb-4">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle cx="64" cy="64" r="60" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                          <circle cx="64" cy="64" r="60" stroke="#6366f1" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * activeProject.progress) / 100} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-2xl font-bold text-slate-800">{activeProject.progress}%</span>
                      </div>
                      <p className="text-center text-xs text-slate-500">已完成 2/4 个关键里程碑</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">协作团队</h4>
                        <button className="text-xs text-indigo-600 font-bold hover:underline">邀请</button>
                      </div>
                      <div className="space-y-3">
                        {['产品经理', 'UI 设计师', '前端开发'].map((role, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${activeProject.members[i] || 'bg-slate-300'} flex items-center justify-center text-white text-xs font-bold`}>
                              {role[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">Member {i+1}</p>
                              <p className="text-xs text-slate-400">{role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* AI 生成模态框 */}
        {showAIModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20"><BrainCircuit size={100} /></div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles /> AI 项目规划师</h3>
                <p className="text-indigo-100 text-sm mt-1">告诉我你想做什么，我来帮你拆解成可执行的积木。</p>
              </div>
              <div className="p-6">
                <textarea 
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="例如：我想做一个帮助人们习惯养成的 iPhone App，需要有打卡功能和数据统计..."
                  className="w-full h-32 border border-slate-200 rounded-xl p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-slate-50"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors">取消</button>
                  <button 
                    onClick={handleAIGenerate}
                    disabled={!aiPrompt || isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isGenerating ? '正在思考拆解...' : '开始生成'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

// ==============================================================================
// 4. 🛡️ 系统底层 (Wrapper - 保持不变)
// ==============================================================================
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const appRef = useRef<FirebaseApp | null>(null);
  const authRef = useRef<Auth | null>(null);
  const dbRef = useRef<Firestore | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        let config: FirebaseOptions | null = null;
        if (MANUAL_CONFIG.apiKey && MANUAL_CONFIG.apiKey.length > 5) {
          config = MANUAL_CONFIG as FirebaseOptions;
        } else if (typeof window !== 'undefined' && window.__firebase_config) {
          try { config = JSON.parse(window.__firebase_config); } catch (e) {}
        } else if (typeof __firebase_config !== 'undefined') {
          // @ts-ignore
          try { config = JSON.parse(__firebase_config); } catch (e) {}
        }

        if (!config || !config.apiKey) {
          throw new Error("应用配置缺失 (API Key missing)");
        }

        if (!getApps().length) {
          appRef.current = initializeApp(config);
        } else {
          appRef.current = getApp();
        }
        
        authRef.current = getAuth(appRef.current);
        dbRef.current = getFirestore(appRef.current);

        onAuthStateChanged(authRef.current, (u) => setCurrentUser(u));

        const token = typeof window !== 'undefined' && window.__initial_auth_token
          ? window.__initial_auth_token
          : (typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null);

        if (token) {
          try {
            await signInWithCustomToken(authRef.current, token);
          } catch (authErr: any) {
            if (authErr.code === 'auth/custom-token-mismatch' || authErr.code === 'auth/invalid-custom-token') {
              await signInAnonymously(authRef.current);
            } else { throw authErr; }
          }
        } else {
          await signInAnonymously(authRef.current);
        }
        setIsReady(true);
      } catch (e: any) {
        setInitError(e.message);
      }
    };
    init();
  }, []);

  if (initError) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {initError}</div>;
  if (!isReady) return <div className="min-h-screen flex items-center justify-center bg-[#0F172A]"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;

  return <MainContent user={currentUser} />;
}