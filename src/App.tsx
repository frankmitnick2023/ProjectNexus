import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, updateProfile, signOut, Auth, User, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, Firestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { 
  Layout, Plus, Search, Cloud, Settings, LogOut, 
  CreditCard, Loader2, Sparkles, Folder, 
  Bell, Command, ChevronRight, MoreHorizontal,
  Calendar, CheckCircle2, Circle, ArrowLeft, BrainCircuit,
  Workflow, List, Network, Globe, X, Trash2, LogIn, UserCircle, 
  AlertTriangle, Wifi, WifiOff, CloudLightning, Check, RefreshCw, HardDrive, Database
} from 'lucide-react';

// ==============================================================================
// 1. 🟢 配置区域
// ==============================================================================
const MANUAL_CONFIG = {
  // ⚠️ 请填入你的真实 Firebase 配置，以便启用云同步
  // 即使没填或填错，本版本也会自动降级为“纯本地模式”，保证能用
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58", 
  authDomain: "", 
  projectId: "project-nexus-demo", 
  storageBucket: "", 
  messagingSenderId: "", 
  appId: "" 
};

declare global {
  interface Window { __firebase_config?: string; __app_id?: string; __initial_auth_token?: string; }
}

// ==============================================================================
// 2. 💾 本地优先引擎 (Local-First Engine)
// ==============================================================================
const LOCAL_STORAGE_KEY = 'nexus_projects_v2';

type Project = { 
  id: string; 
  title: string; 
  description: string; 
  progress: number; 
  createdAt: number; 
  modules?: any[]; 
  syncStatus: 'synced' | 'pending' | 'error'; // 这一行是关键，追踪每条数据的同步状态
};

// ==============================================================================
// 3. 🌍 多语言
// ==============================================================================
const TRANSLATIONS = {
  en: {
    login: { title: "Nexus Workspace", subtitle: "Local-First + Cloud Sync.", placeholder: "Your Name", btn: "Enter" },
    dashboard: { welcome: "Welcome,", subtitle: "Projects load instantly from local storage.", newProject: "New Project", noProjects: "No projects. Start building!", createBtn: "Create" },
    modal: { createTitle: "New Project", nameLabel: "Name", descLabel: "Description", cancel: "Cancel", create: "Create" },
    status: { saved: "Cloud Synced", pending: "Local Only", error: "Sync Failed" }
  },
  zh: {
    login: { title: "Nexus 工作台", subtitle: "本地优先架构 + 云端自动同步", placeholder: "你的昵称", btn: "进入工作区" },
    dashboard: { welcome: "欢迎回来，", subtitle: "所有操作即时响应，后台自动同步云端。", newProject: "新建项目", noProjects: "暂无项目。创建你的第一个作品！", createBtn: "立即创建" },
    modal: { createTitle: "创建新项目", nameLabel: "项目名称", descLabel: "项目简介", cancel: "取消", create: "确认创建" },
    status: { saved: "已同步云端", pending: "仅本地保存", error: "同步失败(权限/网络)" }
  }
};

// ==============================================================================
// 4. 🔐 登录组件
// ==============================================================================
const LoginScreen = ({ onLogin, lang, setLang, isLoggingIn }: any) => {
  const [name, setName] = useState('');
  const t = TRANSLATIONS[lang].login;

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-between items-start mb-8">
           <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200"><Layout className="text-white" size={32} /></div>
           <div className="flex gap-2">
             <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'en' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>EN</button>
             <button onClick={() => setLang('zh')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'zh' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>中文</button>
           </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.title}</h1>
        <p className="text-slate-500 mb-8">{t.subtitle}</p>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(name); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
            <input autoComplete="off" spellCheck={false} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" required />
          </div>
          <button disabled={isLoggingIn || !name.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
            {isLoggingIn ? "Connecting..." : t.btn}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==============================================================================
// 5. 🏗️ 主应用组件 (核心逻辑)
// ==============================================================================
const MainContent = ({ user, db, auth, appId }: { user: User, db: Firestore | null, auth: Auth | null, appId: string }) => {
  const [lang, setLang] = useState<'en' | 'zh'>('zh'); 
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  // 核心状态：是否连上了云端
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  const t = TRANSLATIONS[lang];

  // 🔄 初始化：加载本地数据
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 按时间倒序
        parsed.sort((a: any, b: any) => b.createdAt - a.createdAt);
        setProjects(parsed);
      } catch (e) { console.error("Local storage parse error", e); }
    }
  }, []);

  // 🔄 监听云端数据 (后台静默合并)
  useEffect(() => {
    if (!user || !db) return;

    // 尝试连接
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 成功连接到云端！
      setIsCloudConnected(true);
      
      const cloudProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        syncStatus: 'synced' // 来自云端的肯定已同步
      })) as Project[];

      // 策略：以云端数据为准，但保留本地尚未上传的数据
      // 这里简化处理：直接合并，ID 冲突则云端覆盖本地
      setProjects(prevLocal => {
        const cloudIds = new Set(cloudProjects.map(p => p.id));
        // 保留那些还不在云端的本地数据（syncStatus === 'pending' 或 'error'）
        const pendingLocal = prevLocal.filter(p => !cloudIds.has(p.id));
        
        const merged = [...pendingLocal, ...cloudProjects];
        merged.sort((a, b) => b.createdAt - a.createdAt);
        
        // 更新 LocalStorage 备份
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });

    }, (error) => {
      console.warn("Cloud sync paused/failed (Permission or Network):", error);
      setIsCloudConnected(false);
      // 云端挂了不影响本地，啥都不用做，保持显示本地数据即可
    });

    return () => unsubscribe();
  }, [user, db, appId]);

  // 🟢 创建项目 (Local-First 逻辑)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    
    // 1. 构造新项目对象 (先标记为 Pending)
    const newProject: Project = {
      id: `local-${Date.now()}`, // 临时 ID
      title: newProjectTitle,
      description: newProjectDesc || '',
      progress: 0,
      createdAt: Date.now(),
      modules: [
        { id: 'm1', title: 'Phase 1: Concept', isCompleted: true, timeEstimate: '1h' },
        { id: 'm2', title: 'Phase 2: Dev', isCompleted: false, timeEstimate: '5h' }
      ],
      syncStatus: 'pending' // 🟡 状态：待同步
    };

    // 2. ⚡️ 极速更新 UI (不等待网络)
    const updatedList = [newProject, ...projects];
    setProjects(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList)); // 持久化到本地
    
    // 关闭弹窗
    setShowCreateModal(false);
    setNewProjectTitle('');
    setNewProjectDesc('');

    // 3. ☁️ 后台异步上传
    if (db && user) {
      try {
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), {
          ...newProject,
          // 移除 UI 专用的字段再上传
          syncStatus: undefined 
        });
        
        // 上传成功！更新本地状态 ID 为真实云端 ID，状态改为 Synced
        setProjects(prev => {
          const newList = prev.map(p => 
            p.id === newProject.id 
              ? { ...p, id: docRef.id, syncStatus: 'synced' as const } 
              : p
          );
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
          return newList;
        });

      } catch (err) {
        console.error("Upload failed:", err);
        // 上传失败，标记为 Error，提示用户
        setProjects(prev => {
          const newList = prev.map(p => 
            p.id === newProject.id ? { ...p, syncStatus: 'error' as const } : p
          );
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
          return newList;
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除?")) return;

    // 1. 本地立即删除
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // 2. 云端异步删除
    if (db && user && !id.startsWith('local-')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id));
      } catch (e) { console.error("Cloud delete failed", e); }
    }
  };

  const handleLogout = () => signOut(auth!);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 flex-shrink-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20"><Layout size={22} className="text-white" /></div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Project Nexus</h1>
            <p className="text-[10px] text-indigo-300 font-medium tracking-wider mt-1 opacity-80">LOCAL FIRST</p>
          </div>
        </div>

        <div className="px-5 mb-6">
           <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors ${isCloudConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              {isCloudConnected ? <CloudLightning size={14} /> : <HardDrive size={14} />}
              {isCloudConnected ? "Cloud Active" : "Local Mode"}
           </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-600/10 text-indigo-400 font-medium cursor-pointer">
            <Folder size={18} /> {t.sidebar.myProjects}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/60 bg-[#0B1120]">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm border border-indigo-400">
              {user.displayName ? user.displayName[0].toUpperCase() : <UserCircle size={20}/>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">{user.displayName || 'User'}</div>
              <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 mt-0.5 transition-colors">
                <LogOut size={10} /> {t.sidebar.logout}
              </button>
            </div>
            <div className="flex flex-col gap-1">
               <button onClick={() => setLang('en')} className={`text-[10px] ${lang==='en'?'text-white':'text-slate-600'}`}>EN</button>
               <button onClick={() => setLang('zh')} className={`text-[10px] ${lang==='zh'?'text-white':'text-slate-600'}`}>中</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white relative">
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">{t.sidebar.myProjects}</h2>
          <button onClick={() => setShowCreateModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg">
            <Plus size={16} /> {t.dashboard.newProject}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.dashboard.welcome} {user.displayName}</h1>
            <p className="text-slate-500 mb-8">{t.dashboard.subtitle}</p>

            {projects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"><Folder size={32}/></div>
                <p className="text-slate-500 mb-4">{t.dashboard.noProjects}</p>
                <button onClick={() => setShowCreateModal(true)} className="text-indigo-600 font-bold hover:underline">{t.dashboard.createBtn}</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                 {/* Create Card */}
                 <div onClick={() => setShowCreateModal(true)} className="bg-slate-100 rounded-2xl p-6 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all group min-h-[200px]">
                    <Plus size={40} className="mb-2 group-hover:scale-110 transition-transform"/>
                    <span className="font-bold">{t.dashboard.newProject}</span>
                 </div>

                 {/* Project Cards */}
                 {projects.map(project => (
                   <div key={project.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col justify-between group relative overflow-hidden">
                     
                     {/* 🟡 状态徽章 (Sync Status Badge) */}
                     <div className="absolute top-0 right-0 p-2">
                       {project.syncStatus === 'pending' && (
                         <div className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                           <HardDrive size={10}/> {t.status.pending}
                         </div>
                       )}
                       {project.syncStatus === 'error' && (
                         <div className="bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                           <AlertTriangle size={10}/> {t.status.error}
                         </div>
                       )}
                       {project.syncStatus === 'synced' && (
                         <div className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <CloudLightning size={10}/> {t.status.saved}
                         </div>
                       )}
                     </div>

                     <div>
                       <div className="flex justify-between items-start mb-4">
                         <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Workflow size={20}/></div>
                         <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={16}/></button>
                       </div>
                       <h3 className="font-bold text-slate-800 text-lg mb-1">{project.title}</h3>
                       <p className="text-slate-500 text-xs line-clamp-2 mb-4">{project.description}</p>
                     </div>
                     <div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                         <div className="h-full bg-indigo-500 w-1/3"></div>
                       </div>
                       <div className="text-xs text-slate-400 flex justify-between">
                         <span>Running</span>
                         <span>{project.modules?.length || 0} modules</span>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold mb-4">{t.modal.createTitle}</h3>
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.modal.nameLabel}</label>
                  <input autoFocus autoComplete="off" spellCheck={false} value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.modal.descLabel}</label>
                  <textarea autoComplete="off" spellCheck={false} value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium">{t.modal.cancel}</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                    {t.modal.create}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [loginLang, setLoginLang] = useState('zh');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
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

        if (config && config.apiKey) {
          if (!getApps().length) appRef.current = initializeApp(config);
          else appRef.current = getApp();
          authRef.current = getAuth(appRef.current);
          dbRef.current = getFirestore(appRef.current);
          if (typeof window !== 'undefined' && window.__app_id) appIdRef.current = window.__app_id;
          onAuthStateChanged(authRef.current, (u) => setCurrentUser(u));
        } else {
          console.warn("No Firebase Config found, running in pure local mode.");
        }
      } catch (e: any) { console.error("Firebase init error:", e); }
      finally { setIsReady(true); }
    };
    init();
  }, []);

  const handleLogin = async (username: string) => {
    setIsLoggingIn(true);
    // 尝试 Firebase 登录，如果失败则使用本地模拟登录
    if (authRef.current) {
      try {
        const userCredential = await signInAnonymously(authRef.current);
        await updateProfile(userCredential.user, { displayName: username });
        // onAuthStateChanged 会处理状态更新
      } catch (e) {
        console.warn("Firebase login failed, falling back to local user");
        setCurrentUser({ uid: 'local-user', displayName: username } as User);
      }
    } else {
      // 纯本地模式
      setCurrentUser({ uid: 'local-user', displayName: username } as User);
    }
    setIsLoggingIn(false);
  };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center bg-[#0F172A]"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;

  if (!currentUser) return <LoginScreen onLogin={handleLogin} lang={loginLang} setLang={setLoginLang} isLoggingIn={isLoggingIn} />;
  
  return <MainContent user={currentUser} db={dbRef.current} auth={authRef.current} appId={appIdRef.current} />;
}