import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, updateProfile, signOut, Auth, User, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, Firestore } from 'firebase/firestore';
import { 
  Layout, Plus, Search, Cloud, Settings, LogOut, 
  CreditCard, Loader2, Sparkles, Folder, 
  Bell, Command, ChevronRight, MoreHorizontal,
  Calendar, CheckCircle2, Circle, ArrowLeft, BrainCircuit,
  Workflow, List, Network, Globe, X, Trash2, LogIn, UserCircle
} from 'lucide-react';

// ==============================================================================
// 1. 🟢 配置区域 (引擎核心)
// ==============================================================================
const MANUAL_CONFIG = {
  // ⚠️ 务必确保这里有 API Key
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58",
  authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" 
};

declare global {
  interface Window { __firebase_config?: string; __app_id?: string; __initial_auth_token?: string; }
}

// ==============================================================================
// 2. 🌍 多语言字典
// ==============================================================================
const TRANSLATIONS = {
  en: {
    login: {
      title: "Welcome to Nexus",
      subtitle: "Enter your workspace name to start building.",
      placeholder: "Your Name (e.g. Alex)",
      btn: "Enter Workspace",
      loading: "Creating Account..."
    },
    sidebar: {
      workspace: "WORKSPACE",
      myProjects: "My Projects",
      logout: "Log Out"
    },
    dashboard: {
      welcome: "Welcome,",
      subtitle: "Here are your active projects stored in the cloud.",
      newProject: "New Project",
      noProjects: "No projects yet. Create your first one!",
      createBtn: "Create Project"
    },
    modal: {
      createTitle: "Create New Project",
      nameLabel: "Project Name",
      descLabel: "Description",
      cancel: "Cancel",
      create: "Create"
    }
  },
  zh: {
    login: {
      title: "欢迎来到 Project Nexus",
      subtitle: "输入你的名字，开启你的创意工作区。",
      placeholder: "你的昵称 (例如: 队长)",
      btn: "进入工作区",
      loading: "正在创建账户..."
    },
    sidebar: {
      workspace: "工作区",
      myProjects: "我的项目库",
      logout: "退出登录"
    },
    dashboard: {
      welcome: "欢迎回来，",
      subtitle: "这是你存储在云端的所有活跃项目。",
      newProject: "新建项目",
      noProjects: "暂无项目。快来创建你的第一个大作吧！",
      createBtn: "立即创建"
    },
    modal: {
      createTitle: "创建新项目",
      nameLabel: "项目名称",
      descLabel: "项目简介",
      cancel: "取消",
      create: "确认创建"
    }
  }
};

// ==============================================================================
// 3. 🧩 数据类型定义
// ==============================================================================
type Project = {
  id: string;
  title: string;
  description: string;
  progress: number;
  createdAt: any;
  modules?: any[]; 
};

// ==============================================================================
// 4. 🔐 登录组件 (Login Component)
// ==============================================================================
const LoginScreen = ({ onLogin, lang, setLang, isLoggingIn }: any) => {
  const [name, setName] = useState('');
  const t = TRANSLATIONS[lang].login;

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-between items-start mb-8">
           <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
             <Layout className="text-white" size={32} />
           </div>
           <div className="flex gap-2">
             <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'en' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>EN</button>
             <button onClick={() => setLang('zh')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'zh' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>中文</button>
           </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.title}</h1>
        <p className="text-slate-500 mb-8">{t.subtitle}</p>

        <form onSubmit={(e) => { e.preventDefault(); onLogin(name); }} className="space-y-4">
          <div>
            <label htmlFor="login-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
            {/* 修复：添加 name, id, autoComplete 属性以防止插件报错 */}
            <input 
              id="login-name"
              name="displayName"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.placeholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium text-slate-800"
              required
            />
          </div>
          <button 
            disabled={isLoggingIn || !name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
            {isLoggingIn ? t.loading : t.btn}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==============================================================================
// 5. 🏗️ 主应用组件 (Main App)
// ==============================================================================
const MainContent = ({ user, db, auth, appId }: { user: User, db: Firestore, auth: Auth, appId: string }) => {
  const [lang, setLang] = useState<'en' | 'zh'>('zh'); 
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true); // 新增数据加载状态

  const t = TRANSLATIONS[lang];

  // 🟢 实时监听数据库
  useEffect(() => {
    if (!user || !db) return;
    
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'projects'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(list);
      setIsLoadingData(false); // 数据加载完成
    });

    return () => unsubscribe();
  }, [user, db, appId]);

  // 🟢 创建项目
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    
    setIsCreating(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), {
        title: newProjectTitle,
        description: newProjectDesc || 'No description',
        progress: 0,
        createdAt: serverTimestamp(),
        modules: [
          { id: 'm1', title: 'Phase 1: Planning', isCompleted: true, timeEstimate: '2h' },
          { id: 'm2', title: 'Phase 2: Execution', isCompleted: false, timeEstimate: '5h' }
        ]
      });
      setShowCreateModal(false);
      setNewProjectTitle('');
      setNewProjectDesc('');
    } catch (error) {
      console.error("Create failed", error);
      alert("创建失败，请检查网络");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除这个项目吗？")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id));
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 flex-shrink-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20"><Layout size={22} className="text-white" /></div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Project Nexus</h1>
            <p className="text-[10px] text-indigo-300 font-medium tracking-wider mt-1 opacity-80">{t.sidebar.workspace}</p>
          </div>
        </div>

        {/* 修复：给搜索框添加 name 和 id */}
        <div className="px-5 mb-6">
          <div className="relative group">
            <Search className="absolute left-3 top-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
            <input 
              id="sidebar-search"
              name="search"
              type="text" 
              placeholder="快速查找..." 
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-slate-800 text-slate-200" 
            />
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Menu</div>
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

            {isLoadingData ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"><Folder size={32}/></div>
                <p className="text-slate-500 mb-4">{t.dashboard.noProjects}</p>
                <button onClick={() => setShowCreateModal(true)} className="text-indigo-600 font-bold hover:underline">{t.dashboard.createBtn}</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div onClick={() => setShowCreateModal(true)} className="bg-slate-100 rounded-2xl p-6 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all group min-h-[200px]">
                    <Plus size={40} className="mb-2 group-hover:scale-110 transition-transform"/>
                    <span className="font-bold">{t.dashboard.newProject}</span>
                 </div>

                 {projects.map(project => (
                   <div key={project.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col justify-between group">
                     <div>
                       <div className="flex justify-between items-start mb-4">
                         <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Workflow size={20}/></div>
                         <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
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
                  <label htmlFor="proj-title" className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.modal.nameLabel}</label>
                  {/* 修复：添加 name/id */}
                  <input 
                    id="proj-title"
                    name="projectTitle"
                    autoFocus 
                    value={newProjectTitle} 
                    onChange={e => setNewProjectTitle(e.target.value)} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    required 
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="proj-desc" className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.modal.descLabel}</label>
                  {/* 修复：添加 name/id */}
                  <textarea 
                    id="proj-desc"
                    name="projectDescription"
                    value={newProjectDesc} 
                    onChange={e => setNewProjectDesc(e.target.value)} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium">{t.modal.cancel}</button>
                  <button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                    {isCreating && <Loader2 size={16} className="animate-spin" />}
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

// ==============================================================================
// 6. 🛡️ 系统底层 (Wrapper)
// ==============================================================================
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

        if (!config || !config.apiKey) throw new Error("Missing Config");

        if (!getApps().length) appRef.current = initializeApp(config);
        else appRef.current = getApp();
        
        authRef.current = getAuth(appRef.current);
        dbRef.current = getFirestore(appRef.current);

        if (typeof window !== 'undefined' && window.__app_id) {
          appIdRef.current = window.__app_id;
        }

        onAuthStateChanged(authRef.current, (u) => setCurrentUser(u));
        setIsReady(true);
      } catch (e: any) { console.error(e); }
    };
    init();
  }, []);

  const handleLogin = async (username: string) => {
    if (!authRef.current) return;
    setIsLoggingIn(true);
    try {
      const userCredential = await signInAnonymously(authRef.current);
      await updateProfile(userCredential.user, { displayName: username });
      setCurrentUser({ ...userCredential.user, displayName: username });
    } catch (e) {
      alert("登录失败，请重试");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center bg-[#0F172A]"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} lang={loginLang} setLang={setLoginLang} isLoggingIn={isLoggingIn} />;
  }

  return <MainContent user={currentUser} db={dbRef.current!} auth={authRef.current!} appId={appIdRef.current} />;
}