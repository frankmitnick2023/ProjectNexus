import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, Auth, User, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, Firestore } from 'firebase/firestore';
import { 
  Layout, Plus, Search, Cloud, Settings, LogOut, 
  CreditCard, Loader2, Sparkles, Folder, 
  Bell, Command, ChevronRight, MoreHorizontal,
  Calendar, CheckCircle2, Circle, ArrowLeft, BrainCircuit,
  Workflow, List, Network
} from 'lucide-react';

// ==============================================================================
// 1. 🟢 Configuration Area (Engine Core)
// ==============================================================================
const MANUAL_CONFIG = {
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58",
  authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" 
};

declare global {
  interface Window { __firebase_config?: string; __app_id?: string; __initial_auth_token?: string; }
}

// ==============================================================================
// 2. 🧩 Data Structure (Supports Nested Modules)
// ==============================================================================
type SubTask = {
  id: string;
  title: string;
  isCompleted: boolean;
};

type Module = {
  id: string;
  title: string;
  isCompleted: boolean;
  timeEstimate: string;
  subTasks?: SubTask[];
};

type Project = {
  id: string;
  title: string;
  description: string;
  progress: number;
  updatedAt: string;
  members: string[];
  modules: Module[];
};

// Demo Data: English Version
const DEMO_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'iOS E-commerce App',
    description: 'High-end fashion shopping app for clients, including payment and AR try-on features.',
    progress: 65,
    updatedAt: '2h ago',
    members: ['bg-blue-500', 'bg-pink-500', 'bg-yellow-500'],
    modules: [
      { 
        id: 'm1', title: 'User System', isCompleted: true, timeEstimate: '12h',
        subTasks: [
          { id: 't1-1', title: 'Login/Register UI', isCompleted: true },
          { id: 't1-2', title: 'JWT Auth Logic', isCompleted: true },
          { id: 't1-3', title: 'Forgot Password Flow', isCompleted: false },
        ]
      },
      { 
        id: 'm2', title: 'Payment Module', isCompleted: true, timeEstimate: '8h',
        subTasks: [
          { id: 't2-1', title: 'Stripe SDK Integration', isCompleted: true },
          { id: 't2-2', title: 'Order Status Callback', isCompleted: true },
        ]
      },
      { 
        id: 'm3', title: 'AR Try-on Feature (Core)', isCompleted: false, timeEstimate: '20h',
        subTasks: [
          { id: 't3-1', title: 'Camera Permissions', isCompleted: false },
          { id: 't3-2', title: '3D Model Loader', isCompleted: false },
          { id: 't3-3', title: 'Gesture Interaction', isCompleted: false },
        ]
      },
    ]
  },
  {
    id: '2',
    title: 'Internal CRM System',
    description: 'Customer management dashboard for the sales team.',
    progress: 30,
    updatedAt: '1d ago',
    members: ['bg-green-500', 'bg-purple-500'],
    modules: [
      { 
        id: 'crm1', title: 'Database Architecture', isCompleted: true, timeEstimate: '5h',
        subTasks: [
          { id: 'c1-1', title: 'ER Diagram Design', isCompleted: true },
          { id: 'c1-2', title: 'Table Creation Scripts', isCompleted: true }
        ]
      },
      { 
        id: 'crm2', title: 'Frontend Dashboard', isCompleted: false, timeEstimate: '3h',
        subTasks: []
      },
    ]
  }
];

// ==============================================================================
// 3. 🎨 UI Components
// ==============================================================================

// --- Sidebar ---
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
        <input type="text" placeholder="Quick search..." className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-slate-800 text-slate-200" />
      </div>
    </div>

    <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
      <div className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Menu</div>
      <MenuItem icon={<Folder size={18} />} label="My Projects" active={currentView === 'dashboard'} onClick={() => setView('dashboard')} count={DEMO_PROJECTS.length} />
      <MenuItem icon={<Cloud size={18} />} label="Team Collaboration" />
      <MenuItem icon={<BrainCircuit size={18} />} label="AI Creative Studio" />
      
      <div className="mt-6 px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">System</div>
      <MenuItem icon={<Settings size={18} />} label="Settings" />
      <MenuItem icon={<CreditCard size={18} />} label="Subscription" />
    </nav>

    <div className="p-4 border-t border-slate-800/60 bg-[#0B1120]">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-4 mb-4 relative overflow-hidden cursor-pointer shadow-lg group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20"><Sparkles size={60} /></div>
        <h3 className="text-white font-bold text-sm flex items-center gap-2 relative z-10"><Sparkles size={14} /> Upgrade to Pro</h3>
        <p className="text-indigo-100 text-xs mt-1 relative z-10">Unlock unlimited projects & AI assistant.</p>
      </div>
      
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm border border-slate-600">
          {user ? user.uid.slice(0, 1).toUpperCase() : <Loader2 size={14} className="animate-spin" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">{user ? 'Team Leader' : 'Connecting...'}</div>
          <div className="text-xs text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow"></span>Online</div>
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

// --- Component: Blueprint View (Flowchart) ---
const BlueprintView = ({ project }: { project: Project }) => {
  return (
    <div className="relative w-full h-full overflow-auto bg-slate-50/50 p-10 flex items-center justify-start min-h-[600px]">
      <div className="flex gap-16 items-center">
        
        {/* Level 0: Root Node */}
        <div className="relative z-10">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 border-4 border-indigo-100 w-64 text-center relative group">
             <div className="absolute -top-3 -right-3 bg-indigo-500 rounded-full p-2 shadow-lg"><Layout size={20}/></div>
             <h3 className="font-bold text-lg mb-1">{project.title}</h3>
             <div className="text-xs text-slate-400">Total Progress {project.progress}%</div>
             {/* Connector Point */}
             <div className="absolute top-1/2 -right-3 w-3 h-3 bg-indigo-500 rounded-full" />
          </div>
        </div>

        {/* Connection Layer */}
        
        {/* Level 1: Modules */}
        <div className="flex flex-col gap-8 relative">
           {/* Vertical Line */}
           <div className="absolute left-[-32px] top-10 bottom-10 w-0.5 bg-indigo-200 rounded-full"></div>

           {project.modules.map((module) => (
             <div key={module.id} className="relative flex items-center">
               {/* Horizontal Line */}
               <div className="w-16 h-0.5 bg-indigo-200 absolute -left-16 top-1/2"></div>
               <div className="absolute -left-16 top-1/2 w-2 h-2 bg-indigo-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

               {/* Module Card */}
               <div className={`w-64 p-4 rounded-xl border-2 transition-all group hover:scale-105 duration-200 bg-white ${module.isCompleted ? 'border-green-400/50 shadow-green-100' : 'border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${module.isCompleted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {module.isCompleted ? 'DONE' : 'IN PROGRESS'}
                    </span>
                    <MoreHorizontal size={16} className="text-slate-300"/>
                  </div>
                  <h4 className="font-bold text-slate-800">{module.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Est. Time: {module.timeEstimate}</p>
               </div>

               {/* Level 2: Subtasks (if expanded) */}
               {module.subTasks && module.subTasks.length > 0 && (
                 <div className="ml-12 flex flex-col gap-3 border-l-2 border-slate-200 pl-6 py-2 relative">
                   {module.subTasks.map(task => (
                     <div key={task.id} className="flex items-center gap-3 relative">
                       {/* Branch Line */}
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
  const [view, setView] = useState<'dashboard' | 'detail' | 'blueprint'>('dashboard');
  const [projectMode, setProjectMode] = useState<'list' | 'blueprint'>('list'); 
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Open Project
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
      alert("AI Generated! Please check the new module structure.");
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar user={user} currentView={view} setView={setView} />

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
                  {view === 'dashboard' ? 'Overview' : activeProject?.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs text-slate-400">{view === 'dashboard' ? 'My Projects' : 'Project Details'}</span>
                   {view !== 'dashboard' && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">DEV</span>}
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {/* Project View Switcher */}
             {view !== 'dashboard' && (
               <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
                 <button 
                   onClick={() => setProjectMode('list')}
                   className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${projectMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   <List size={14} /> List
                 </button>
                 <button 
                   onClick={() => setProjectMode('blueprint')}
                   className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${projectMode === 'blueprint' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   <Network size={14} /> Blueprint
                 </button>
               </div>
             )}
             
             <button className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={16} /></button>
             <button onClick={() => setShowAIModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg">
                <Plus size={16} /> New Project
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, Leader</h1>
                    <p className="text-slate-500">You have 2 ongoing projects. Click to view details.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div onClick={() => setShowAIModal(true)} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl transition-all group flex flex-col justify-between">
                    <div>
                      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Sparkles size={24} /></div>
                      <h3 className="font-bold text-xl mb-2">AI Creative Generator</h3>
                      <p className="text-indigo-100 text-sm opacity-90">Don't know where to start? Enter your idea, AI will generate a blueprint.</p>
                    </div>
                  </div>
                  {DEMO_PROJECTS.map(project => (
                    <div key={project.id} onClick={() => openProject(project)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all cursor-pointer group flex flex-col justify-between hover:shadow-md">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">In Progress</span>
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
                       {/* Task Blocks List */}
                       <div className="flex-1">
                         <div className="flex items-center justify-between mb-6">
                           <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                             <Folder className="text-indigo-500" size={24}/> Task Blocks 
                           </h3>
                           <button className="text-indigo-600 text-sm font-medium bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                             + Add Module
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
                                 <span className="text-xs text-slate-400 font-mono">{module.timeEstimate}</span>
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
                                   <div className="text-center py-4 text-xs text-slate-400 italic">No subtasks</div>
                                 )}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>

                       {/* Right Overview */}
                       <div className="w-full md:w-80">
                         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-6">
                           <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Overall Progress</h4>
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
                    <BlueprintView project={activeProject} />
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
                <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles /> AI Project Planner</h3>
                <p className="text-indigo-100 text-sm mt-1">Tell me what you want to build, and I'll break it down into actionable blocks.</p>
              </div>
              <div className="p-6">
                <textarea 
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="E.g., I want to build a habit-tracking iPhone App..."
                  className="w-full h-32 border border-slate-200 rounded-xl p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                  <button onClick={handleAIGenerate} disabled={!aiPrompt || isGenerating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isGenerating ? 'Planning...' : 'Generate Blueprint'}
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
// 4. 🛡️ System Wrapper
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