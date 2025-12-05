import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, Auth, User, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, serverTimestamp, updateDoc, Firestore } from 'firebase/firestore';
import { 
  Layout, Plus, Search, Cloud, Settings, LogOut, 
  CreditCard, User as UserIcon, Loader2, Sparkles, Folder, 
  Bell, Command, ChevronRight
} from 'lucide-react';

// ==============================================================================
// 1. 🟢 配置区域 (引擎核心 - 保持不动)
// ==============================================================================
const MANUAL_CONFIG = {
  // ⚠️ 确保这里有你的 API Key，否则无法连接
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58",
  authDomain: "", 
  projectId: "", 
  storageBucket: "", 
  messagingSenderId: "", 
  appId: "" 
};

// 防止 TS 报错
declare global {
  interface Window { __firebase_config?: string; __app_id?: string; __initial_auth_token?: string; }
}

// ==============================================================================
// 2. 🎨 UI 组件区域 (还原 Project Nexus 经典设计)
// ==============================================================================

// --- 左侧导航栏 ---
const Sidebar = ({ user }: { user: User | null }) => (
  <div className="w-72 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 flex-shrink-0 transition-all duration-300">
    {/* Logo */}
    <div className="p-6 flex items-center gap-3 text-white">
      <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
        <Layout size={22} className="text-white" />
      </div>
      <div>
        <h1 className="font-bold text-lg tracking-tight leading-none">Project Nexus</h1>
        <p className="text-[10px] text-indigo-300 font-medium tracking-wider mt-1 opacity-80">WORKSPACE</p>
      </div>
    </div>

    {/* 搜索栏 */}
    <div className="px-5 mb-6">
      <div className="relative group">
        <Search className="absolute left-3 top-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
        <input 
          type="text" 
          placeholder="搜索 (Cmd+K)" 
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-slate-200"
        />
        <div className="absolute right-3 top-3 pointer-events-none">
          <Command size={12} className="text-slate-600" />
        </div>
      </div>
    </div>

    {/* 导航菜单 */}
    <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
      <div className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Menu</div>
      
      <MenuItem icon={<Folder size={18} />} label="我的项目库" active count="3" />
      <MenuItem icon={<Cloud size={18} />} label="云端同步" />
      <MenuItem icon={<CreditCard size={18} />} label="订阅计划" />
      
      <div className="mt-6 px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">System</div>
      <MenuItem icon={<Settings size={18} />} label="设置" />
      <MenuItem icon={<Bell size={18} />} label="通知" count="2" />
    </nav>

    {/* 底部用户卡片 */}
    <div className="p-4 border-t border-slate-800/60 bg-[#0B1120]">
      {/* 升级卡片 */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-4 mb-4 relative overflow-hidden group cursor-pointer shadow-lg shadow-indigo-900/30">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles size={60} />
        </div>
        <div className="relative z-10">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-200" />
            升级到 Pro
          </h3>
          <p className="text-indigo-100 text-xs mt-1 leading-relaxed opacity-90">解锁无限项目存储和 AI 辅助功能。</p>
        </div>
      </div>
      
      {/* 用户信息 */}
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 text-white font-bold text-sm">
          {user ? user.uid.slice(0, 1).toUpperCase() : <Loader2 size={14} className="animate-spin" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">
            {user ? 'Guest Designer' : '连接中...'}
          </div>
          <div className="text-xs text-emerald-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50"></span>
            {user ? '系统在线' : '初始化...'}
          </div>
        </div>
        <LogOut size={16} className="text-slate-500 hover:text-slate-300" />
      </div>
    </div>
  </div>
);

const MenuItem = ({ icon, label, active = false, count }: any) => (
  <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all group ${active ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    {count && (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
        {count}
      </span>
    )}
  </div>
);

// --- 右侧主内容区域 ---
const MainContent = ({ user, db, appId }: { user: User | null, db: Firestore, appId: string }) => {
  return (
    <div className="flex h-screen bg-slate-50/50 font-sans overflow-hidden">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white relative">
        {/* 顶部栏 */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-bold text-slate-800">概览</h2>
             <span className="text-slate-300 text-sm">/</span>
             <span className="text-slate-500 text-sm">我的项目</span>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                <Bell size={16} />
             </button>
             <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-slate-200">
                <Plus size={16} />
                新建项目
             </button>
          </div>
        </header>

        {/* 核心画布区域 */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <div className="max-w-5xl mx-auto">
            
            {/* 欢迎标语 */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">欢迎回来, Designer</h1>
              <p className="text-slate-500">这里是你所有创意项目的控制中心。</p>
            </div>

            {/* 空状态卡片 (你的最爱) */}
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-200 transition-colors duration-500">
              
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 text-indigo-600 rotate-3 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-xl shadow-indigo-100">
                <Layout size={48} strokeWidth={1.5} />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-3 relative z-10">
                开始你的第一个项目
              </h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed relative z-10">
                Project Nexus 已准备好同步你的所有设备。创建一个新画布，开始构建你的想法，数据将自动存储在云端。
              </p>

              <div className="flex gap-4 relative z-10">
                <button 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 hover:shadow-indigo-300 flex items-center gap-2"
                  onClick={() => alert("功能开发中...")}
                >
                  <Plus size={20} />
                  创建新项目
                </button>
                <button className="px-8 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                  查看文档
                </button>
              </div>

            </div>

            {/* 最近活动示例 */}
            <div className="mt-12">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">最近活动</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 hover:shadow-lg hover:shadow-slate-100/50 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-100 transition-colors">
                        <Folder size={20} />
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1">未命名项目 #{i}</h4>
                    <p className="text-xs text-slate-400">最后编辑: 2小时前</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

// ==============================================================================
// 3. 🛡️ 系统底层 (Wrapper - 保持不变以防白屏)
// ==============================================================================
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const appRef = useRef<FirebaseApp | null>(null);
  const authRef = useRef<Auth | null>(null);
  const dbRef = useRef<Firestore | null>(null);
  const appIdRef = useRef<string>('default-app-id');
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

        if (typeof window !== 'undefined' && window.__app_id) {
          appIdRef.current = window.__app_id;
        }

        onAuthStateChanged(authRef.current, (u) => setCurrentUser(u));

        const token = typeof window !== 'undefined' && window.__initial_auth_token
          ? window.__initial_auth_token
          : (typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null);

        if (token) {
          try {
            await signInWithCustomToken(authRef.current, token);
          } catch (authErr: any) {
            // Token 不匹配时自动降级为匿名登录
            if (authErr.code === 'auth/custom-token-mismatch' || authErr.code === 'auth/invalid-custom-token') {
              await signInAnonymously(authRef.current);
            } else {
              throw authErr;
            }
          }
        } else {
          await signInAnonymously(authRef.current);
        }
        setIsReady(true);
      } catch (e: any) {
        console.error("Init Failed:", e);
        setInitError(e.message);
      }
    };
    init();
  }, []);

  if (initError) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">启动错误: {initError}</div>;
  }

  if (!isReady || !dbRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
          <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Project Nexus Loading...</p>
        </div>
      </div>
    );
  }

  return <MainContent user={currentUser} db={dbRef.current} appId={appIdRef.current} />;
}