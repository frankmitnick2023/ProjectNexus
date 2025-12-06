import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, updateProfile, signOut, Auth, User } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { 
  Layout, Plus, Search, Folder, 
  LogOut, Loader2, Sparkles, 
  Workflow, Trash2, LogIn, UserCircle, 
  AlertTriangle, Cloud, CheckCircle2, 
  BrainCircuit, Network, List, MoreHorizontal, Calendar, ArrowLeft, CloudLightning, RefreshCw, HardDrive, Circle
} from 'lucide-react';

// ==============================================================================
// 1. 🟢 配置区域
// ==============================================================================
const MANUAL_CONFIG = {
  // ⚠️ 建议填入真实配置以启用云同步。即使为空，本地模式也能完美运行。
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58", 
  authDomain: "", 
  projectId: "project-nexus-demo", 
  storageBucket: "", 
  messagingSenderId: "", 
  appId: "" 
};

// ==============================================================================
// 2. 💾 数据结构 & 本地引擎
// ==============================================================================
const LOCAL_STORAGE_KEY = 'nexus_projects_v7_stable';

type SubTask = { id: string; title: string; isCompleted: boolean; };
type Module = { id: string; title: string; isCompleted: boolean; timeEstimate: string; subTasks?: SubTask[]; };
type Project = { 
  id: string; 
  title: string; 
  description: string; 
  progress: number; 
  createdAt: number; 
  modules?: Module[]; 
  members?: string[];
  syncStatus: 'synced' | 'pending' | 'error';
};

// ==============================================================================
// 3. 🌍 多语言 (重构版：防崩设计)
// ==============================================================================
const TRANSLATIONS = {
  en: {
    login: { title: "Nexus Workspace", subtitle: "Local-First + AI Power.", placeholder: "Your Name", btn: "Enter" },
    sidebar: { workspace: "WORKSPACE", myProjects: "My Projects", team: "Team", ai: "AI Studio", settings: "Settings", logout: "Log Out" },
    dashboard: { welcome: "Welcome,", subtitle: "Your creative command center.", newProject: "New Project", noProjects: "No projects. Create one!", createBtn: "Create", aiCardTitle: "AI Planner", aiCardDesc: "Turn ideas into blueprints." },
    detail: { overview: "Overview", blocks: "Task Blocks", addBlock: "Add Module", flow: "Blueprint View", list: "List View" },
    modal: { title: "AI Project Planner", desc: "Describe your idea, AI will break it down.", placeholder: "E.g. A fitness app with social features...", cancel: "Cancel", generate: "Generate Project" },
    status: { saved: "Cloud Synced", pending: "Local Only", error: "Sync Failed" }
  },
  zh: {
    login: { title: "Nexus 工作台", subtitle: "本地优先架构 + AI 赋能", placeholder: "你的昵称", btn: "进入工作区" },
    sidebar: { workspace: "工作区", myProjects: "我的项目库", team: "团队协作", ai: "AI 创意工坊", settings: "设置", logout: "退出登录" },
    dashboard: { welcome: "欢迎回来，", subtitle: "你的创意指挥中心。", newProject: "新建项目", noProjects: "暂无项目。创建你的第一个作品！", createBtn: "立即创建", aiCardTitle: "AI 规划师", aiCardDesc: "一键将想法转化为蓝图。" },
    detail: { overview: "概览", blocks: "任务积木", addBlock: "添加模块", flow: "蓝图视图", list: "列表视图" },
    modal: { title: "AI 项目规划师", desc: "描述你的想法，AI 帮你拆解为可执行积木。", placeholder: "例如：做一个带有社交功能的健身 App...", cancel: "取消", generate: "生成项目架构" },
    status: { saved: "已同步云端", pending: "仅本地保存", error: "同步失败" }
  }
};

// 🛡️ 核心修复：深度合并翻译对象，确保任何属性都不为 undefined
const useSafeT = (lang: 'en' | 'zh') => {
  const base = TRANSLATIONS['en'];
  const target = TRANSLATIONS[lang] || base;
  
  return {
    login: { ...base.login, ...target.login },
    sidebar: { ...base.sidebar, ...target.sidebar },
    dashboard: { ...base.dashboard, ...target.dashboard },
    detail: { ...base.detail, ...target.detail },
    modal: { ...base.modal, ...target.modal },
    status: { ...base.status, ...target.status },
  };
};

// ==============================================================================
// 4. 🧩 蓝图视图组件 (Blueprint View)
// ==============================================================================
const BlueprintView = ({ project }: { project: Project }) => {
  return (
    <div className="relative w-full h-full overflow-auto bg-slate-50/50 p-10 flex items-center justify-start min-h-[500px]">
      <div className="flex gap-16 items-center animate-in fade-in zoom-in-95 duration-500">
        {/* 根节点 */}
        <div className="relative z-10">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 border-4 border-indigo-100 w-64 text-center relative group">
             <div className="absolute -top-3 -right-3 bg-indigo-500 rounded-full p-2 shadow-lg"><Layout size={20}/></div>
             <h3 className="font-bold text-lg mb-1">{project.title}</h3>
             <div className="text-xs text-slate-400">Progress {project.progress}%</div>
             <div className="absolute top-1/2 -right-3 w-3 h-3 bg-indigo-500 rounded-full" />
          </div>
        </div>

        {/* 模块层级 */}
        <div className="flex flex-col gap-8 relative">
           <div className="absolute left-[-32px] top-10 bottom-10 w-0.5 bg-indigo-200 rounded-full"></div>
           {project.modules?.map((module) => (
             <div key={module.id} className="relative flex items-center group">
               <div className="w-16 h-0.5 bg-indigo-200 absolute -left-16 top-1/2 transition-all group-hover:bg-indigo-400"></div>
               <div className="absolute -left-16 top-1/2 w-2 h-2 bg-indigo-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
               
               <div className={`w-64 p-4 rounded-xl border-2 transition-all bg-white hover:scale-105 duration-200 ${module.isCompleted ? 'border-green-400/50 shadow-green-100' : 'border-slate-200 shadow-sm hover:border-indigo-400'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${module.isCompleted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {module.isCompleted ? 'DONE' : 'PENDING'}
                    </span>
                    <MoreHorizontal size={16} className="text-slate-300"/>
                  </div>
                  <h4 className="font-bold text-slate-800">{module.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Calendar size={10}/> {module.timeEstimate}</p>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

// ==============================================================================
// 5. 🔐 登录组件
// ==============================================================================
const LoginScreen = ({ onLogin, lang, setLang, isLoggingIn }: any) => {
  const [name, setName] = useState('');
  const t = useSafeT(lang).login;

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
            <input 
              // 🛡️ 防插件干扰盾：彻底禁用自动填充
              autoComplete="off" 
              spellCheck={false} 
              data-lpignore="true" 
              data-form-type="other"
              name="nexus-user-input"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t.placeholder} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800" 
              required 
            />
          </div>
          <button disabled={isLoggingIn || !name.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
            {isLoggingIn ? "Loading..." : t.btn}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==============================================================================
// 6. 🏗️ 主应用组件 (核心逻辑)
// ==============================================================================
const MainContent = ({ user, db, auth, appId }: { user: User, db: Firestore | null, auth: Auth | null, appId: string }) => {
  const [lang, setLang] = useState<'en' | 'zh'>('zh'); 
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  // 状态管理
  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [projectMode, setProjectMode] = useState<'list' | 'blueprint'>('list');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  // AI 相关
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // 使用安全翻译
  const t = useSafeT(lang);

  // 🔄 初始化：加载本地数据
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.sort((a: any, b: any) => b.createdAt - a.createdAt);
        setProjects(parsed);
      } catch (e) { console.error("Local storage error", e); }
    }
  }, []);

  // 🔄 监听云端 (后台合并)
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsCloudConnected(true);
      const cloudProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        syncStatus: 'synced'
      })) as Project[];

      setProjects(prevLocal => {
        const cloudIds = new Set(cloudProjects.map(p => p.id));
        const pendingLocal = prevLocal.filter(p => !cloudIds.has(p.id));
        const merged = [...pendingLocal, ...cloudProjects];
        merged.sort((a, b) => b.createdAt - a.createdAt);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
    }, (error) => {
      console.warn("Cloud sync paused:", error);
      setIsCloudConnected(false);
    });
    return () => unsubscribe();
  }, [user, db, appId]);

  // 🟢 AI 创建项目 (模拟)
  const handleAICreate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    // 模拟 AI 思考时间
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newProject: Project = {
      id: `local-${Date.now()}`,
      title: "AI: " + aiPrompt.slice(0, 10) + "...", 
      description: aiPrompt,
      progress: 0,
      createdAt: Date.now(),
      syncStatus: 'pending',
      modules: [
        { id: 'm1', title: 'Phase 1: Architecture', isCompleted: false, timeEstimate: '4h' },
        { id: 'm2', title: 'Phase 2: MVP Development', isCompleted: false, timeEstimate: '10h' },
        { id: 'm3', title: 'Phase 3: Testing', isCompleted: false, timeEstimate: '3h' },
      ],
      members: ['bg-blue-500', 'bg-green-500']
    };

    saveProject(newProject);
    setIsGenerating(false);
    setShowAIModal(false);
    setAiPrompt('');
  };

  // 通用保存逻辑
  const saveProject = async (newProject: Project) => {
    const updatedList = [newProject, ...projects];
    setProjects(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    if (db && user) {
      try {
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), { ...newProject, syncStatus: undefined });
        setProjects(prev => {
          const newList = prev.map(p => p.id === newProject.id ? { ...p, id: docRef.id, syncStatus: 'synced' as const } : p);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
          return newList;
        });
      } catch (err) { console.error("Upload failed", err); }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    
    const newProject: Project = {
      id: `local-${Date.now()}`,
      title: newProjectTitle,
      description: newProjectDesc || '',
      progress: 0,
      createdAt: Date.now(),
      syncStatus: 'pending',
      modules: [
        { id: 'm1', title: 'Step 1: Setup', isCompleted: false, timeEstimate: '1h' },
        { id: 'm2', title: 'Step 2: Build', isCompleted: false, timeEstimate: '4h' }
      ]
    };

    saveProject(newProject);
    setShowCreateModal(false);
    setNewProjectTitle('');
    setNewProjectDesc('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    if (db && user && !id.startsWith('local-')) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id)); } 
      catch (e) { console.error(e); }
    }
  };

  const openProject = (p: Project) => {
    setActiveProject(p);
    setView('detail');
    setProjectMode('list');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 flex-shrink-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20"><Layout size={22} className="text-white" /></div>
          <div><h1 className="font-bold text-lg tracking-tight">Project Nexus</h1><p className="text-[10px] text-indigo-300 font-medium tracking-wider mt-1 opacity-80">{t.sidebar.workspace}</p></div>
        </div>
        
        <div className="px-5 mb-6">
           <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors ${isCloudConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              {isCloudConnected ? <CloudLightning size={14} /> : <HardDrive size={14} />}
              {isCloudConnected ? t.status.saved : t.status.pending}
           </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <div onClick={() => setView('dashboard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${view === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-800/50'}`}>
            <Folder size={18} /> {t.sidebar.myProjects}
          </div>
          <div onClick={() => setShowAIModal(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 cursor-pointer">
            <BrainCircuit size={18} /> {t.sidebar.ai}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/60 bg-[#0B1120]">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">{user.displayName?.[0] || 'U'}</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium text-slate-200 truncate">{user.displayName || 'User'}</div></div>
            <button onClick={() => signOut(auth!)} className="text-slate-500 hover:text-red-400"><LogOut size={16} /></button>
          </div>
          <div className="flex gap-2 mt-2 justify-center">
             <button onClick={() => setLang('en')} className={`text-[10px] ${lang==='en'?'text-white':'text-slate-600'}`}>EN</button>
             <button onClick={() => setLang('zh')} className={`text-[10px] ${lang==='zh'?'text-white':'text-slate-600'}`}>中</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white relative">
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {view === 'detail' && (
              <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowLeft size={20}/></button>
            )}
            <h2 className="text-lg font-bold text-slate-800">{view === 'dashboard' ? t.sidebar.myProjects : activeProject?.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {view === 'detail' && (
               <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button onClick={() => setProjectMode('list')} className={`p-1.5 rounded-md text-xs font-bold flex gap-1 ${projectMode==='list' ? 'bg-white shadow' : 'text-slate-500'}`}><List size={14}/> {t.detail.list}</button>
                 <button onClick={() => setProjectMode('blueprint')} className={`p-1.5 rounded-md text-xs font-bold flex gap-1 ${projectMode==='blueprint' ? 'bg-white shadow' : 'text-slate-500'}`}><Network size={14}/> {t.detail.flow}</button>
               </div>
            )}
            <button onClick={() => setShowCreateModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg">
              <Plus size={16} /> {t.dashboard.newProject}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
          {view === 'dashboard' && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* AI Card */}
                 <div onClick={() => setShowAIModal(true)} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl transition-all group flex flex-col justify-between">
                    <div>
                      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Sparkles size={24} /></div>
                      <h3 className="font-bold text-xl mb-2">{t.dashboard.aiCardTitle}</h3>
                      <p className="text-indigo-100 text-sm opacity-90">{t.dashboard.aiCardDesc}</p>
                    </div>
                 </div>
                 {/* Projects */}
                 {projects.map(project => (
                   <div key={project.id} onClick={() => openProject(project)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden">
                     {project.syncStatus === 'syncing' && (
                       <div className="absolute top-0 right-0 p-2"><RefreshCw size={12} className="text-amber-500 animate-spin"/></div>
                     )}
                     <div>
                       <h3 className="font-bold text-slate-800 text-lg mb-1">{project.title}</h3>
                       <p className="text-slate-500 text-xs line-clamp-2 mb-4">{project.description}</p>
                     </div>
                     <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>{project.modules?.length || 0} Modules</span>
                        <div onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="hover:text-red-500 p-1"><Trash2 size={14}/></div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {view === 'detail' && activeProject && (
            <div className="h-full">
              {projectMode === 'list' ? (
                 <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                   <h3 className="font-bold mb-4 flex items-center gap-2"><Folder className="text-indigo-500"/> {t.detail.blocks}</h3>
                   <div className="space-y-3">
                     {activeProject.modules?.map(m => (
                       <div key={m.id} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50/50">
                         <div className="flex items-center gap-3">
                           {m.isCompleted ? <CheckCircle2 className="text-green-500" size={18}/> : <Circle className="text-slate-300" size={18}/>}
                           <span className="font-medium text-slate-700">{m.title}</span>
                         </div>
                         <span className="text-xs bg-white px-2 py-1 rounded border text-slate-500">{m.timeEstimate}</span>
                       </div>
                     ))}
                   </div>
                 </div>
              ) : (
                 <BlueprintView project={activeProject} />
              )}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold mb-4">{t.modal.title}</h3>
              <form onSubmit={handleCreateProject}>
                <input 
                  autoComplete="off" spellCheck={false} data-lpignore="true" 
                  autoFocus value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t.modal.nameLabel} required 
                />
                <textarea 
                  autoComplete="off" spellCheck={false} data-lpignore="true"
                  value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 mb-6 outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t.modal.descLabel} 
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">{t.modal.cancel}</button>
                  <button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                    {isCreating ? <Loader2 className="animate-spin" size={16}/> : <CloudLightning size={16}/>} {t.modal.create}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* AI Modal */}
        {showAIModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <div className="bg-indigo-600 -m-6 mb-6 p-6 text-white rounded-t-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20"><BrainCircuit size={100} /></div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles /> {t.modal.title}</h3>
              </div>
              <textarea 
                autoComplete="off" spellCheck={false} data-lpignore="true"
                value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} 
                className="w-full h-32 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder={t.modal.desc} 
              />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">{t.modal.cancel}</button>
                <button onClick={handleAICreate} disabled={!aiPrompt || isGenerating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                  {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} {t.modal.generate}
                </button>
              </div>
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
          
          try { await enableIndexedDbPersistence(dbRef.current); } catch (e) {}

          onAuthStateChanged(authRef.current, (u) => setCurrentUser(u));
        }
      } catch (e: any) { console.error("Init Error:", e); }
      finally { setIsReady(true); }
    };
    init();
  }, []);

  const handleLogin = async (username: string) => {
    setIsLoggingIn(true);
    if (authRef.current) {
      try {
        const userCredential = await signInAnonymously(authRef.current);
        await updateProfile(userCredential.user, { displayName: username });
      } catch (e) {
        // Fallback local user
        setCurrentUser({ uid: 'local', displayName: username } as User);
      }
    } else {
      setCurrentUser({ uid: 'local', displayName: username } as User);
    }
    setIsLoggingIn(false);
  };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center bg-[#0F172A]"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} lang={loginLang} setLang={setLoginLang} isLoggingIn={isLoggingIn} />;
  
  return <MainContent user={currentUser} db={dbRef.current!} auth={authRef.current!} appId={appIdRef.current} />;
}