import React from 'react';
import { Layout, Search, Folder, Plus, X, LogOut, CreditCard } from 'lucide-react';

const Sidebar = ({ 
  user, 
  projects, 
  selectedProjectId, 
  onSelectProject, 
  searchTerm, 
  onSearchChange, 
  onCreateProject, 
  onLogout,
  onOpenUpgrade,
  isOpen,
  onClose
}) => {
  // ... Sidebar 的 JSX 代码 ...
  // 将原 App.jsx 中的 Sidebar 部分粘贴到这里
  // 使用 props 替换原来的 state
  return (
    <div className={`fixed md:relative z-30 h-full w-72 bg-slate-900 ... ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
       {/* Sidebar 内容 */}
    </div>
  );
};

export default Sidebar;

