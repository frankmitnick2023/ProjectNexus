import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, updateProfile, signOut, Auth, User } from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, 
  serverTimestamp, query, orderBy, Firestore, enableIndexedDbPersistence 
} from 'firebase/firestore';
import { 
  Layout, Plus, Search, Folder, 
  LogOut, Loader2, Sparkles, 
  Workflow, Trash2, LogIn, UserCircle, 
  AlertTriangle, Cloud, CheckCircle2, 
  BrainCircuit, Network, List, MoreHorizontal, Calendar, ArrowLeft, CloudLightning, RefreshCw, HardDrive, Circle, 
  Zap, Code2, ShoppingCart, Gamepad2, Database
} from 'lucide-react';

// ==============================================================================
// 1. 🟢 配置区域
// ==============================================================================
const MANUAL_CONFIG = {
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58", 
  authDomain: "", 
  projectId: "project-nexus-demo", 
  storageBucket: "", 
  messagingSenderId: "", 
  appId: "" 
};

// ==============================================================================
// 2. 🧠 智能伪 AI 引擎 (Smart Mock AI Engine)
//    在没有接入真实 LLM API 的情况下，根据关键词动态生成合理的项目结构
// ==============================================================================
const generateSmartBlueprint = (prompt: string) => {
  const p = prompt.toLowerCase();
  let modules = [];
  let type = "General";

  // 场景 A: 电商/商城
  if (p.includes("shop") || p.includes("store") || p.includes("commerce") || p.includes("卖") || p.includes("商城")) {
    type = "E-Commerce";
    modules = [
      { id: 'm1', title: '用户中心 (User Auth)', isCompleted: true, timeEstimate: '8h', subTasks: [{id: 's1', title: 'Login UI', isCompleted: true}] },
      { id: 'm2', title: '商品目录 (Catalog)', isCompleted: false, timeEstimate: '12h', subTasks: [{id: 's2', title: 'Product Card', isCompleted: false}] },
      { id: 'm3', title: '购物车逻辑 (Cart)', isCompleted: false, timeEstimate: '6h' },
      { id: 'm4', title: '支付对接 (Stripe/Alipay)', isCompleted: false, timeEstimate: '10h' },
      { id: 'm5', title: '订单管理后台 (Admin)', isCompleted: false, timeEstimate: '15h' },
    ];
  } 
  // 场景 B: 游戏
  else if (p.includes("game") || p.includes("play") || p.includes("unity") || p.includes("游戏")) {
    type = "Game Dev";
    modules = [
      { id: 'm1', title: '核心玩法原型 (Core Loop)', isCompleted: true, timeEstimate: '20h' },
      { id: 'm2', title: '物理引擎配置 (Physics)', isCompleted: false, timeEstimate: '8h' },
      { id: 'm3', title: '美术资源导入 (Assets)', isCompleted: false, timeEstimate: '12h' },
      { id: 'm4', title: '音效与UI (Audio/GUI)', isCompleted: false, timeEstimate: '6h' },
      { id: 'm5', title: '排行榜系统 (Leaderboard)', isCompleted: false, timeEstimate: '5h' },
    ];
  }
  // 场景 C: 数据/后台/管理系统
  else if (p.includes("data") || p.includes("crm") || p.includes("dashboard") || p.includes("管理") || p.includes("数据")) {
    type = "SaaS / Dashboard";
    modules = [
      { id: 'm1', title: '数据库设计 (Schema)', isCompleted: true, timeEstimate: '6h' },
      { id: 'm2', title: 'API 接口开发 (Backend)', isCompleted: false, timeEstimate: '15h' },
      { id: 'm3', title: '前端仪表盘 (Charts)', isCompleted: false, timeEstimate: '10h' },
      { id: 'm4', title: '权限管理 (RBAC)', isCompleted: false, timeEstimate: '8h' },
    ];
  }
  // 场景 D: 默认通用
  else {
    modules = [
      { id: 'm1', title: '需求分析 (Requirements)', isCompleted: true, timeEstimate: '4h' },
      { id: 'm2', title: 'UI/UX 设计 (Design)', isCompleted: false, timeEstimate: '12h' },
      { id: 'm3', title: '前端开发 (Frontend)', isCompleted: false, timeEstimate: '20h' },
      { id: 'm4', title: '后端开发 (Backend)', isCompleted: false, timeEstimate: '20h' },
      { id: 'm5', title: '测试与部署 (Deploy)', isCompleted: false, timeEstimate: '6h' },
    ];
  }

  return { type, modules };
};

// ==============================================================================
// 3. 💾 数据结构 & 本地引擎
// ==============================================================================
const LOCAL_STORAGE_KEY = 'nexus_projects_v11';
const USER_STORAGE_KEY = 'nexus_user_session_v1'; // 新增：保存用户登录状态

type SubTask = { id: string; title: string; isCompleted: boolean; };
type Module = { id: string; title: string; isCompleted: boolean; timeEstimate: string; subTasks?: SubTask[]; };
type Project = { 
  id: string; 
  title: string; 
  description: string; 
  progress: number; 
  createdAt: number; 
  modules?: Module[]; 
  projectType?: string; // 新增：项目类型
  syncStatus: 'synced' | 'pending' | 'error';
};

// ==============================================================================
// 4. 🌍 多语言 (扁平化)
// ==============================================================================
const TRANSLATIONS_FLAT = {
  en: {
    login_title: "Nexus Workspace", login_subtitle: "Local-First + Smart AI.", login_placeholder: "Your Name", login_btn: "Enter",
    sidebar_workspace: "WORKSPACE", sidebar_myProjects: "My Projects", sidebar_team: "Team", sidebar_ai: "AI Studio", sidebar_logout: "Log Out",
    dash_welcome: "Welcome back,", dash_subtitle: "Your creative command center.", dash_newProject: "New Project", dash_noProjects: "No projects. Create one!", dash_createBtn: "Create", dash_aiTitle: "AI Planner", dash_aiDesc: "Turn ideas into blueprints.",
    detail_overview: "Overview", detail_blocks: "Task Blocks", detail_flow: "Blueprint", detail_list: "List",
    modal_title: "AI Project Planner", modal_desc: "Describe your idea (e.g. 'A shopping app'), AI will break it down.", modal_placeholder: "E.g. I want to build a crypto trading bot...", modal_cancel: "Cancel", modal_generate: "Generate", modal_name: "Project Name", modal_descLabel: "Description", modal_create: "Create",
    status_saved: "Cloud Synced", status_pending: "Local Only", status_error: "Sync Failed", status_connected: "Online", status_disconnected: "Offline", status_permission: "Permission Denied"
  },
  zh: {
    login_title: "Nexus 工作台", login_subtitle: "记忆化登录 + 智能切分", login_placeholder: "你的昵称", login_btn: "进入工作区",
    sidebar_workspace: "工作区", sidebar_myProjects: "我的项目库", sidebar_team: "团队协作", sidebar_ai: "AI 创意工坊", sidebar_logout: "退出登录",
    dash_welcome: "欢迎回来，", dash_subtitle: "你的创意指挥中心。", dash_newProject: "新建项目", dash_noProjects: "暂无项目。创建一个吧！", dash_createBtn: "立即创建", dash_aiTitle: "AI 规划师", dash_aiDesc: "输入想法，自动生成流程图。",
    detail_overview: "概览", detail_blocks: "任务积木", detail_flow: "蓝图视图", detail_list: "列表视图",
    modal_title: "AI 项目规划师", modal_desc: "描述你的想法（如“做个射击游戏”），AI 帮你切碎成任务。", modal_placeholder: "例如：我想做一个类似淘宝的商城...", modal_cancel: "取消", modal_generate: "智能生成", modal_name: "项目名称", modal_descLabel: "项目简介", modal_create: "确认创建",
    status_saved: "已同步云端", status_pending: "仅本地保存", status_error: "同步失败", status_connected: "云端已连接", status_disconnected: "网络已断开", status_permission: "权限被拒绝"
  }
};

const useSafeT = (lang: 'en' | 'zh') => {
  const base = TRANSLATIONS_FLAT['en'];
  const target = TRANSLATIONS_FLAT[lang] || base;
  return { ...base, ...target }; 
};

// ==============================================================================
// 5. 🧩 蓝图视图 (Blueprint View - 增强版)
// ==============================================================================
const BlueprintView = ({ project }: { project: Project }) => (
  <div className="relative w-full h-full overflow-auto bg-slate-50/50 p-10 flex items-center justify-start min-h-[500px]">
    <div className="flex gap-20 items-start animate-in fade-in zoom-in-95 duration-500">
      
      {/* 根节点 (大项目) */}
      <div className="relative z-10 mt-10">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 border-4 border-indigo-100 w-72 text-center relative group hover:scale-105 transition-transform duration-300">
           <div className="absolute -top-4 -right-4 bg-indigo-500 rounded-xl p-3 shadow-lg shadow-indigo-500/40">
             {project.projectType === 'Game Dev' ? <Gamepad2 size={24}/> : project.projectType === 'E-Commerce' ? <ShoppingCart size={24}/> : <Layout size={24}/>}
           </div>
           <h3 className="font-bold text-xl mb-1">{project.title}</h3>
           <div className="text-xs text-indigo-200 uppercase tracking-wider font-bold mb-4">{project.projectType || 'General Project'}</div>
           <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
             <div className="bg-indigo-500 h-full" style={{width: `${project.progress}%`}}></div>
           </div>
           {/* 连接点 */}
           <div className="absolute top-1/2 -right-3 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white" />
        </div>
      </div>

      {/* 模块层级 (切碎的小项目) */}
      <div className="flex flex-col gap-6 relative">
         {/* 垂直连线 */}
         <div className="absolute left-[-40px] top-12 bottom-12 w-1 bg-slate-200 rounded-full"></div>

         {project.modules?.map((module, idx) => (
           <div key={module.id} className="relative flex items-center group">
             {/* 水平连线 */}
             <div className="w-20 h-1 bg-slate-200 absolute -left-20 top-1/2 transition-all group-hover:bg-indigo-400 group-hover:w-[84px]"></div>
             <div className="absolute -left-[44px] top-1/2 w-3 h-3 bg-slate-300 rounded-full transform -translate-y-1/2 border-2 border-white group-hover:bg-indigo-500 transition-colors"></div>
             
             <div className={`w-80 p-5 rounded-xl border-2 transition-all bg-white hover:shadow-lg hover:-translate-y-1 duration-200 ${module.isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 hover:border-indigo-300'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded">#{idx+1}</span>
                    <h4 className={`font-bold ${module.isCompleted ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-slate-800'}`}>{module.title}</h4>
                  </div>
                  {module.isCompleted ? <CheckCircle2 size={18} className="text-emerald-500"/> : <Circle size={18} className="text-slate-300"/>}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><Calendar size={10}/> {module.timeEstimate}</span>
                  <span className="text-xs text-indigo-400 font-medium">Assign to AI</span>
                </div>
             </div>
           </div>
         ))}
      </div>
    </div>
  </div>
);

// ==============================================================================
// 6. 🔐 登录组件 (支持自动登录)
// ==============================================================================
const LoginScreen = ({ onLogin, lang, setLang, isLoggingIn }: any) => {
  const [name, setName] = useState('');
  const t = useSafeT(lang);

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-between items-start mb-8">
           <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200"><BrainCircuit className="text-white" size={32} /></div>
           <div className="flex gap-2">
             <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'en' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>EN</button>
             <button onClick={() => setLang('zh')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'zh' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>中文</button>
           </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.login_title}</h1>
        <p className="text-slate-500 mb-8">{t.login_subtitle}</p>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(name); }} className="space-y-4" noValidate>
          <input 
            autoComplete="off" spellCheck={false} data-lpignore="true" 
            value={name} onChange={(e) => setName(e.target.value)} 
            placeholder={t.login_placeholder} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800" 
            required 
          />
          <button disabled={isLoggingIn || !name.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
            {isLoggingIn ? "..." : t.login_btn}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==============================================================================
// 7. 🏗️ 主应用组件
// ==============================================================================
const MainContent = ({ user, db, auth, appId, logout }: any) => {
  const [lang, setLang] = useState<'en' | 'zh'>('zh'); 
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [projectMode, setProjectMode] = useState<'list' | 'blueprint'>('list');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'permission-denied'>('connected');
  const [isCreating, setIsCreating] = useState(false);

  const t = useSafeT(lang);

  // 🔄 加载本地数据
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.sort((a: any, b: any) => b.createdAt - a.createdAt);
        setProjects(parsed);
      } catch (e) {}
    }
  }, []);

  // 🔄 监听云端
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNetworkStatus('connected');
      const cloudProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        syncStatus: doc.metadata.hasPendingWrites ? 'pending' : 'synced'
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
      if (error.code === 'permission-denied') setNetworkStatus('permission-denied');
      else setNetworkStatus('disconnected');
    });
    return () => unsubscribe();
  }, [user, db, appId]);

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
      } catch (err) { console.error(err); }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    
    // 默认手动创建只有2个通用步骤
    const newProject: Project = {
      id: `local-${Date.now()}`,
      title: newProjectTitle,
      description: newProjectDesc || '',
      progress: 0,
      createdAt: Date.now(),
      syncStatus: 'pending',
      modules: [
        { id: 'm1', title: 'Phase 1: Planning', isCompleted: false, timeEstimate: '2h' },
        { id: 'm2', title: 'Phase 2: Execution', isCompleted: false, timeEstimate: '10h' }
      ]
    };

    saveProject(newProject);
    setShowCreateModal(false);
    setNewProjectTitle('');
    setNewProjectDesc('');
  };

  // 🟢 智能 AI 生成逻辑 (NLP 伪引擎)
  const handleAICreate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    // 模拟思考
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 调用智能分析
    const { type, modules } = generateSmartBlueprint(aiPrompt);

    const newProject: Project = {
      id: `local-${Date.now()}`,
      title: aiPrompt.length > 20 ? aiPrompt.slice(0, 20) + "..." : aiPrompt,
      description: `AI Generated for: "${aiPrompt}"`,
      progress: 0,
      createdAt: Date.now(),
      syncStatus: 'pending',
      projectType: type, // 标记类型，用于蓝图显示图标
      modules: modules,
    };

    saveProject(newProject);
    setIsGenerating(false);
    setShowAIModal(false);
    setAiPrompt('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    if (db && user && !id.startsWith('local-')) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id)); } catch (e) {}
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 flex-shrink-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20"><BrainCircuit size={22} className="text-white" /></div>
          <div><h1 className="font-bold text-lg tracking-tight">Project Nexus</h1><p className="text-[10px] text-indigo-300 font-medium tracking-wider mt-1 opacity-80">{t.sidebar_workspace}</p></div>
        </div>
        
        <div className="px-5 mb-6">
           <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors border ${
             networkStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
             networkStatus === 'permission-denied' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
             'bg-amber-500/10 text-amber-400 border-amber-500/20'
           }`}>
              {networkStatus === 'connected' ? <CloudLightning size={14} /> : <AlertTriangle size={14} />}
              {networkStatus === 'connected' ? t.status_connected : 
               networkStatus === 'permission-denied' ? t.status_permission : t.status_disconnected}
           </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <div onClick={() => setView('dashboard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${view === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-800/50'}`}>
            <Folder size={18} /> {t.sidebar_myProjects}
          </div>
          <div onClick={() => setShowAIModal(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 cursor-pointer">
            <Sparkles size={18} className="text-purple-400"/> {t.sidebar_ai}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/60 bg-[#0B1120]">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">{user.displayName?.[0] || 'U'}</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium text-slate-200 truncate">{user.displayName || 'User'}</div></div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400"><LogOut size={16} /></button>
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
            <h2 className="text-lg font-bold text-slate-800">{view === 'dashboard' ? t.sidebar_myProjects : activeProject?.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {view === 'detail' && (
               <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button onClick={() => setProjectMode('list')} className={`p-1.5 rounded-md text-xs font-bold flex gap-1 ${projectMode==='list' ? 'bg-white shadow' : 'text-slate-500'}`}><List size={14}/> {t.detail_list}</button>
                 <button onClick={() => setProjectMode('blueprint')} className={`p-1.5 rounded-md text-xs font-bold flex gap-1 ${projectMode==='blueprint' ? 'bg-white shadow' : 'text-slate-500'}`}><Network size={14}/> {t.detail_flow}</button>
               </div>
            )}
            <button onClick={() => setShowCreateModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg">
              <Plus size={16} /> {t.dash_newProject}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
          
          {networkStatus === 'permission-denied' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle className="text-red-500 shrink-0" />
              <div>
                 <h3 className="font-bold text-red-800">数据库权限被拒绝</h3>
                 <p className="text-sm text-red-600 mt-1">请去 Firebase 控制台 到 Firestore Database 到 Rules，将规则改为 <code>allow read, write: if true;</code></p>
              </div>
            </div>
          )}

          {view === 'dashboard' && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* AI Card */}
                 <div onClick={() => setShowAIModal(true)} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl transition-all group flex flex-col justify-between">
                    <div>
                      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><BrainCircuit size={24} /></div>
                      <h3 className="font-bold text-xl mb-2">{t.dash_aiTitle}</h3>
                      <p className="text-indigo-100 text-sm opacity-90">{t.dash_aiDesc}</p>
                    </div>
                 </div>
                 {/* Projects */}
                 {projects.map(project => (
                   <div key={project.id} onClick={() => { setActiveProject(project); setView('detail'); setProjectMode('blueprint'); }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden">
                     {project.syncStatus === 'syncing' && (
                       <div className="absolute top-0 right-0 p-2"><RefreshCw size={12} className="text-amber-500 animate-spin"/></div>
                     )}
                     <div>
                       <div className="flex justify-between mb-3">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{project.projectType || 'General'}</span>
                       </div>
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
                   <h3 className="font-bold mb-4 flex items-center gap-2"><Folder className="text-indigo-500"/> {t.detail_blocks}</h3>
                   <div className="space-y-3">
                     {activeProject.modules?.map((m, i) => (
                       <div key={m.id || i} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50/50">
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
              <h3 className="text-xl font-bold mb-4">{t.modal_title}</h3>
              <form onSubmit={handleCreateProject}>
                <input 
                  autoComplete="off" spellCheck={false} data-lpignore="true" 
                  autoFocus value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t.modal_name} required 
                />
                <textarea 
                  autoComplete="off" spellCheck={false} data-lpignore="true"
                  value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 mb-6 outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t.modal_descLabel} 
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">{t.modal_cancel}</button>
                  <button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                    {isCreating ? <Loader2 className="animate-spin" size={16}/> : <CloudLightning size={16}/>} {t.modal_create}
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
                <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles /> {t.modal_title}</h3>
              </div>
              <textarea 
                autoComplete="off" spellCheck={false} data-lpignore="true"
                value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} 
                className="w-full h-32 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder={t.modal_placeholder} 
              />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">{t.modal_cancel}</button>
                <button onClick={handleAICreate} disabled={!aiPrompt || isGenerating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                  {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} {t.modal_generate}
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

        // 1. 先尝试从本地恢复登录
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }

        if (config && config.apiKey) {
          if (!getApps().length) appRef.current = initializeApp(config);
          else appRef.current = getApp();
          authRef.current = getAuth(appRef.current);
          dbRef.current = getFirestore(appRef.current);
          if (typeof window !== 'undefined' && window.__app_id) appIdRef.current = window.__app_id;
          
          try { await enableIndexedDbPersistence(dbRef.current); } catch (e) {}

          onAuthStateChanged(authRef.current, (u) => {
            // 如果 Firebase 登录成功，更新本地 Session
            if (u) {
              const sessionUser = { uid: u.uid, displayName: u.displayName || 'User' };
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
              setCurrentUser(sessionUser as any);
            }
          });
        }
      } catch (e: any) { console.error("Init Error:", e); }
      finally { setIsReady(true); }
    };
    init();
  }, []);

  const handleLogin = async (username: string) => {
    setIsLoggingIn(true);
    const sessionUser = { uid: 'local-' + Date.now(), displayName: username };
    
    // 优先尝试 Firebase
    if (authRef.current) {
      try {
        const userCredential = await signInAnonymously(authRef.current);
        await updateProfile(userCredential.user, { displayName: username });
        const u = userCredential.user;
        const fbUser = { uid: u.uid, displayName: username };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fbUser));
        setCurrentUser(fbUser as any);
      } catch (e) {
        // 降级：纯本地会话
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
        setCurrentUser(sessionUser as any);
      }
    } else {
      // 纯本地会话
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
      setCurrentUser(sessionUser as any);
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    if (authRef.current) await signOut(authRef.current);
    setCurrentUser(null);
  };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center bg-[#0F172A]"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} lang={loginLang} setLang={setLoginLang} isLoggingIn={isLoggingIn} />;
  
  return <MainContent user={currentUser} db={dbRef.current!} auth={authRef.current!} appId={appIdRef.current} logout={handleLogout} />;
}