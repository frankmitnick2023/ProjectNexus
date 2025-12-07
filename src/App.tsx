import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, updateProfile, signOut, Auth, User } from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, 
  serverTimestamp, query, orderBy, Firestore, enableIndexedDbPersistence 
} from 'firebase/firestore';
import { 
  Layout, Plus, Search, Folder, 
  LogOut, Loader2, Sparkles, 
  Workflow, Trash2, LogIn, UserCircle, 
  AlertTriangle, Cloud, CheckCircle2, 
  BrainCircuit, Network, List, MoreHorizontal, Calendar, ArrowLeft, CloudLightning, RefreshCw, HardDrive, Circle, 
  Zap, Code2, ShoppingCart, Gamepad2, Database, MessageCircle, Map, Video, Edit3, Save
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
// 2. 🧠 AI 引擎 (保持不变)
// ==============================================================================
const generateSmartBlueprint = (prompt: string) => {
  const p = prompt.toLowerCase();
  let modules = [];
  let type = "General";

  if (p.includes("chat") || p.includes("social") || p.includes("社交") || p.includes("微信")) {
    type = "Social App";
    modules = [
      { id: 'm1', title: '账号体系 (Identity)', isCompleted: false, timeEstimate: '10h' },
      { id: 'm2', title: '实时通讯 (WebSocket)', isCompleted: false, timeEstimate: '25h' },
      { id: 'm3', title: '好友关系链 (Graph)', isCompleted: false, timeEstimate: '15h' },
      { id: 'm4', title: '消息存储 (Storage)', isCompleted: false, timeEstimate: '20h' },
    ];
  } else if (p.includes("shop") || p.includes("store") || p.includes("电商") || p.includes("卖")) {
    type = "E-Commerce";
    modules = [
      { id: 'm1', title: '商品中心 (Product)', isCompleted: false, timeEstimate: '15h' },
      { id: 'm2', title: '交易下单 (Order)', isCompleted: false, timeEstimate: '20h' },
      { id: 'm3', title: '支付网关 (Pay)', isCompleted: false, timeEstimate: '10h' },
    ];
  } else if (p.includes("game") || p.includes("游戏")) {
    type = "Game Dev";
    modules = [
      { id: 'm1', title: '游戏循环 (Loop)', isCompleted: false, timeEstimate: '8h' },
      { id: 'm2', title: '场景搭建 (Level)', isCompleted: false, timeEstimate: '30h' },
      { id: 'm3', title: '角色控制 (Player)', isCompleted: false, timeEstimate: '15h' },
    ];
  } else {
    modules = [
      { id: 'm1', title: '需求分析', isCompleted: false, timeEstimate: '5h' },
      { id: 'm2', title: '架构设计', isCompleted: false, timeEstimate: '8h' },
      { id: 'm3', title: '核心开发', isCompleted: false, timeEstimate: '20h' },
      { id: 'm4', title: '测试发布', isCompleted: false, timeEstimate: '6h' },
    ];
  }
  return { type, modules };
};

// ==============================================================================
// 3. 💾 数据结构
// ==============================================================================
const MASTER_STORAGE_KEY = 'project_nexus_master_data';
const MASTER_USER_KEY = 'project_nexus_master_user';

type Module = { id: string; title: string; isCompleted: boolean; timeEstimate: string; };
type Project = { 
  id: string; 
  title: string; 
  description: string; 
  progress: number; 
  createdAt: number; 
  modules?: Module[]; 
  projectType?: string; 
  syncStatus: 'synced' | 'pending' | 'error';
};

// ==============================================================================
// 4. 🌍 多语言
// ==============================================================================
const TRANSLATIONS_FLAT = {
  en: {
    login_title: "Nexus Workspace", login_subtitle: "Editable & Persistent.", login_placeholder: "Your Name", login_btn: "Enter",
    sidebar_workspace: "WORKSPACE", sidebar_myProjects: "Projects", sidebar_ai: "AI Studio", sidebar_logout: "Log Out",
    dash_welcome: "Welcome,", dash_subtitle: "Click items to edit or toggle progress.", dash_newProject: "New Project", dash_noProjects: "No projects.", dash_createBtn: "Create", dash_aiTitle: "AI Planner", dash_aiDesc: "Auto-breakdown ideas.",
    detail_overview: "Overview", detail_blocks: "Modules", detail_flow: "Blueprint", detail_list: "List",
    modal_title: "AI Project Planner", modal_desc: "Describe your app idea...", modal_placeholder: "E.g. A crypto bot...", modal_cancel: "Cancel", modal_generate: "Generate", modal_name: "Project Name", modal_descLabel: "Description", modal_create: "Create", modal_edit: "Edit Project", modal_save: "Save Changes",
    status_saved: "Synced", status_pending: "Local", status_error: "Error", status_connected: "Online", status_disconnected: "Offline", status_permission: "Auth Error"
  },
  zh: {
    login_title: "Nexus 工作台", login_subtitle: "支持编辑与进度追踪", login_placeholder: "你的昵称", login_btn: "进入工作区",
    sidebar_workspace: "工作区", sidebar_myProjects: "我的项目库", sidebar_ai: "AI 架构师", sidebar_logout: "退出登录",
    dash_welcome: "欢迎回来，", dash_subtitle: "点击卡片即可编辑，点击积木可标记完成。", dash_newProject: "新建项目", dash_noProjects: "暂无项目。", dash_createBtn: "立即创建", dash_aiTitle: "AI 架构师", dash_aiDesc: "输入想法，自动生成架构。",
    detail_overview: "概览", detail_blocks: "积木模块", detail_flow: "架构蓝图", detail_list: "列表视图",
    modal_title: "AI 项目架构师", modal_desc: "描述你的想法，AI 帮你切分模块。", modal_placeholder: "例如：做一个外卖平台...", modal_cancel: "取消", modal_generate: "智能生成", modal_name: "项目名称", modal_descLabel: "项目简介", modal_create: "确认创建", modal_edit: "编辑项目信息", modal_save: "保存修改",
    status_saved: "已同步", status_pending: "本地存储", status_error: "同步失败", status_connected: "云端已连接", status_disconnected: "网络已断开", status_permission: "权限被拒绝"
  }
};

const useSafeT = (lang: 'en' | 'zh') => {
  const base = TRANSLATIONS_FLAT['en'];
  const target = TRANSLATIONS_FLAT[lang] || base;
  return { ...base, ...target }; 
};

// ==============================================================================
// 5. 🧩 可交互蓝图视图 (Interactive Blueprint)
// ==============================================================================
const BlueprintView = ({ project, onToggleModule }: { project: Project, onToggleModule: (mid: string) => void }) => (
  <div className="relative w-full h-full overflow-auto bg-slate-50/50 p-10 flex items-center justify-start min-h-[500px]">
    <div className="flex gap-24 items-start animate-in fade-in zoom-in-95 duration-500">
      
      {/* 根节点 */}
      <div className="relative z-10 mt-12 sticky top-10">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-2xl shadow-indigo-500/20 border-4 border-indigo-100 w-80 text-center relative">
           <div className="absolute -top-5 -right-5 bg-indigo-600 rounded-2xl p-3 shadow-lg shadow-indigo-500/40">
             {project.projectType === 'Game Dev' ? <Gamepad2 size={28}/> : project.projectType === 'E-Commerce' ? <ShoppingCart size={28}/> : <Layout size={28}/>}
           </div>
           <h3 className="font-bold text-2xl mb-2 tracking-tight">{project.title}</h3>
           <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono"><span>PROGRESS</span><span>{Math.round(project.progress)}%</span></div>
           <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden border border-slate-600">
             <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-1000" style={{width: `${project.progress}%`}}></div>
           </div>
           <div className="absolute top-1/2 -right-3 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white" />
        </div>
      </div>

      {/* 模块层级 (可点击) */}
      <div className="flex flex-col gap-8 relative">
         <div className="absolute left-[-48px] top-20 bottom-20 w-1 bg-slate-200 rounded-full"></div>
         {project.modules?.map((module, idx) => (
           <div key={module.id} className="relative flex items-center group cursor-pointer" onClick={() => onToggleModule(module.id)}>
             <div className={`w-24 h-1 absolute -left-24 top-1/2 transition-all group-hover:w-[100px] ${module.isCompleted ? 'bg-emerald-400' : 'bg-slate-200 group-hover:bg-indigo-400'}`}></div>
             <div className={`absolute -left-[48px] top-1/2 w-3 h-3 rounded-full transform -translate-y-1/2 border-2 border-white transition-colors ${module.isCompleted ? 'bg-emerald-500' : 'bg-slate-300 group-hover:bg-indigo-500'}`}></div>
             
             <div className={`w-96 p-5 rounded-xl border-2 transition-all hover:shadow-xl hover:-translate-y-1 duration-200 ${module.isCompleted ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-400'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${module.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>STAGE {idx+1}</span>
                    <h4 className={`font-bold text-lg ${module.isCompleted ? 'text-emerald-800 line-through decoration-emerald-300' : 'text-slate-800'}`}>{module.title}</h4>
                  </div>
                  {module.isCompleted ? <CheckCircle2 size={24} className="text-emerald-500 fill-emerald-100"/> : <Circle size={24} className="text-slate-300"/>}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5 bg-white/50 px-2.5 py-1.5 rounded-lg font-medium border border-slate-200/50">
                    <Calendar size={12}/> {module.timeEstimate}
                  </span>
                </div>
             </div>
           </div>
         ))}
      </div>
    </div>
  </div>
);

// ==============================================================================
// 6. 🔐 登录组件
// ==============================================================================
const LoginScreen = ({ onLogin, lang, setLang, isLoggingIn }: any) => {
  const [name, setName] = useState('');
  const t = useSafeT(lang);
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-between items-start mb-8">
           <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg"><BrainCircuit className="text-white" size={32} /></div>
           <div className="flex gap-2"><button onClick={() => setLang('en')} className={`px-2 py-1 text-xs font-bold rounded ${lang==='en'?'bg-indigo-100 text-indigo-700':'text-slate-400'}`}>EN</button><button onClick={() => setLang('zh')} className={`px-2 py-1 text-xs font-bold rounded ${lang==='zh'?'bg-indigo-100 text-indigo-700':'text-slate-400'}`}>中文</button></div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.login_title}</h1>
        <p className="text-slate-500 mb-8">{t.login_subtitle}</p>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(name); }} className="space-y-4">
          <input autoComplete="new-password" spellCheck={false} data-lpignore="true" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.login_placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" required />
          <button disabled={isLoggingIn || !name.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : <LogIn size={20} />} {isLoggingIn ? "..." : t.login_btn}
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
  
  // 编辑模式状态
  const [editMode, setEditMode] = useState(false); // 是否在编辑模式
  const [editingId, setEditingId] = useState<string | null>(null); // 当前正在编辑的项目ID
  
  // 表单状态 (用于创建和编辑)
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  
  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [projectMode, setProjectMode] = useState<'list' | 'blueprint'>('list');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'permission-denied'>('connected');

  const t = useSafeT(lang);

  // 🔄 加载本地数据
  useEffect(() => {
    const saved = localStorage.getItem(MASTER_STORAGE_KEY);
    if (saved) { try { setProjects(JSON.parse(saved).sort((a:any,b:any)=>b.createdAt-a.createdAt)); } catch(e){} }
  }, []);

  // 🔄 监听云端
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNetworkStatus('connected');
      const cloudProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), syncStatus: doc.metadata.hasPendingWrites ? 'pending' : 'synced' })) as Project[];
      setProjects(prev => {
        const cloudIds = new Set(cloudProjects.map(p => p.id));
        const pendingLocal = prev.filter(p => !cloudIds.has(p.id));
        const merged = [...pendingLocal, ...cloudProjects];
        merged.sort((a, b) => b.createdAt - a.createdAt);
        localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(merged));
        // 如果当前正在查看的项目被更新了，也要同步更新 ActiveProject
        if (activeProject) {
          const updatedActive = merged.find(p => p.id === activeProject.id);
          if (updatedActive) setActiveProject(updatedActive);
        }
        return merged;
      });
    }, (error) => {
      if (error.code === 'permission-denied') setNetworkStatus('permission-denied'); else setNetworkStatus('disconnected');
    });
    return () => unsubscribe();
  }, [user, db, appId, activeProject?.id]);

  // 通用保存/更新逻辑
  const saveOrUpdateProject = async (projectData: Project, isUpdate = false) => {
    let updatedList;
    
    if (isUpdate) {
      updatedList = projects.map(p => p.id === projectData.id ? projectData : p);
    } else {
      updatedList = [projectData, ...projects];
    }
    
    setProjects(updatedList);
    localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(updatedList));
    if (activeProject && activeProject.id === projectData.id) setActiveProject(projectData);

    if (db && user) {
      try {
        const cleanData = { ...projectData, syncStatus: undefined };
        if (isUpdate && !projectData.id.startsWith('local-')) {
           // 更新云端
           await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', projectData.id), cleanData);
        } else if (!isUpdate) {
           // 新建云端
           const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), cleanData);
           // 更新本地 ID
           setProjects(prev => {
             const newList = prev.map(p => p.id === projectData.id ? { ...p, id: docRef.id, syncStatus: 'synced' as const } : p);
             localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(newList));
             return newList;
           });
        }
      } catch (err) { console.error("Sync error", err); }
    }
  };

  // 🟢 处理创建/编辑提交
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editMode && editingId) {
      // 编辑模式
      const target = projects.find(p => p.id === editingId);
      if (target) {
        const updated = { ...target, title: formTitle, description: formDesc };
        saveOrUpdateProject(updated, true);
      }
    } else {
      // 创建模式
      const newProject: Project = {
        id: `local-${Date.now()}`,
        title: formTitle,
        description: formDesc || '',
        progress: 0,
        createdAt: Date.now(),
        syncStatus: 'pending',
        projectType: 'General',
        modules: [ { id: 'm1', title: 'Phase 1', isCompleted: false, timeEstimate: '2h' } ]
      };
      saveOrUpdateProject(newProject, false);
    }
    closeModal();
  };

  const openCreateModal = () => {
    setEditMode(false);
    setFormTitle('');
    setFormDesc('');
    setShowCreateModal(true);
  };

  const openEditModal = (p: Project) => {
    setEditMode(true);
    setEditingId(p.id);
    setFormTitle(p.title);
    setFormDesc(p.description);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditMode(false);
    setEditingId(null);
  };

  // 🟢 模块点击交互 (Toggle Module)
  const toggleModule = (moduleId: string) => {
    if (!activeProject) return;
    
    const newModules = activeProject.modules?.map(m => 
      m.id === moduleId ? { ...m, isCompleted: !m.isCompleted } : m
    );
    
    // 重新计算进度
    const total = newModules?.length || 0;
    const completed = newModules?.filter(m => m.isCompleted).length || 0;
    const newProgress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const updatedProject = { ...activeProject, modules: newModules, progress: newProgress };
    saveOrUpdateProject(updatedProject, true);
  };

  // 🟢 AI 创建
  const handleAICreate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { type, modules } = generateSmartBlueprint(aiPrompt);
    const newProject: Project = {
      id: `local-${Date.now()}`,
      title: aiPrompt.length > 20 ? aiPrompt.slice(0, 20) + "..." : aiPrompt,
      description: `AI Generated: "${aiPrompt}"`,
      progress: 0,
      createdAt: Date.now(),
      syncStatus: 'pending',
      projectType: type,
      modules: modules,
    };
    saveOrUpdateProject(newProject, false);
    setIsGenerating(false);
    setShowAIModal(false);
    setAiPrompt('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(updated));
    if (activeProject?.id === id) setView('dashboard');
    if (db && user && !id.startsWith('local-')) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id)); } catch (e) {}
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 flex-shrink-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg"><BrainCircuit size={22} className="text-white" /></div>
          <div><h1 className="font-bold text-lg tracking-tight">Project Nexus</h1><p className="text-[10px] text-indigo-300 font-medium tracking-wider mt-1 opacity-80">{t.sidebar_workspace}</p></div>
        </div>
        <div className="px-5 mb-6">
           <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors border ${networkStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {networkStatus === 'connected' ? <CloudLightning size={14} /> : <AlertTriangle size={14} />}
              {networkStatus === 'connected' ? t.status_connected : t.status_disconnected}
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
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {view === 'dashboard' ? t.sidebar_myProjects : activeProject?.title}
              {view === 'detail' && activeProject && (
                <button onClick={() => openEditModal(activeProject)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"><Edit3 size={14}/></button>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {view === 'detail' && (
               <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button onClick={() => setProjectMode('list')} className={`p-1.5 rounded-md text-xs font-bold flex gap-1 ${projectMode==='list' ? 'bg-white shadow' : 'text-slate-500'}`}><List size={14}/> {t.detail_list}</button>
                 <button onClick={() => setProjectMode('blueprint')} className={`p-1.5 rounded-md text-xs font-bold flex gap-1 ${projectMode==='blueprint' ? 'bg-white shadow' : 'text-slate-500'}`}><Network size={14}/> {t.detail_flow}</button>
               </div>
            )}
            <button onClick={openCreateModal} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg">
              <Plus size={16} /> {t.dash_newProject}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
          {/* 权限提示 */}
          {networkStatus === 'permission-denied' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0" />
              <div>
                 <h3 className="font-bold text-red-800">数据库权限被拒绝 / Permission Denied</h3>
                 <p className="text-sm text-red-600 mt-1">请去 Firebase 控制台 Rules 将规则改为 <code>allow read, write: if true;</code></p>
              </div>
            </div>
          )}

          {view === 'dashboard' && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div onClick={() => setShowAIModal(true)} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl transition-all group flex flex-col justify-between">
                    <div>
                      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Sparkles size={24} /></div>
                      <h3 className="font-bold text-xl mb-2">{t.dash_aiTitle}</h3>
                      <p className="text-indigo-100 text-sm opacity-90">{t.dash_aiDesc}</p>
                    </div>
                 </div>
                 {projects.map(project => (
                   <div key={project.id} onClick={() => { setActiveProject(project); setView('detail'); setProjectMode('blueprint'); }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden">
                     {project.syncStatus === 'syncing' && <div className="absolute top-0 right-0 p-2"><RefreshCw size={12} className="text-amber-500 animate-spin"/></div>}
                     <div>
                       <h3 className="font-bold text-slate-800 text-lg mb-1">{project.title}</h3>
                       <p className="text-slate-500 text-xs line-clamp-2 mb-4">{project.description}</p>
                     </div>
                     <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Zap size={12} className="text-indigo-400"/> {project.progress}%</span>
                        <div className="flex gap-2">
                           <div onClick={(e) => { e.stopPropagation(); openEditModal(project); }} className="hover:text-indigo-500 p-1"><Edit3 size={14}/></div>
                           <div onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="hover:text-red-500 p-1"><Trash2 size={14}/></div>
                        </div>
                     </div>
                     <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                       <div className="bg-indigo-500 h-full transition-all" style={{width: `${project.progress}%`}}></div>
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
                       <div key={m.id || i} onClick={() => toggleModule(m.id)} className={`p-4 border rounded-xl flex justify-between items-center cursor-pointer transition-all hover:shadow-sm ${m.isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-white hover:border-indigo-300'}`}>
                         <div className="flex items-center gap-3">
                           {m.isCompleted ? <CheckCircle2 className="text-emerald-500" size={20}/> : <Circle className="text-slate-300" size={20}/>}
                           <span className={`font-medium ${m.isCompleted ? 'text-emerald-800 line-through decoration-emerald-300' : 'text-slate-700'}`}>{m.title}</span>
                         </div>
                         <span className="text-xs bg-white px-2 py-1 rounded border text-slate-500">{m.timeEstimate}</span>
                       </div>
                     ))}
                   </div>
                 </div>
              ) : (
                 <BlueprintView project={activeProject} onToggleModule={toggleModule} />
              )}
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {showCreateModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                {editMode ? <Edit3 size={20}/> : <Plus size={20}/>}
                {editMode ? t.modal_edit : t.modal_title}
              </h3>
              <form onSubmit={handleFormSubmit}>
                <input autoComplete="new-password" spellCheck={false} data-lpignore="true" autoFocus value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t.modal_name} required />
                <textarea autoComplete="new-password" spellCheck={false} data-lpignore="true" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 mb-6 outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t.modal_descLabel} />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">{t.modal_cancel}</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                    {editMode ? <Save size={16}/> : <Plus size={16}/>} {editMode ? t.modal_save : t.modal_create}
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
              <textarea autoComplete="new-password" spellCheck={false} data-lpignore="true" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full h-32 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder={t.modal_desc} />
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

        // 1. 尝试本地恢复登录 (Session Persistence)
        const savedUser = localStorage.getItem(MASTER_USER_KEY);
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        if (config && config.apiKey) {
          if (!getApps().length) appRef.current = initializeApp(config);
          else appRef.current = getApp();
          authRef.current = getAuth(appRef.current);
          dbRef.current = getFirestore(appRef.current);
          if (typeof window !== 'undefined' && window.__app_id) appIdRef.current = window.__app_id;
          try { await enableIndexedDbPersistence(dbRef.current); } catch (e) {}
          onAuthStateChanged(authRef.current, (u) => {
            if (u) {
              const sessionUser = { uid: u.uid, displayName: u.displayName || 'User' };
              localStorage.setItem(MASTER_USER_KEY, JSON.stringify(sessionUser));
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
    if (authRef.current) {
      try {
        const userCredential = await signInAnonymously(authRef.current);
        await updateProfile(userCredential.user, { displayName: username });
        const u = userCredential.user;
        const fbUser = { uid: u.uid, displayName: username };
        localStorage.setItem(MASTER_USER_KEY, JSON.stringify(fbUser));
        setCurrentUser(fbUser as any);
      } catch (e) {
        localStorage.setItem(MASTER_USER_KEY, JSON.stringify(sessionUser));
        setCurrentUser(sessionUser as any);
      }
    } else {
      localStorage.setItem(MASTER_USER_KEY, JSON.stringify(sessionUser));
      setCurrentUser(sessionUser as any);
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem(MASTER_USER_KEY);
    if (authRef.current) await signOut(authRef.current);
    setCurrentUser(null);
  };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center bg-[#0F172A]"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} lang={loginLang} setLang={setLoginLang} isLoggingIn={isLoggingIn} />;
  return <MainContent user={currentUser} db={dbRef.current!} auth={authRef.current!} appId={appIdRef.current} logout={handleLogout} />;
}