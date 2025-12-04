import React, { useState, useEffect, useMemo } from 'react';
import { 
  Folder, 
  Plus, 
  Search, 
  Layout, 
  CheckSquare, 
  Cpu, 
  Settings, 
  ChevronRight, 
  Save, 
  Copy, 
  Share2,
  Trash2,
  MoreVertical,
  Menu,
  User,
  CreditCard,
  X,
  Smartphone,
  Globe,
  Zap,
  Check,
  LogOut,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

// --- Firebase Configuration (服务器配置区) ---
// ⚠️ 重要：当你准备正式发布时，请替换以下配置
// 1. 去 firebase.google.com 创建一个新项目
// 2. 在项目设置中复制你的 SDK 配置
// 3. 将其粘贴替换下方的 const firebaseConfig ...

let firebaseConfig;
let appId;

// 检查是否在预览环境中 (这是为了让你在现在的窗口里能直接看到效果)
if (typeof __firebase_config !== 'undefined') {
  firebaseConfig = JSON.parse(__firebase_config);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} else {
  const firebaseConfig = {
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58",
  authDomain: "project-nexus-9b304.firebaseapp.com",
  projectId: "project-nexus-9b304",
  storageBucket: "project-nexus-9b304.firebasestorage.app",
  messagingSenderId: "373323289724",
  appId: "1:373323289724:web:1301fc95c044186a7825f9",
  measurementId: "G-LRE9C1RQ7V"
};

}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Components ---

/**
 * Auth/Login Modal (Req: Email Registration)
 * Handles Sign Up, Login, and "Guest Mode"
 */
const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      let msg = "操作失败，请重试";
      if (err.code === 'auth/email-already-in-use') msg = "该邮箱已被注册";
      if (err.code === 'auth/wrong-password') msg = "密码错误";
      if (err.code === 'auth/user-not-found') msg = "用户不存在";
      if (err.code === 'auth/weak-password') msg = "密码太弱（至少6位）";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      onClose();
    } catch (err) {
      setError("游客登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {mode === 'login' ? '欢迎回来' : '创建账户'}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {mode === 'login' ? '登录以同步你的项目数据' : '注册即可跨设备无缝协作'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-xs text-center bg-red-50 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center"
            >
              {loading ? '处理中...' : (mode === 'login' ? '登录' : '注册 Pro 账户')}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button 
              onClick={() => {setError(''); setMode(mode === 'login' ? 'signup' : 'login')}}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {mode === 'login' ? '还没有账号？去注册' : '已有账号？去登录'}
            </button>
            <button 
              onClick={handleGuest}
              className="text-slate-400 hover:text-slate-600"
            >
              游客试用 &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Subscription/Upgrade Modal
 */
const UpgradeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-200">
        
        {/* Left Side: Value Prop */}
        <div className="bg-indigo-600 p-8 text-white md:w-2/5 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">升级到 Pro</h3>
            <p className="text-indigo-100 text-sm">解锁全部生产力工具，实现跨设备无缝协作。</p>
          </div>
          <div className="space-y-4 mt-8">
            <div className="flex items-center text-sm">
              <Smartphone className="w-5 h-5 mr-3 opacity-80" />
              <span>iOS & Android APP 同步</span>
            </div>
            <div className="flex items-center text-sm">
              <Share2 className="w-5 h-5 mr-3 opacity-80" />
              <span>团队多人协作权限</span>
            </div>
            <div className="flex items-center text-sm">
              <Cpu className="w-5 h-5 mr-3 opacity-80" />
              <span>无限次 AI 提示词生成</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-indigo-500 text-xs opacity-60">
            Project Nexus for Enterprise
          </div>
        </div>

        {/* Right Side: Pricing */}
        <div className="p-8 md:w-3/5 bg-slate-50">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
          
          <h4 className="text-lg font-bold text-slate-800 mb-6">选择适合你的计划</h4>
          
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white opacity-70">
              <div>
                <span className="block font-bold text-slate-700">个人免费版</span>
                <span className="text-xs text-slate-500">基础功能，单设备</span>
              </div>
              <span className="font-bold text-slate-800">当前</span>
            </div>

            <div className="border-2 border-indigo-600 rounded-xl p-4 flex justify-between items-center bg-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg">推荐</div>
              <div>
                <span className="block font-bold text-indigo-900">Pro 专业版</span>
                <span className="text-xs text-slate-500">全平台同步 + AI 高级功能</span>
              </div>
              <div className="text-right">
                <span className="block font-bold text-xl text-indigo-600">¥18<span className="text-sm font-normal text-slate-400">/月</span></span>
              </div>
            </div>
          </div>

          <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center">
            <Zap className="w-4 h-4 mr-2 fill-current" />
            立即订阅
          </button>
          
          <p className="text-xs text-center text-slate-400 mt-4">
            7天免费试用，随时取消。支持微信/支付宝。
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * AI Prompt Generator Module
 */
const AIPromptModule = ({ project, tasks }) => {
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copyStatus, setCopyStatus] = useState('复制提示词');

  const generatePrompt = () => {
    const pendingTasks = tasks.filter(t => !t.completed).map(t => `- ${t.title}`).join('\n');
    const completedTasks = tasks.filter(t => t.completed).map(t => `- ${t.title}`).join('\n');
    
    const prompt = `
# 项目背景
我正在进行一个名为《${project.title}》的项目。
项目目标/描述：${project.description || '暂无详细描述'}

# 当前状态
目前进度：${Math.round((tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100)}%

# 已完成工作
${completedTasks || '(暂无)'}

# 待办/卡点
${pendingTasks || '(暂无)'}

# 我的需求
请根据上述项目背景和当前的待办事项，为我提供下一步的具体实施建议或代码实现思路。请保持回答的结构化和模块化。
    `.trim();
    
    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = generatedPrompt;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopyStatus('已复制！');
      setTimeout(() => setCopyStatus('复制提示词'), 2000);
    } catch (err) {
      setCopyStatus('复制失败');
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center text-indigo-600">
          <Cpu className="w-5 h-5 mr-2" />
          AI 协作助手
        </h3>
        <button 
          onClick={generatePrompt}
          className="text-xs md:text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors font-medium"
        >
          刷新上下文
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4 hidden md:block">
        点击下方按钮，将当前项目的进度、目标和待办事项打包成一段“提示词”。发送给ChatGPT/Claude，让AI快速进入工作状态。
      </p>
      
      <div className="relative">
        <textarea 
          className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
          value={generatedPrompt}
          readOnly
          placeholder="点击右上角'刷新上下文'生成提示词..."
        />
        {generatedPrompt && (
          <button 
            onClick={copyToClipboard}
            className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg hover:bg-indigo-700 flex items-center transition-all active:scale-95"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copyStatus}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Task Management Module
 */
const TaskModule = ({ projectId, tasks, onAddTask, onToggleTask, onDeleteTask }) => {
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAddTask(newTask);
    setNewTask('');
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <h3 className="text-lg font-semibold flex items-center mb-4 text-slate-800">
        <CheckSquare className="w-5 h-5 mr-2 text-emerald-500" />
        执行步骤
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="text-center text-slate-400 py-8 italic text-sm">
            暂无任务。碎片化时间也是时间。
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="group flex items-start p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
              {/* Touch target optimization */}
              <button 
                onClick={() => onToggleTask(task)}
                className={`mt-0.5 w-6 h-6 rounded border flex items-center justify-center mr-3 shrink-0 transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}
              >
                {task.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              <span className={`text-sm md:text-base pt-0.5 break-words flex-1 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {task.title}
              </span>
              <button 
                onClick={() => onDeleteTask(task.id)}
                className="opacity-100 md:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-auto">
        <div className="flex shadow-sm">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="下一步做什么..."
            className="flex-1 px-4 py-3 border border-slate-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm"
          />
          <button 
            type="submit"
            className="px-4 md:px-5 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Project Settings / Overview Module
 */
const ProjectOverviewModule = ({ project, onUpdateProject }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [desc, setDesc] = useState(project.description || '');

  useEffect(() => {
    setDesc(project.description || '');
  }, [project]);

  const handleSave = () => {
    onUpdateProject({ description: desc });
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
          <Layout className="w-5 h-5 mr-2 text-blue-500" />
          项目框架 & 目标
        </h3>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`text-xs md:text-sm px-3 py-1 rounded-full transition-colors ${isEditing ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100'}`}
        >
          {isEditing ? '保存' : '编辑描述'}
        </button>
      </div>

      {isEditing ? (
        <textarea
          className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 text-sm"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="在这个项目中，我的核心目标是... 架构采用了..."
        />
      ) : (
        <div className="prose prose-sm max-w-none text-slate-600">
          {project.description ? (
            <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{project.description}</p>
          ) : (
            <p className="italic text-slate-400 text-sm">暂无项目描述。添加描述有助于AI更好地理解你的意图。</p>
          )}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center">
          <Globe className="w-3 h-3 mr-1" />
          <span>已同步至云端</span>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function ProjectNexus() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mobile UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // Controls login/signup screen
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle sidebar visibility based on screen size on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth & Data Init
  useEffect(() => {
    // Check if initial token exists
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      signInWithCustomToken(auth, __initial_auth_token);
    } 
    // If no token, we wait for user to interact with AuthModal (don't auto-login anonymously)
    // Note: If you want auto-guest login, you can add it here.
    // For this demo, we show the AuthModal if not logged in.
    
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setShowAuthModal(true);
        setProjects([]);
        setSelectedProjectId(null);
      } else {
        setShowAuthModal(false);
      }
    });
  }, []);

  // Fetch Projects
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'projects'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        if (window.innerWidth >= 768) setSelectedProjectId(data[0].id);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Tasks for Selected Project
  useEffect(() => {
    if (!user || !selectedProjectId) return;
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'projects', selectedProjectId, 'tasks'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, selectedProjectId]);

  // CRUD Operations
  const createProject = async () => {
    const title = prompt("请输入项目名称：");
    if (!title) return;
    if (!user) return;
    
    try {
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), {
        title,
        description: '',
        status: 'active',
        createdAt: serverTimestamp()
      });
      setSelectedProjectId(docRef.id);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (e) {
      console.error("Error adding project: ", e);
    }
  };

  const deleteProject = async (e, id) => {
    e.stopPropagation();
    if(!confirm("确定要删除这个项目吗？")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id));
      if (selectedProjectId === id) setSelectedProjectId(null);
    } catch (e) {
      console.error("Error deleting project", e);
    }
  };

  const updateProject = async (data) => {
    if (!selectedProjectId) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', selectedProjectId), data);
  };

  const addTask = async (title) => {
    if (!selectedProjectId) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'projects', selectedProjectId, 'tasks'), {
      title,
      completed: false,
      createdAt: serverTimestamp()
    });
  };

  const toggleTask = async (task) => {
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', selectedProjectId, 'tasks', task.id), {
      completed: !task.completed
    });
  };

  const deleteTask = async (taskId) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', selectedProjectId, 'tasks', taskId));
  };

  const handleLogout = () => {
    if(confirm('确定要退出登录吗？')) {
      signOut(auth);
    }
  };

  // Derived State
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  }, [tasks]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      
      {/* Modals */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <AuthModal isOpen={showAuthModal && !user} onClose={() => setShowAuthModal(false)} />

      {/* --- Mobile Sidebar Overlay --- */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- Sidebar (Directory) --- */}
      <div className={`
        fixed md:relative z-30 h-full
        w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 
        transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="font-bold text-white flex items-center text-lg">
            <Layout className="w-5 h-5 mr-2 text-indigo-400" />
            Project Nexus
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="查找项目..." 
              className="w-full bg-slate-800 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-500 px-3 py-2 uppercase tracking-wider flex justify-between items-center">
             <span>我的项目库</span>
             <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{projects.length}</span>
          </div>
          {filteredProjects.map(project => (
            <div 
              key={project.id}
              onClick={() => {
                setSelectedProjectId(project.id);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-colors ${selectedProjectId === project.id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <div className="flex items-center overflow-hidden">
                <Folder className={`w-4 h-4 mr-3 shrink-0 ${selectedProjectId === project.id ? 'text-indigo-200' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="truncate text-sm font-medium">{project.title}</span>
              </div>
            </div>
          ))}
        </div>

        {/* User / Subscription Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="bg-slate-800 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex shrink-0 items-center justify-center text-white font-bold text-xs">
                  {user && user.email ? user.email[0].toUpperCase() : 'G'}
                </div>
                <div className="ml-2 overflow-hidden">
                  <div className="text-xs text-white font-medium truncate max-w-[100px]" title={user?.email || 'Guest'}>
                    {user?.email || 'Guest User'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {user?.isAnonymous ? '未同步' : '已同步'}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-white transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="w-full text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded transition-colors flex items-center justify-center"
            >
              升级 Pro
            </button>
          </div>

          <button 
            onClick={createProject}
            className="w-full flex items-center justify-center bg-white hover:bg-slate-50 text-slate-900 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建项目
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative bg-slate-50">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
           <div className="flex items-center">
             <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600">
               <Menu className="w-6 h-6" />
             </button>
             <span className="ml-2 font-bold text-slate-800 truncate max-w-[150px]">
               {selectedProject ? selectedProject.title : 'Project Nexus'}
             </span>
           </div>
           <button onClick={() => setShowUpgradeModal(true)} className="text-indigo-600">
             <CreditCard className="w-5 h-5" />
           </button>
        </div>

        {selectedProject ? (
          <>
            {/* Desktop Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-6 hidden md:block">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    {selectedProject.title}
                    <span className="ml-3 text-xs font-normal px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                      进行中
                    </span>
                  </h1>
                </div>
                
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">{progress}%</span>
                  <div className="w-32 lg:w-48 bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center space-x-6 mt-6">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  控制台
                </button>
                <button 
                  onClick={() => setActiveTab('ai-helper')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'ai-helper' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  <Cpu className="w-4 h-4 mr-1.5" />
                  AI 助手
                </button>
              </div>
            </header>
            
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex border-b border-slate-200 bg-white sticky top-0 z-10">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
              >
                任务
              </button>
              <button 
                onClick={() => setActiveTab('ai-helper')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 flex justify-center items-center ${activeTab === 'ai-helper' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
              >
                AI 助手
              </button>
            </div>

            {/* Content Body */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20 md:pb-0">
                  <div className="lg:col-span-2 space-y-6">
                    <ProjectOverviewModule 
                      project={selectedProject} 
                      onUpdateProject={updateProject}
                    />
                    
                    {/* Pro Banner */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg hidden md:flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">升级到 Pro 团队版</h3>
                        <p className="text-indigo-100 opacity-90 text-sm mt-1">
                          需要多人协作？现在订阅可享首月 5 折优惠。
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowUpgradeModal(true)}
                        className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-50 transition-colors"
                      >
                        查看方案
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-1 min-h-[500px]">
                    <TaskModule 
                      projectId={selectedProject.id}
                      tasks={tasks}
                      onAddTask={addTask}
                      onToggleTask={toggleTask}
                      onDeleteTask={deleteTask}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'ai-helper' && (
                <div className="max-w-3xl mx-auto py-2">
                  <AIPromptModule project={selectedProject} tasks={tasks} />
                </div>
              )}
            </main>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layout className="w-8 h-8 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">开始你的第一个项目</h2>
              <p className="mb-6 text-sm">
                Project Nexus 已准备好同步你的所有设备。
              </p>
              <button 
                onClick={createProject}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                + 新建项目
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}