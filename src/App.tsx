import React, { useState, useEffect } from 'react';
import { 
  Layout, Plus, Search, Cloud, Settings, LogOut, 
  CreditCard, Loader2, Sparkles, Folder, 
  Bell, Command, ChevronRight, MoreHorizontal,
  CheckCircle2, Circle, ArrowLeft, BrainCircuit,
  Workflow, List, Network, Trash2, LogIn, UserCircle, 
  Wifi, WifiOff, HardDrive, Database
} from 'lucide-react';

// ==============================================================================
// 1. 💾 本地数据库引擎 (Local Storage Engine)
//    这是让你现在的应用 "健步如飞" 的秘密武器
// ==============================================================================
const STORAGE_KEY = 'project_nexus_data_v1';
const USER_KEY = 'project_nexus_user_v1';

const db = {
  // 读取所有项目
  getProjects: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  // 保存项目
  addProject: (project: any) => {
    const projects = db.getProjects();
    const newProject = { ...project, id: `local-${Date.now()}`, createdAt: Date.now() };
    const updated = [newProject, ...projects];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },
  // 删除项目
  deleteProject: (id: string) => {
    const projects = db.getProjects();
    const updated = projects.filter((p: any) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
};

// ==============================================================================
// 2. 🌍 多语言字典
// ==============================================================================
const TRANSLATIONS = {
  en: {
    login: { title: "Welcome to Nexus", subtitle: "Start your offline creative workspace.", placeholder: "Your Name", btn: "Enter Workspace" },
    sidebar: { workspace: "WORKSPACE", myProjects: "My Projects", logout: "Log Out", mode: "Offline Mode" },
    dashboard: { welcome: "Welcome,", subtitle: "Your local projects (Saved in browser).", newProject: "New Project", noProjects: "No projects yet. Start building!", createBtn: "Create Project" },
    modal: { createTitle: "Create New Project", nameLabel: "Name", descLabel: "Description", cancel: "Cancel", create: "Create" }
  },
  zh: {
    login: { title: "欢迎来到 Project Nexus", subtitle: "开启你的本地创意工作区 (无需联网)", placeholder: "你的昵称", btn: "进入工作区" },
    sidebar: { workspace: "工作区", myProjects: "我的项目库", logout: "退出登录", mode: "离线极速模式" },
    dashboard: { welcome: "欢迎回来，", subtitle: "你的本地项目 (已保存到浏览器)。", newProject: "新建项目", noProjects: "暂无项目。创建你的第一个作品！", createBtn: "立即创建" },
    modal: { createTitle: "创建新项目", nameLabel: "项目名称", descLabel: "项目简介", cancel: "取消", create: "确认创建" }
  }
};

type Project = { id: string; title: string; description: string; progress: number; createdAt: number; modules?: any[]; };

// ==============================================================================
// 3. 🔐 登录组件 (本地模拟)
// ==============================================================================
const LoginScreen = ({ onLogin, lang, setLang }: any) => {
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
            <input 
              autoComplete="off" spellCheck={false} 
              value={name} onChange={(e) => setName(e.target.value)} 
              placeholder={t.placeholder} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
              required 
            />
          </div>
          <button disabled={!name.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            <LogIn size={20} /> {t.btn}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==============================================================================
// 4. 🏗️ 主应用组件
// ==============================================================================
const MainContent = ({ user, logout }: { user: any, logout: () => void }) => {
  const [lang, setLang] = useState<'en' | 'zh'>('zh'); 
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const t = TRANSLATIONS[lang];

  // 🔄 初始化读取数据
  useEffect(() => {
    const savedProjects = db.getProjects();
    setProjects(savedProjects);
  }, []);

  // 🟢 创建项目 (极速本地版)
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    
    setIsCreating(true);
    
    // 模拟一点点延迟让用户感觉在处理，增加质感，但实际上是本地操作
    setTimeout(() => {
      const newProj = {
        title: newProjectTitle,
        description: newProjectDesc || '暂无描述',
        progress: 0,
        modules: [
          { id: 'm1', title: '阶段一: 需求拆解', isCompleted: true, timeEstimate: '1h' },
          { id: 'm2', title: '阶段二: 核心开发', isCompleted: false, timeEstimate: '5h' }
        ]
      };
      
      const updatedList = db.addProject(newProj);
      setProjects(updatedList);
      
      setIsCreating(false);
      setShowCreateModal(false);
      setNewProjectTitle('');
      setNewProjectDesc('');
    }, 600); // 0.6秒极速反馈
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个项目吗？")) {
      const updatedList = db.deleteProject(id);
      setProjects(updatedList);
    }
  };

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

        <div className="px-5 mb-6">
           <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <HardDrive size={14} />
              {t.sidebar.mode}
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
              {user.name ? user.name[0].toUpperCase() : <UserCircle size={20}/>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">{user.name || 'User'}</div>
              <button onClick={logout} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 mt-0.5 transition-colors">
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.dashboard.welcome} {user.name}</h1>
            <p className="text-slate-500 mb-8 flex items-center gap-2">
              <Database size={16} className="text-emerald-500"/>
              {t.dashboard.subtitle}
            </p>

            {projects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 animate-in fade-in zoom-in-95 duration-500">
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [loginLang, setLoginLang] = useState('zh');

  useEffect(() => {
    // 检查本地是否有保存的用户信息
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsReady(true);
  }, []);

  const handleLogin = (name: string) => {
    const user = { name, id: Date.now().toString() };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
  };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center bg-[#0F172A]"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;

  if (!currentUser) return <LoginScreen onLogin={handleLogin} lang={loginLang} setLang={setLoginLang} />;
  return <MainContent user={currentUser} logout={handleLogout} />;
}