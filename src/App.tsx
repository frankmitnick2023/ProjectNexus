import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { AlertOctagon, CheckCircle2, ShieldAlert, Terminal } from 'lucide-react';

// ==========================================
// 1. 在这里填入你的真实 Firebase 配置
//    (这是解决白屏的唯一核心)
// ==========================================
const MANUAL_CONFIG = {
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58", // ⚠️ 必须替换成你的真实 Key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// ==========================================
// 2. 安全的 Firebase 初始化函数
//    (不会在加载时崩溃，而是返回结果)
// ==========================================
function initFirebaseSafe() {
  try {
    // A. 尝试获取配置
    let config = null;
    let source = "unknown";

    // 优先使用手动配置（解决服务器白屏的关键）
    if (MANUAL_CONFIG.apiKey !== "AIzaSyXXXXXXXXXXXXXXXXXXXXXXX") {
      config = MANUAL_CONFIG;
      source = "Manual Config (Hardcoded)";
    } 
    // 其次尝试环境变量（本地开发）
    else if (typeof __firebase_config !== 'undefined') {
      config = JSON.parse(__firebase_config);
      source = "Auto-Injected (__firebase_config)";
    }

    // B. 如果没有配置，抛出明确错误
    if (!config) {
      throw new Error("找不到有效的 Firebase 配置。请在 App.jsx 的 MANUAL_CONFIG 中填入数据。");
    }

    // C. 防止重复初始化
    let app;
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    return { success: true, app, auth, db, source };

  } catch (error) {
    return { success: false, error: error };
  }
}

// ==========================================
// 3. 主界面组件
// ==========================================
export default function App() {
  const [status, setStatus] = useState({ loading: true, error: null, info: null });

  useEffect(() => {
    // 延迟 100ms 执行，确保 React 先渲染出界面，避免白屏
    const timer = setTimeout(() => {
      const result = initFirebaseSafe();
      
      if (result.success) {
        setStatus({ loading: false, error: null, info: result });
        console.log("Firebase initialized via:", result.source);
      } else {
        setStatus({ loading: false, error: result.error, info: null });
        console.error("Firebase Init Failed:", result.error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // --- 状态 1: 加载中 ---
  if (status.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // --- 状态 2: 依然报错 (红屏) ---
  if (status.error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-red-200">
          <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
            <ShieldAlert className="text-white w-8 h-8" />
            <h1 className="text-white font-bold text-xl">初始化失败 (App Crashed)</h1>
          </div>
          
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-red-800 font-bold mb-2">错误详情:</h2>
              <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                <code className="text-red-400 font-mono text-sm break-all">
                  {status.error.toString()}
                  {status.error.code === 'app/no-options' && (
                    <span className="block mt-2 text-yellow-400">
                      👉 也就是：initializeApp() 接收到了空值。
                    </span>
                  )}
                </code>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <h3 className="font-bold text-yellow-800 mb-1">如何修复?</h3>
              <p className="text-yellow-700 text-sm mb-2">
                看起来你的代码里没有有效的 Firebase 配置。
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
                <li>打开 <code>src/App.jsx</code></li>
                <li>找到顶部的 <code>MANUAL_CONFIG</code> 对象</li>
                <li>填入你从 Firebase 控制台获取的 apiKey 等信息</li>
                <li>保存并重新部署</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 状态 3: 成功 (绿屏) ---
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <CheckCircle2 className="w-8 h-8" />
            <h1 className="font-bold text-xl">应用已恢复正常</h1>
          </div>
          <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded border border-emerald-400">
            System Online
          </span>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <Terminal className="text-slate-400 mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-slate-700">配置来源诊断</h3>
              <p className="text-slate-500 text-sm mt-1">
                成功连接到 Firebase。当前使用的配置来源是：
              </p>
              <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded-full">
                {status.info.source}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold text-lg mb-4">下一步</h3>
            <p className="text-slate-600 leading-relaxed">
              恭喜！如果看到这个页面，说明白屏问题彻底解决了。
              <br /><br />
              你可以开始把你的业务逻辑（登录、数据读取等）写在这个组件里，或者恢复你原来的组件，但请务必保留 <code>MANUAL_CONFIG</code> 和 <code>initFirebaseSafe</code> 的逻辑。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}