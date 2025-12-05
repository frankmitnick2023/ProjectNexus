import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, Auth, User, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, serverTimestamp, updateDoc, Firestore } from 'firebase/firestore';
import { 
  Layout, Plus, Search, Cloud, Settings, LogOut, 
  CreditCard, User as UserIcon, Loader2, Sparkles, Folder 
} from 'lucide-react';

// ==============================================================================
// 1. 🟢 配置区域 (引擎核心 - 勿动)
// ==============================================================================
const MANUAL_CONFIG = {
  // ⚠️ 记得确认这里填了你的 Key，不然虽然有界面但无法写入数据
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
// 2. 🎨 UI 组件区域 (你喜欢的那个界面)
// ==============================================================================

// 侧边栏组件
const Sidebar = ({ user }: { user: User | null }) => (
  <div className="w-64 bg-[#0F172A] text-slate-300 flex flex-col h-full border-r border-slate-800">
    {/* Logo */}
    <div className="p-6 flex items-center gap-3 text-white">
      <div className="bg-indigo-600 p-2 rounded-lg">
        <Layout size={20} className="text-white" />
      </div>
      <span className="font-bold text-lg tracking-tight">Project Nexus</span>
    </div>

    {/* 搜索栏 */}
    <div className="px-4 mb-6">
      <div className="relative group">
        <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
        <input 
          type="text" 
          placeholder="查找项目..." 
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all placeholder:text-slate-600"
        />
      </div>
    </div>

    {/* 导航菜单 */}
    <nav className="flex-1 px-2 space-y-1">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 text-white rounded-lg cursor-pointer">
        <div className="flex items-center gap-3">
          <Folder size={18} className="text-indigo-400" />
          <span className="text-sm font-medium">我的项目库</span>
        </div>
        <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full text-slate-300">0</span>
      </div>
      <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800/30 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-slate-200">
        <Cloud size={18} />
        <span className="text-sm">云端同步</span>
      </div>
      <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800/30 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-slate-200">
        <Settings size={18} />
        <span className="text-sm">设置</span>
      </div>
    </nav>

    {/* 底部用户卡片 */}
    <div className="p-4 border-t border-slate-800 bg-[#0B1120]">
      <div className="bg-slate-800/50 rounded-xl p-3 mb-3 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-indigo-500/20">
            {user ? user.uid.slice(0, 1).toUpperCase() : 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {user ? 'Guest User' : 'Connecting...'}
            </div>
            <div className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {user ? '已同步' : '连接中'}
            </div>
          </div>
        </div>
        <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
          <Sparkles size={12} />
          升级 Pro
        </button>
      </div>
      
      <button className="w-full border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-slate-800">
        <Plus size={16} />
        新建项目
      </button>
    </div>
  </div>
);

// 主内容区域 (截图右侧部分)
const MainContent = ({ user, db, appId }: { user: User | null, db: Firestore, appId: string }) => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar user={user} />

      {/* 右侧主画布 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* 顶部栏 */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Layout size={18} className="text-slate-400" />
            Project Nexus
          </div>
          <div className="flex gap-2">
             {/* 顶部按钮占位 */}
             <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                <Cloud size={18} />
             </button>
          </div>
        </header>

        {/* 核心内容：空状态引导 (还原截图里的卡片) */}
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/30">
          <div className="bg-white p-12 rounded-3xl shadow-xl shadow-slate-200/50 text-center max-w-lg w-full border border-slate-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 rotate-3 transition-transform hover:rotate-6 duration-300">
              <Layout size={40} strokeWidth={1.5} />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              开始你的第一个项目
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Project Nexus 已准备好同步你的所有设备。<br/>
              创建一个新画布，开始构建你的想法。
            </p>

            <button 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mx-auto w-48"
              onClick={() => alert("这里可以绑定创建逻辑！")}
            >
              <Plus size={20} />
              新建项目
            </button>
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