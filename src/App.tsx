import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, Auth, User, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, Firestore } from 'firebase/firestore';
import { 
  Layout, Plus, Search, Cloud, Settings, LogOut, 
  CreditCard, Loader2, Sparkles, Folder, 
  Bell, Command, ChevronRight, MoreHorizontal,
  Calendar, CheckCircle2, Circle, ArrowLeft, BrainCircuit,
  Workflow, List, Network, Globe, X
} from 'lucide-react';

// ==============================================================================
// 1. 🟢 Configuration Area
// ==============================================================================
const MANUAL_CONFIG = {
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58",
  authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" 
};

declare global {
  interface Window { __firebase_config?: string; __app_id?: string; __initial_auth_token?: string; }
}

// ==============================================================================
// 2. 🌍 Translation System (多语言字典)
// ==============================================================================
const TRANSLATIONS = {
  en: {
    sidebar: {
      workspace: "WORKSPACE",
      searchPlaceholder: "Quick search...",
      menu: "Menu",
      myProjects: "My Projects",
      teamCollab: "Team Collaboration",
      aiStudio: "AI Creative Studio",
      system: "System",
      settings: "Settings",
      subscription: "Subscription",
      upgrade: "Upgrade to Pro",
      unlock: "Unlock unlimited projects & AI assistant.",
      role: "Team Leader",
      status: "Online"
    },
    topbar: {
      overview: "Overview",
      myProjects: "My Projects",
      projectDetails: "Project Details",
      list: "List",
      blueprint: "Blueprint",
      newProject: "New Project"
    },
    dashboard: {
      welcome: "Welcome back, Leader",
      subtitle: "You have 2 ongoing projects. Click to view details.",
      aiTitle: "AI Creative Generator",
      aiDesc: "Don't know where to start? Enter your idea, AI will generate a blueprint.",
      inProgress: "In Progress"
    },
    detail: {
      taskBlocks: "Task Blocks",
      addModule: "Add Module",
      overallProgress: "Overall Progress",
      estTime: "Est. Time",
      noSubtasks: "No subtasks",
      done: "DONE",
      inProgress: "IN PROGRESS"
    },
    aiModal: {
      title: "AI Project Planner",
      desc: "Tell me what you want to build, and I'll break it down into actionable blocks.",
      placeholder: "E.g., I want to build a habit-tracking iPhone App...",
      cancel: "Cancel",
      generate: "Generate Blueprint",
      planning: "Planning..."
    },
    settingsModal: {
      title: "Settings",
      general: "General",
      language: "Language",
      theme: "Theme (Coming Soon)",
      account: "Account",
      close: "Close"
    }
  },
  zh: {
    sidebar: {
      workspace: "工作区",
      searchPlaceholder: "快速查找...",
      menu: "菜单",
      myProjects: "我的项目库",
      teamCollab: "团队协作",
      aiStudio: "AI 创意工坊",
      system: "系统管理",
      settings: "设置",
      subscription: "订阅管理",
      upgrade: "升级到 Pro",
      unlock: "解锁无限项目与 AI 助手。",
      role: "团队负责人",
      status: "在线"
    },
    topbar: {
      overview: "概览",
      myProjects: "项目库",
      projectDetails: "项目详情",
      list: "列表视图",
      blueprint: "蓝图视图",
      newProject: "新建项目"
    },
    dashboard: {
      welcome: "欢迎回来，队长",
      subtitle: "你有 2 个正在进行的项目。点击卡片查看详情。",
      aiTitle: "AI 创意生成器",
      aiDesc: "不知道如何开始？输入你的想法，AI 帮你生成蓝图。",
      inProgress: "进行中"
    },
    detail: {
      taskBlocks: "任务积木",
      addModule: "添加模块",
      overallProgress: "总体进度",
      estTime: "预计耗时",
      noSubtasks: "暂无子任务",
      done: "已完成",
      inProgress: "进行中"
    },
    aiModal: {
      title: "AI 项目规划师",
      desc: "告诉我你想做什么，我来帮你拆解成可执行的积木。",
      placeholder: "例如：我想做一个帮助人们习惯养成的 iPhone App...",
      cancel: "取消",
      generate: "生成蓝图",
      planning: "正在规划..."
    },
    settingsModal: {
      title: "设置",
      general: "常规",
      language: "语言 / Language",
      theme: "主题 (开发中)",
      account: "账户",
      close: "关闭"
    }
  }
};

// ==============================================================================
// 3. 🧩 Data Structure & Demo Data
// ==============================================================================
type SubTask = { id: string; title: string; isCompleted: boolean; };
type Module = { id: string; title: string; isCompleted: boolean; timeEstimate: string; subTasks?: SubTask[]; };
type Project = { id: string; title: string; description: string; progress: number; updatedAt: string; members: string[]; modules: Module[]; };

// Helper to get demo data based on language
const getDemoProjects = (lang: 'en' | 'zh'): Project[] => {
  if (lang === 'zh') {
    return [
      {
        id: '1', title: 'iOS 电商应用开发', description: '为客户构建的高端时尚购物 App，包含支付和 AR 试穿功能。', progress: 65, updatedAt: '2小时前', members: ['bg-blue-500', 'bg-pink-500', 'bg-yellow-500'],
        modules: [
          { id: 'm1', title: '用户系统', isCompleted: true, timeEstimate: '12h', subTasks: [{ id: 't1-1', title: '登录/注册 UI', isCompleted: true }, { id: 't1-2', title: 'JWT 鉴权逻辑', isCompleted: true }] },
          { id: 'm2', title: '支付模块', isCompleted: true, timeEstimate: '8h', subTasks: [{ id: 't2-1', title: 'Stripe 集成', isCompleted: true }] },
          { id: 'm3', title: 'AR 试穿功能 (核心)', isCompleted: false, timeEstimate: '20h', subTasks: [{ id: 't3-1', title: '摄像头权限', isCompleted: false }, { id: 't3-2', title: '3D 模型加载', isCompleted: false }] },
        ]
      },
      {
        id: '2', title: '企业 CRM 系统', description: '销售团队使用的客户管理后台。', progress: 30, updatedAt: '1天前', members: ['bg-green-500', 'bg-purple-500'],
        modules: [
          { id: 'crm1', title: '数据库架构', isCompleted: true, timeEstimate: '5h', subTasks: [{ id: 'c1-1', title: 'ER图设计', isCompleted: true }] },
          { id: 'crm2', title: '前端仪表盘', isCompleted: false, timeEstimate: '3h', subTasks: [] },
        ]
      }
    ];
  }
  return [
    {
      id: '1', title: 'iOS E-commerce App', description: 'High-end fashion shopping app for clients, including payment and AR try-on features.', progress: 65, updatedAt: '2h ago', members: ['bg-blue-500', 'bg-pink-500', 'bg-yellow-500'],
      modules: [
        { id: 'm1', title: 'User System', isCompleted: true, timeEstimate: '12h', subTasks: [{ id: 't1-1', title: 'Login/Register UI', isCompleted: true }, { id: 't1-2', title: 'JWT Auth Logic', isCompleted: true }] },
        { id: 'm2', title: 'Payment Module', isCompleted: true, timeEstimate: '8h', subTasks: [{ id: 't2-1', title: 'Stripe SDK Integration', isCompleted: true }] },
        { id: 'm3', title: 'AR Try-on Feature (Core)', isCompleted: false, timeEstimate: '20h', subTasks: [{ id: 't3-1', title: 'Camera Permissions', isCompleted: false }, { id: 't3-2', title: '3D Model Loader', isCompleted: false }] },
      ]
    },
    {
      id: '2', title: 'Internal CRM System', description: 'Customer management dashboard for the sales team.', progress: 30, updatedAt: '1d ago', members: ['bg-green-500', 'bg-purple-500'],
      modules: [
        { id: 'crm1', title: 'Database Architecture', isCompleted: true, timeEstimate: '5h', subTasks: [{ id: 'c1-1', title: 'ER Diagram Design', isCompleted: true }] },
        { id: 'crm2', title: 'Frontend Dashboard', isCompleted: false, timeEstimate: '3h', subTasks: [] },
      ]
    }
  ];
};

// ==============================================================================
// 4. 🎨 UI Components
// ==============================================================================

// --- Sidebar ---
const Sidebar = ({ user, currentView, setView, lang, onOpenSettings }: any) => {
  const t = TRANSLATIONS[lang].sidebar;

  return (
    <div className="w-72 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 flex-shrink-0 hidden md:flex">
      <div className="p-6 flex items-center gap-3 text-white">
        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
          <Layout size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight leading-none">Project Nexus</h1>
          <p className="text-[10px] text-indigo-300 font-medium tracking-wider mt-1 opacity-80">{t.workspace}</p>
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
          <input type="text" placeholder={t.searchPlaceholder} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-slate-800 text-slate-200" />
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t.menu}</div>
        <MenuItem icon={<Folder size={18} />} label={t.myProjects} active={currentView === 'dashboard'} onClick={() => setView('dashboard')} count={2} />
        <MenuItem icon={<Cloud size={18} />} label={t.teamCollab} />
        <MenuItem icon={<BrainCircuit size={18} />} label={t.aiStudio} />
        
        <div className="mt-6 px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t.system}</div>
        <MenuItem icon={<Settings size={18} />} label={t.settings} onClick={onOpenSettings} />
        <MenuItem icon={<CreditCard size={18} />} label={t.subscription} />
      </nav>

      <div className="p-4 border-t border-slate-800/60 bg-[#0B1120]">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-4 mb-4 relative overflow-hidden cursor-pointer shadow-lg group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20"><Sparkles size={60} /></div>
          <h3 className="text-white font-bold text-sm flex items-center gap-2 relative z-10"><Sparkles size={14} /> {t.upgrade}</h3>
          <p className="text-indigo-100 text-xs mt-1 relative z-10">{t.unlock}</p>
        </div>
        
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm border border-slate-600">
            {user ? user.uid.slice(0, 1).toUpperCase() : <Loader2 size={14} className="animate-spin" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">{user ? t.role : 'Connecting...'}</div>
            <div className="text-xs text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow"></span>{t.status}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({ icon, label, active, count, onClick }: any) => (
  <div onClick={onClick} className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${active ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}>
    <div className="flex items-center gap-3">{icon}<span className="text-sm font-medium">{label}</span></div>
    {count !== undefined && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{count}</span>}
  </div>
);

// --- Component: Blueprint View ---
const BlueprintView = ({ project, t }: { project: Project, t: any }) => {
  return (
    <div className="relative w-full h-full overflow-auto bg-slate-50/50 p-10 flex items-center justify-start min-h-[600px]">
      <div className="flex gap-16 items-center">
        {/* Level 0 */}
        <div className="relative z-10">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 border-4 border-indigo-100 w-64 text-center relative group">
             <div className="absolute -top-3 -right-3 bg-indigo-500 rounded-full p-2 shadow-lg"><Layout size={20}/></div>
             <h3 className="font-bold text-lg mb-1">{project.title}</h3>
             <div className="text-xs text-slate-400">{t.overallProgress} {project.progress}%</div>
             <div className="absolute top-1/2 -right-3 w-3 h-3 bg-indigo-500 rounded-full" />
          </div>
        </div>
        {/* Level 1 */}
        <div className="flex flex-col gap-8 relative">
           <div className="absolute left-[-32px] top-10 bottom-10 w-0.5 bg-indigo-200 rounded-full"></div>
           {project.modules.map((module) => (
             <div key={module.id} className="relative flex items-center">
               <div className="w-16 h-0.5 bg-indigo-200 absolute -left-16 top-1/2"></div>
               <div className="absolute -left-16 top-1/2 w-2 h-2 bg-indigo-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
               <div className={`w-64 p-4 rounded-xl border-2 transition-all bg-white ${module.isCompleted ? 'border-green-400/50 shadow-green-100' : 'border-slate-200 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${module.isCompleted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {module.isCompleted ? t.done : t.inProgress}
                    </span>
                    <MoreHorizontal size={16} className="text-slate-300"/>
                  </div>
                  <h4 className="font-bold text-slate-800">{module.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{t.estTime}: {module.timeEstimate}</p>
               </div>
               {module.subTasks && module.subTasks.length > 0 && (
                 <div className="ml-12 flex flex-col gap-3 border-l-2 border-slate-200 pl-6 py-2 relative">
                   {module.subTasks.map(task => (
                     <div key={task.id} className="flex items-center gap-3 relative">
                       <div className="absolute -left-6 top-1/2 w-4 h-0.5 bg-slate-200"></div>
                       <div className={`w-3 h-3 rounded-full border ${task.isCompleted ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}></div>
                       <span className={`text-sm ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{task.title}</span>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Content Area ---
const MainContent = ({ user }: { user: User | null }) => {
  const [lang, setLang] = useState<'en' | 'zh'>('en'); // 🟢 Language State
  const [view, setView] = useState<'dashboard' | 'detail' | 'blueprint'>('dashboard');
  const [projectMode, setProjectMode] = useState<'list' | 'blueprint'>('list'); 
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false); // 🟢 Settings Modal State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const t = TRANSLATIONS[lang]; // Current Translation
  const projects = getDemoProjects(lang); // Localized Data

  const openProject = (p: Project) => {
    setActiveProject(p);
    setView('detail');
    setProjectMode('list'); 
  };

  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowAIModal(false);
      alert(lang === 'en' ? "Blueprint Generated!" : "蓝图已生成！");
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar user={user} currentView={view} setView={setView} lang={lang} onOpenSettings={() => setShowSettingsModal(true)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {view !== 'dashboard' && (
              <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
             <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-800 leading-none">
                  {view === 'dashboard' ? t.topbar.overview : activeProject?.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs text-slate-400">{view === 'dashboard' ? t.topbar.myProjects : t.topbar.projectDetails}</span>
                   {view !== 'dashboard' && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">DEV</span>}
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {view !== 'dashboard' && (
               <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
                 <button onClick={() => setProjectMode('list')} className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${projectMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                   <List size={14} /> {t.topbar.list}
                 </button>
                 <button onClick={() => setProjectMode('blueprint')} className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${projectMode === 'blueprint' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                   <Network size={14} /> {t.topbar.blueprint}
                 </button>
               </div>
             )}
             <button className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={16} /></button>
             <button onClick={() => setShowAIModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg">
                <Plus size={16} /> {t.topbar.newProject}
             </button>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
            {/* View 1: Dashboard */}
            {view === 'dashboard' && (
              <div className="p-6 md:p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.dashboard.welcome}</h1>
                    <p className="text-slate-500">{t.dashboard.subtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div onClick={() => setShowAIModal(true)} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl transition-all group flex flex-col justify-between">
                    <div>
                      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Sparkles size={24} /></div>
                      <h3 className="font-bold text-xl mb-2">{t.dashboard.aiTitle}</h3>
                      <p className="text-indigo-100 text-sm opacity-90">{t.dashboard.aiDesc}</p>
                    </div>
                  </div>
                  {projects.map(project => (
                    <div key={project.id} onClick={() => openProject(project)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all cursor-pointer group flex flex-col justify-between hover:shadow-md">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{t.dashboard.inProgress}</span>
                          <MoreHorizontal size={20} className="text-slate-300 group-hover:text-slate-500" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-6">{project.description}</p>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View 2: Project Detail */}
            {view === 'detail' && activeProject && (
              <div className="h-full flex flex-col">
                {/* Mode A: List Mode */}
                {projectMode === 'list' && (
                   <div className="p-6 md:p-8 max-w-6xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
                     <div className="flex flex-col md:flex-row gap-8">
                       <div className="flex-1">
                         <div className="flex items-center justify-between mb-6">
                           <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                             <Folder className="text-indigo-500" size={24}/> {t.detail.taskBlocks}
                           </h3>
                           <button className="text-indigo-600 text-sm font-medium bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                             + {t.detail.addModule}
                           </button>
                         </div>
                         <div className="space-y-4">
                           {activeProject.modules.map(module => (
                             <div key={module.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                               <div className="p-4 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
                                 <div className="flex items-center gap-3">
                                   <div className={`p-1.5 rounded-lg ${module.isCompleted ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {module.isCompleted ? <CheckCircle2 size={16}/> : <Loader2 size={16} className={module.isCompleted ? '' : 'animate-spin-slow'}/>}
                                   </div>
                                   <h4 className="font-bold text-slate-800">{module.title}</h4>
                                 </div>
                                 <span className="text-xs text-slate-400 font-mono">{t.detail.estTime}: {module.timeEstimate}</span>
                               </div>
                               <div className="p-2">
                                 {module.subTasks && module.subTasks.map(task => (
                                   <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${task.isCompleted ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                                        {task.isCompleted && <CheckCircle2 size={12} className="text-white"/>}
                                      </div>
                                      <span className={`text-sm ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{task.title}</span>
                                   </div>
                                 ))}
                                 {(!module.subTasks || module.subTasks.length === 0) && (
                                   <div className="text-center py-4 text-xs text-slate-400 italic">{t.detail.noSubtasks}</div>
                                 )}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                       <div className="w-full md:w-80">
                         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-6">
                           <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">{t.detail.overallProgress}</h4>
                           <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden">
                             <div className="bg-indigo-500 h-full transition-all duration-1000" style={{width: `${activeProject.progress}%`}}></div>
                           </div>
                           <div className="flex justify-between text-xs text-slate-500">
                             <span>0%</span>
                             <span className="font-bold text-indigo-600">{activeProject.progress}%</span>
                             <span>100%</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                )}
                {/* Mode B: Blueprint Mode */}
                {projectMode === 'blueprint' && (
                  <div className="flex-1 animate-in fade-in duration-500">
                    <BlueprintView project={activeProject} t={t.detail} />
                  </div>
                )}
              </div>
            )}
        </div>

        {/* AI Modal */}
        {showAIModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20"><BrainCircuit size={100} /></div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles /> {t.aiModal.title}</h3>
                <p className="text-indigo-100 text-sm mt-1">{t.aiModal.desc}</p>
              </div>
              <div className="p-6">
                <textarea 
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder={t.aiModal.placeholder}
                  className="w-full h-32 border border-slate-200 rounded-xl p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium">{t.aiModal.cancel}</button>
                  <button onClick={handleAIGenerate} disabled={!aiPrompt || isGenerating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isGenerating ? t.aiModal.planning : t.aiModal.generate}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal (New) */}
        {showSettingsModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">{t.settingsModal.title}</h3>
                <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-6">
                {/* Language Setting */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Globe size={16}/> {t.settingsModal.language}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setLang('en')}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${lang === 'en' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => setLang('zh')}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${lang === 'zh' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                    >
                      中文 (Chinese)
                    </button>
                  </div>
                </div>

                {/* Theme Placeholder */}
                <div className="opacity-50 pointer-events-none">
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.settingsModal.theme}</label>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900"></div>
                    <div className="w-8 h-8 rounded-full bg-white border"></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <button onClick={() => setShowSettingsModal(false)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
                    {t.settingsModal.close}
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
// 5. 🛡️ System Wrapper
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
          throw new Error("Missing App Config (API Key missing)");
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