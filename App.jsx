import React, { useState, useEffect, useMemo } from 'react';
import { Menu, CreditCard, Cpu } from 'lucide-react';
import { signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

// 引入拆分后的模块
import { auth, db, APP_ID } from './config/firebase';
import TaskModule from './components/modules/TaskModule';
import AIPromptModule from './components/modules/AIPromptModule';
import ProjectOverviewModule from './components/modules/ProjectOverviewModule';
import Sidebar from './components/layout/Sidebar';
import AuthModal from './components/layout/AuthModal';
import UpgradeModal from './components/layout/UpgradeModal';

export default function App() {
  // ... 状态定义 (user, projects, tasks, etc.) ...
  // ... useEffect 数据获取逻辑 (和之前一样) ...
  // ... CRUD 操作函数 (createProject, addTask, etc.) ...

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <AuthModal isOpen={showAuthModal && !user} onClose={() => setShowAuthModal(false)} />
      
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <Sidebar 
        user={user}
        projects={projects}
        // ... 传递所有需要的 props
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative bg-slate-50">
        {/* 顶部 Header 和 Tab 切换逻辑 */}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
           {selectedProject ? (
             activeTab === 'dashboard' ? (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 space-y-6">
                   {/* 模块 1: 项目概览 */}
                   <ProjectOverviewModule project={selectedProject} onUpdateProject={updateProject} />
                 </div>
                 <div className="lg:col-span-1">
                   {/* 模块 2: 任务列表 */}
                   <TaskModule 
                     tasks={tasks} 
                     onAddTask={addTask} 
                     onToggleTask={toggleTask} 
                     onDeleteTask={deleteTask} 
                   />
                 </div>
               </div>
             ) : (
               /* 模块 3: AI 助手 */
               <div className="max-w-3xl mx-auto py-2">
                 <AIPromptModule project={selectedProject} tasks={tasks} />
               </div>
             )
           ) : (
             /* Empty State Component */
             <div>请选择项目...</div>
           )}
        </main>
      </div>
    </div>
  );
}

