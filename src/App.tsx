import React, { useState, useEffect, Component } from 'react';
import { AlertCircle, CheckCircle, Server, Monitor, ShieldAlert, Terminal } from 'lucide-react';

// 1. 错误边界组件：用于捕获 React 渲染树中的错误，防止整个页面白屏
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 min-h-screen font-sans text-red-900">
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-xl border-l-4 border-red-500">
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-4 text-red-600">
              <ShieldAlert className="w-8 h-8" />
              应用崩溃 (White Screen Diagnosed)
            </h1>
            <p className="mb-4">
              React 捕获到了一个渲染错误，这通常是导致"白屏"的原因。
            </p>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded overflow-auto font-mono text-sm mb-4">
              <p className="font-bold text-red-400">Error: {this.state.error && this.state.error.toString()}</p>
              <br/>
              <p className="opacity-75">Stack Trace:</p>
              <pre className="whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              刷新页面重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

// 2. 环境检查组件
const EnvironmentCheck = () => {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runChecks = async () => {
      const results = [];

      // 检查 1: 基本 JS 执行
      results.push({ name: 'JavaScript Execution', status: 'pass', msg: 'JS 正在运行' });

      // 检查 2: LocalStorage (常见问题源)
      try {
        localStorage.setItem('test_storage', '1');
        localStorage.removeItem('test_storage');
        results.push({ name: 'LocalStorage', status: 'pass', msg: '可用' });
      } catch (e) {
        results.push({ name: 'LocalStorage', status: 'warn', msg: '不可用或被禁用 (Security/Privacy settings)' });
      }

      // 检查 3: 视口尺寸
      results.push({ 
        name: 'Viewport Size', 
        status: 'info', 
        msg: `${window.innerWidth}x${window.innerHeight}` 
      });

      // 检查 4: User Agent
      results.push({ 
        name: 'User Agent', 
        status: 'info', 
        msg: navigator.userAgent.substring(0, 50) + '...' 
      });

      // 检查 5: 网络连接 (简单测试)
      if (navigator.onLine) {
        results.push({ name: 'Navigator Online', status: 'pass', msg: '在线' });
      } else {
        results.push({ name: 'Navigator Online', status: 'warn', msg: '离线状态' });
      }

      setChecks(results);
      setLoading(false);
    };

    runChecks();
  }, []);

  return (
    <div className="space-y-3">
      {checks.map((check, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
          <div className="flex items-center gap-2">
            {check.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-500" />}
            {check.status === 'warn' && <AlertCircle className="w-4 h-4 text-amber-500" />}
            {check.status === 'info' && <Monitor className="w-4 h-4 text-blue-500" />}
            <span className="font-medium text-gray-700">{check.name}</span>
          </div>
          <span className={`text-sm ${
            check.status === 'pass' ? 'text-green-700' : 
            check.status === 'warn' ? 'text-amber-700' : 'text-gray-500'
          }`}>
            {check.msg}
          </span>
        </div>
      ))}
    </div>
  );
};

// 3. 主应用组件
const Dashboard = () => {
  const [consoleLogs, setConsoleLogs] = useState([]);

  // 模拟捕获控制台日志
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      setConsoleLogs(prev => [...prev.slice(-4), `LOG: ${args.join(' ')}`]);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      setConsoleLogs(prev => [...prev.slice(-4), `ERR: ${args.join(' ')}`]);
      originalError(...args);
    };

    console.log("应用组件已挂载 (Component Mounted)");

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  const throwError = () => {
    // 这是一个用于测试错误边界的函数
    throw new Error("这是一个人为触发的测试错误！");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">React 渲染成功</h1>
              <p className="text-gray-500 text-sm">如果看到了这个页面，说明服务器部署基本正常。</p>
            </div>
          </div>
          <div className="hidden md:block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wide rounded-full">
            Status: Online
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Environment Checks */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-500" />
              环境诊断
            </h2>
            <EnvironmentCheck />
          </div>

          {/* Console Output & Actions */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl shadow-sm p-6 text-gray-300 font-mono text-sm">
              <h2 className="text-gray-100 font-bold mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Live Console Output
              </h2>
              <div className="space-y-1 h-32 overflow-y-auto">
                {consoleLogs.length === 0 && <span className="opacity-50 italic">Waiting for logs...</span>}
                {consoleLogs.map((log, i) => (
                  <div key={i} className={`border-l-2 pl-2 ${log.startsWith('ERR') ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">测试错误边界</h2>
              <p className="text-gray-500 text-sm mb-4">
                点击下方按钮将故意抛出一个 JavaScript 错误。如果 ErrorBoundary 工作正常，你应该看到红色的错误提示卡片，而不是白屏。
              </p>
              <button 
                onClick={() => setShouldThrow(true)} 
                className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded font-medium hover:bg-red-100 transition"
              >
                触发测试错误 (Trigger Error)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// 用于触发错误的辅助组件
const BuggyCounter = () => {
  throw new Error("I crashed!");
  return <h1>这行代码永远不会显示</h1>;
};

// 主 App 入口
export default function App() {
  const [shouldThrow, setShouldThrow] = useState(false);

  // 在这里定义状态提升，以便传递给 Dashboard
  // 为了演示简单，我们在 Dashboard 内部直接处理了逻辑
  // 实际上 Dashboard 是我们的主要内容

  return (
    <ErrorBoundary>
      {shouldThrow ? <BuggyCounter /> : (
        <DashboardWrapper onThrow={() => setShouldThrow(true)} />
      )}
    </ErrorBoundary>
  );
}

// 包装器，用于接收 onThrow props
const DashboardWrapper = ({ onThrow }) => {
  // 重新实现 Dashboard 的一部分逻辑以连接 onThrow
  // 为了保持单文件简洁，我将上面 Dashboard 的 "触发测试错误" 按钮逻辑稍微修改一下
  // 实际上上面的 Dashboard 组件没有接收 props。
  // 我们来做一个即兴修改：

  const [consoleLogs, setConsoleLogs] = useState([]);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    // 捕获日志用于显示
    const logHandler = (type, args) => {
        setConsoleLogs(prev => [...prev.slice(-4), `${type}: ${args.join(' ')}`]);
    };

    console.log = (...args) => { logHandler('LOG', args); originalLog(...args); };
    console.error = (...args) => { logHandler('ERR', args); originalError(...args); };

    console.log("System check init...");

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
         <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <Server size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">服务器渲染成功</h1>
              <p className="text-slate-500 text-sm">白屏问题已解决，基础 React 环境运行正常。</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wide rounded-full border border-emerald-100">
            System Operational
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <Monitor className="text-blue-500" size={20}/>
                        环境检测
                    </h3>
                    <EnvironmentCheck />
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-900 rounded-xl shadow-sm p-6 text-slate-300 font-mono text-xs md:text-sm">
                    <h3 className="text-slate-100 font-bold mb-3 flex items-center gap-2">
                        <Terminal size={16} />
                        Console Logs
                    </h3>
                    <div className="space-y-1 h-32 overflow-y-auto">
                        {consoleLogs.length === 0 && <span className="opacity-50 italic">-- 等待日志 --</span>}
                        {consoleLogs.map((log, i) => (
                        <div key={i} className={`truncate ${log.startsWith('ERR') ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {log}
                        </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-rose-500">
                    <h3 className="font-bold text-slate-900 mb-2">测试崩溃恢复</h3>
                    <p className="text-slate-500 text-sm mb-4">
                        点击按钮将抛出一个测试错误。如果没有出现"白屏"而是显示了红色的错误报告，说明 ErrorBoundary 已生效。
                    </p>
                    <button 
                        onClick={onThrow}
                        className="w-full py-2.5 bg-rose-50 text-rose-700 font-medium rounded hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <ShieldAlert size={18} />
                        触发测试错误
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};