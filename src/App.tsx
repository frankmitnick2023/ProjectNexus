import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, Auth, User, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, serverTimestamp, updateDoc, Firestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// ==============================================================================
// 1. 🟢 配置区域
// ==============================================================================
const MANUAL_CONFIG = {
  // ⚠️ 请确保这里填入了你完整的 Firebase 配置
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58",
  authDomain: "", 
  projectId: "", 
  storageBucket: "", 
  messagingSenderId: "", 
  appId: "" 
};

// 防止 TS 报错
declare global {
  interface Window { __firebase_config?: string; __app_id?: string; __initial_auth_token?: string; }
}

// ==============================================================================
// 2. 🎨 你的主要应用代码
// ==============================================================================
const MainContent = ({ user, db, appId }: { user: User | null, db: Firestore, appId: string }) => {
  // ⬇️⬇️⬇️ 在这里替换成你真正的业务逻辑/组件 ⬇️⬇️⬇️
  
  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'todos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setItems(list);
    });
    return () => unsubscribe();
  }, [user, db, appId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'todos'), {
      text, completed: false, createdAt: serverTimestamp()
    });
    setText('');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <header className="border-b px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">我的正式版应用</h1>
        <div className="text-sm text-slate-500">
          {user ? `已登录` : '连接中...'}
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        <form onSubmit={add} className="flex gap-2 mb-8">
          <input 
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="添加一条新记录..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition">
            添加
          </button>
        </form>

        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${item.completed ? 'bg-green-500' : 'bg-blue-500'}`} />
               <span>{item.text}</span>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-10 text-slate-400">暂无数据</div>
          )}
        </div>
      </main>
    </div>
  );
};


// ==============================================================================
// 3. 🛡️ 系统底层 (Wrapper)
// ==============================================================================
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const appRef = useRef<FirebaseApp | null>(null);
  const authRef = useRef<Auth | null>(null);
  const dbRef = useRef<Firestore | null>(null);
  const appIdRef = useRef<string>('default-app-id');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // --- 1. 获取配置 ---
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
          throw new Error("应用配置缺失 (API Key missing)");
        }

        // --- 2. 初始化 Firebase ---
        if (!getApps().length) {
          appRef.current = initializeApp(config);
        } else {
          appRef.current = getApp();
        }
        
        authRef.current = getAuth(appRef.current);
        dbRef.current = getFirestore(appRef.current);

        // --- 3. 设置 App ID ---
        if (typeof window !== 'undefined' && window.__app_id) {
          appIdRef.current = window.__app_id;
        }

        // --- 4. 监听用户状态 ---
        onAuthStateChanged(authRef.current, (u) => setCurrentUser(u));

        // --- 5. 执行登录 (包含自动错误恢复) ---
        const token = typeof window !== 'undefined' && window.__initial_auth_token
          ? window.__initial_auth_token
          : (typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null);

        if (token) {
          try {
            // 尝试使用环境注入的 Token 登录
            await signInWithCustomToken(authRef.current, token);
          } catch (authErr: any) {
            // 🛠️ 关键修复：如果 Token 不匹配 (custom-token-mismatch)，说明我们在用自己的 Key
            // 此时忽略 Token 错误，自动降级为匿名登录
            if (authErr.code === 'auth/custom-token-mismatch' || authErr.code === 'auth/invalid-custom-token') {
              console.warn("环境 Token 与手动配置不匹配，已自动切换为匿名登录。");
              await signInAnonymously(authRef.current);
            } else {
              // 如果是其他错误 (如网络断开)，则抛出
              throw authErr;
            }
          }
        } else {
          await signInAnonymously(authRef.current);
        }

        setIsReady(true);

      } catch (e: any) {
        console.error("System Init Failed:", e);
        setInitError(e.message);
      }
    };

    init();
  }, []);

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-800 mb-2">应用启动遇到问题</h2>
          <p className="text-slate-500 mb-4 text-sm">{initError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">刷新重试</button>
        </div>
      </div>
    );
  }

  if (!isReady || !dbRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-slate-300 w-8 h-8" />
          <p className="text-slate-400 text-xs font-medium tracking-wide uppercase">Loading Application...</p>
        </div>
      </div>
    );
  }

  return (
    <MainContent 
      user={currentUser} 
      db={dbRef.current} 
      appId={appIdRef.current} 
    />
  );
}