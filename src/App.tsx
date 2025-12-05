import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, Server, Globe, ShieldCheck } from 'lucide-react';

/**
 * =========================================================================
 * 🛠️ 关键修复区域：在此处填入你的 Firebase 配置
 * =========================================================================
 * * 为什么需要这样做？
 * 本地开发时，工具可能会自动注入配置。
 * 但部署到你自己的服务器时，这些魔法变量消失了，必须手动写死(Hardcode)配置。
 */
const manualConfig = {
  // ⚠️ 请去 Firebase 控制台复制真实数据替换下面的占位符
  apiKey: "AIzaSyDriBJ3yHf2XnNf5ouXd7S_KZsMu7V4w58",             // 例如: "AIzaSy..."
  authDomain: "project-nexus-9b304.firebaseapp.com",
  projectId: "project-nexus-9b304",
  storageBucket: "project-nexus-9b304.firebasestorage.app",
  messagingSenderId: "373323289724",
  appId: "1:373323289724:web:a7f5ce28e83ee9747825f9"
};

// --- Firebase 初始化逻辑 (防崩溃版) ---
let app;
let auth;
let db;
let initStatus = { success: false, message: '' };

try {
  // 1. 优先尝试读取 AI 环境/本地环境注入的变量 (如果有的话)
  let config;
  if (typeof __firebase_config !== 'undefined') {
    config = JSON.parse(__firebase_config);
    initStatus.source = 'Auto-Injected (AI Environment)';
  } else {
    // 2. 如果没有注入变量（比如在你的服务器上），则使用上面的手动配置
    config = manualConfig;
    initStatus.source = 'Manual Config (Hardcoded)';
  }

  // 3. 安全检查：如果配置还是空的，或者 apiKey 没填，就标记为失败，不要调用 initializeApp 防止白屏
  if (!config || !config.apiKey || config.apiKey === "YOUR_API_KEY_HERE") {
    throw new Error("配置缺失！请在代码中填入 manualConfig 的真实数据。");
  }

  // 4. 初始化
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  initStatus.success = true;
  initStatus.message = "Firebase 初始化成功";

} catch (e) {
  console.error("Firebase Init Error:", e);
  initStatus.success = false;
  initStatus.message = e.message;
}
// ----------------------------------------

export default function App() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // 简单的检查，看是否初始化成功
    if (initStatus.success) {
      setIsConfigured(true);
    }
  }, []);

  // 如果初始化失败（比如没填 key），显示这个配置引导页面
  if (!initStatus.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-red-100">
          <div className="bg-red-50 p-6 border-b border-red-100">
            <div className="flex items-center gap-3 text-red-700 mb-2">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="text-xl font-bold">应用启动失败</h1>
            </div>
            <p className="text-red-600/80 text-sm leading-relaxed">
              检测到 Firebase 初始化错误，这正是导致服务器白屏的原因。
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="bg-slate-100 p-3 rounded text-xs font-mono text-slate-600 break-all">
              Error: {initStatus.message}
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">如何修复：</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>打开你的项目文件 <code>src/App.jsx</code> (或其他入口文件)</li>
                <li>找到 <code>manualConfig</code> 对象</li>
                <li>将 <code>YOUR_API_KEY_HERE</code> 等占位符替换为你真实的 Firebase 项目配置</li>
                <li>重新构建并部署到服务器</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果初始化成功，显示正常应用界面 (这里是一个简单的 Dashboard 示例)
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-500 w-6 h-6" />
          <span className="font-bold text-lg">系统状态正常</span>
        </div>
        <div className="text-xs font-mono bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100">
          Status: Connected
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" />
            白屏问题已修复
          </h2>
          <p className="text-slate-600 mb-4">
            Firebase 已成功初始化。现在你的应用已经连接到了生产环境的配置。
          </p>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Server className="w-4 h-4" />
              当前配置来源
            </h3>
            <p className="text-sm text-slate-600 font-mono">
              {initStatus.source}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">网络连接</h3>
            <p className="text-sm text-slate-500">
              如果你能看到这个图标，说明你的服务器不仅加载了 JS，而且成功执行了 Firebase 连接逻辑。
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">下一步</h3>
            <p className="text-sm text-slate-500">
              现在你可以将这里的逻辑应用回你真正的业务代码中。核心要点是保留 <code>manualConfig</code> 并在 <code>__firebase_config</code> 缺失时使用它。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}