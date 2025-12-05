import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, Auth, User, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, serverTimestamp, updateDoc, Firestore } from 'firebase/firestore';

// ==============================================================================
// 🟢 关键步骤：请在此处填入您的 Firebase 配置 🟢
// 只要填入这里，就能彻底解决 "Need to provide options" 报错
// ==============================================================================
const MANUAL_CONFIG = {
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58",             // 必填，例如: "AIzaSyD..."
  authDomain: "",         // 选填
  projectId: "",          // 选填
  storageBucket: "",      // 选填
  messagingSenderId: "",  // 选填
  appId: ""               // 选填
};

// 全局类型定义，防止 TypeScript 报错
declare global {
  interface Window { __firebase_config?: string; __app_id?: string; __initial_auth_token?: string; }
}

// ==============================================================================
// 🛠️ 内置图标组件 (使用 SVG 替代外部依赖，彻底解决 import 报错)
// ==============================================================================
const Icons = {
  AlertTriangle: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
  ),
  CheckCircle2: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
  ),
  Loader2: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  ),
  Plus: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  ),
  Trash2: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  ),
  Wifi: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
  ),
  Settings: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.35a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Rocket: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
  ),
  ShieldCheck: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
  ),
};

export default function App() {
  const [status, setStatus] = useState<'loading' | 'missing-config' | 'ready' | 'error'>('loading');
  const [debugMsg, setDebugMsg] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [newItemText, setNewItemText] = useState('');

  // Refs for Firebase instances
  const appRef = useRef<FirebaseApp | null>(null);
  const authRef = useRef<Auth | null>(null);
  const dbRef = useRef<Firestore | null>(null);
  const appIdRef = useRef<string>('default-app-id');

  // --- 初始化逻辑 ---
  useEffect(() => {
    const initFirebase = async () => {
      try {
        console.log("正在启动安全初始化流程...");

        let foundConfig: FirebaseOptions | null = null;
        let source = "none";

        // 1. 尝试手动配置
        if (MANUAL_CONFIG.apiKey && MANUAL_CONFIG.apiKey.length > 5) {
          foundConfig = MANUAL_CONFIG as FirebaseOptions;
          source = "manual";
        } 
        // 2. 尝试环境注入
        else if (typeof window !== 'undefined' && window.__firebase_config) {
          try {
            foundConfig = JSON.parse(window.__firebase_config);
            source = "env_window";
          } catch (e) { console.warn("Window config parse error"); }
        }
        // 3. 尝试全局变量
        else if (typeof __firebase_config !== 'undefined') {
          // @ts-ignore
          try { foundConfig = JSON.parse(__firebase_config); source = "env_global"; } catch (e) {}
        }

        // 4. ⛔️ 关键防御：如果没有配置，拦截启动
        // 这一步阻止了 "no-options" 错误的发生
        if (!foundConfig || !foundConfig.apiKey) {
          console.warn("❌ 未找到有效配置，拦截启动。");
          setStatus('missing-config'); 
          return;
        }

        console.log(`✅ 找到配置 (来源: ${source})，准备初始化...`);

        // 5. 安全初始化
        if (!getApps().length) {
          appRef.current = initializeApp(foundConfig);
        } else {
          appRef.current = getApp();
        }

        authRef.current = getAuth(appRef.current);
        dbRef.current = getFirestore(appRef.current);

        if (typeof window !== 'undefined' && window.__app_id) {
          appIdRef.current = window.__app_id;
        }

        // 6. 登录
        const token = typeof window !== 'undefined' && window.__initial_auth_token
          ? window.__initial_auth_token
          : (typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null);

        if (token) {
          await signInWithCustomToken(authRef.current, token);
        } else {
          await signInAnonymously(authRef.current);
        }

        setStatus('ready');

      } catch (err: any) {
        console.error("Init Error:", err);
        setDebugMsg(err.message || "Unknown Error");
        setStatus('error');
      }
    };

    initFirebase();
  }, []);

  // --- 监听状态 ---
  useEffect(() => {
    if (status !== 'ready' || !authRef.current) return;
    const unsubscribe = onAuthStateChanged(authRef.current, (u) => setUser(u));
    return () => unsubscribe();
  }, [status]);

  // --- 监听数据 ---
  useEffect(() => {
    if (!user || !dbRef.current) return;
    // 简单查询，不使用 orderBy 防止索引报错
    const q = query(collection(dbRef.current, 'artifacts', appIdRef.current, 'users', user.uid, 'todos'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // 内存排序
      list.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setItems(list);
    }, (err) => console.error("Firestore Error:", err));

    return () => unsubscribe();
  }, [user]);

  // --- 交互操作 ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !user || !dbRef.current) return;
    try {
      await addDoc(collection(dbRef.current, 'artifacts', appIdRef.current, 'users', user.uid, 'todos'), {
        text: newItemText, completed: false, createdAt: serverTimestamp()
      });
      setNewItemText('');
    } catch (err) { alert("写入失败"); }
  };

  const toggle = async (id: string, v: boolean) => {
    if (!dbRef.current) return;
    updateDoc(doc(dbRef.current, 'artifacts', appIdRef.current, 'users', user.uid, 'todos', id), { completed: !v });
  };

  const del = async (id: string) => {
    if (!dbRef.current) return;
    deleteDoc(doc(dbRef.current, 'artifacts', appIdRef.current, 'users', user.uid, 'todos', id));
  };

  // ================= 界面渲染 =================

  // 状态 1: 缺少配置 (黄色警告页)
  if (status === 'missing-config') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border-t-4 border-amber-400">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-amber-100 p-3 rounded-full">
              <Icons.Settings className="text-amber-600 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">需要配置</h1>
              <p className="text-amber-600 font-medium">应用已拦截启动</p>
            </div>
          </div>
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              我们已拦截 <code>no-options</code> 错误，防止了白屏。请在代码中填写您的配置。
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold mb-2">修复步骤：</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>如果项目中有 <code>firebase.js</code> 或 <code>App.jsx</code>，请删除它们。</li>
                <li>在当前代码顶部找到 <code>MANUAL_CONFIG</code>。</li>
                <li>填入 <code>apiKey</code> 等信息。</li>
                <li>点击保存。</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 状态 2: 错误
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 font-sans">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <Icons.AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800">发生错误</h2>
          <code className="block bg-slate-100 p-2 mt-2 rounded text-xs text-red-600 break-all text-left">{debugMsg}</code>
          <button onClick={() => window.location.reload()} className="mt-4 w-full py-2 bg-red-600 text-white rounded-lg">重试</button>
        </div>
      </div>
    );
  }

  // 状态 3: 加载中
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <Icons.Loader2 className="animate-spin text-blue-600 w-10 h-10 mb-4" />
        <p className="text-slate-500 font-medium">正在安全连接...</p>
      </div>
    );
  }

  // 状态 4: 正常运行
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-2xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
              <Icons.Rocket className="text-blue-600" />
              Project Nexus
            </h1>
            <p className="text-slate-500 text-sm mt-1">诊断模式 (Safe Mode)</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
            <Icons.Wifi size={18} />
            {user ? '系统在线' : '连接中...'}
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <form onSubmit={handleAddItem} className="p-6 border-b border-slate-100 flex gap-3 bg-slate-50/50">
            <input 
              value={newItemText} 
              onChange={e => setNewItemText(e.target.value)}
              placeholder={user ? "输入测试数据..." : "等待连接..."}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              disabled={!user}
            />
            <button disabled={!newItemText.trim() || !user} className="bg-blue-600 text-white px-6 rounded-xl font-medium flex items-center justify-center">
              <Icons.Plus size={24} />
            </button>
          </form>

          <div className="min-h-[300px]">
            {items.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Icons.ShieldCheck size={40} className="text-slate-300" />
                </div>
                <p className="font-medium text-slate-500">连接正常</p>
                <p className="text-xs mt-2 text-slate-400">暂无数据</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map(item => (
                  <li key={item.id} className="group flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <button onClick={() => toggle(item.id, item.completed)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-400 text-transparent'}`}>
                      <Icons.CheckCircle2 size={14} strokeWidth={3} />
                    </button>
                    <span className={`flex-1 text-base ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {item.text}
                    </span>
                    <button onClick={() => del(item.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Icons.Trash2 size={20} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {user && (
            <div className="bg-slate-50 border-t border-slate-100 p-3 text-center text-xs text-slate-400 font-mono">
              USER ID: {user.uid}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}