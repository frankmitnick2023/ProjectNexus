import React, { useState, useEffect } from 'react';

// --- Icon Components (Inline SVGs to fix import/forwardRef errors) ---

const LayoutIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="3" x2="21" y1="9" y2="9" />
    <line x1="9" x2="9" y1="21" y2="9" />
  </svg>
);

const HomeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SettingsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const BellIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const MenuIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" x2="21" y1="6" y2="6"/>
    <line x1="3" x2="21" y1="12" y2="12"/>
    <line x1="3" x2="21" y1="18" y2="18"/>
  </svg>
);

const XIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" x2="6" y1="6" y2="18"/>
    <line x1="6" x2="18" y1="6" y2="18"/>
  </svg>
);

// --- Main App Component ---

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Fix navigation bug', status: 'To Do', priority: 'High' },
    { id: 2, title: 'Update documentation', status: 'In Progress', priority: 'Medium' },
    { id: 3, title: 'Design system audit', status: 'Done', priority: 'Low' },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      status: 'To Do',
      priority: 'Medium'
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const moveTask = (id, newStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      'To Do': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Done': 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-xl text-indigo-600">
            <LayoutIcon className="w-8 h-8" />
            <span>TaskFlow</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tasks' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">My Tasks</span>
          </button>

          <button 
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'team' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <UsersIcon className="w-5 h-5" />
            <span className="font-medium">Team</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <button onClick={toggleSidebar} className="lg:hidden text-gray-500 hover:text-gray-700">
            <MenuIcon className="w-6 h-6" />
          </button>
          
          <div className="flex-1 px-4 lg:px-8">
            <h1 className="text-lg font-semibold text-gray-800 capitalize">{activeTab}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-600 relative">
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              JS
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <LayoutIcon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'Done').length}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                      <CheckCircleIcon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Team Members</p>
                      <p className="text-2xl font-bold text-gray-900">4</p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                      <UsersIcon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Task List Preview */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {tasks.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No tasks found</div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                          <span className="text-gray-700 font-medium">{task.title}</span>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tasks View */}
          {activeTab === 'tasks' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Add Task Form */}
              <form onSubmit={addTask} className="flex gap-4">
                <input
                  type="text"
                  placeholder="Add a new task..."
                  className="flex-1 rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add
                </button>
              </form>

              {/* Kanban-lite Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['To Do', 'In Progress', 'Done'].map((status) => (
                  <div key={status} className="bg-gray-100 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
                      {status}
                      <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full">
                        {tasks.filter(t => t.status === status).length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {tasks.filter(t => t.status === status).map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-700' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {task.priority}
                            </span>
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-gray-800 font-medium mb-3">{task.title}</p>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                             {/* Simple State Movers */}
                             {status !== 'To Do' && (
                               <button 
                                 onClick={() => moveTask(task.id, status === 'Done' ? 'In Progress' : 'To Do')}
                                 className="text-xs text-gray-500 hover:text-indigo-600"
                               >
                                 ← Back
                               </button>
                             )}
                             {status !== 'Done' && (
                               <button 
                                 onClick={() => moveTask(task.id, status === 'To Do' ? 'In Progress' : 'Done')}
                                 className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-auto"
                               >
                                 Next →
                               </button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simple Placeholders for other tabs */}
          {(activeTab === 'team' || activeTab === 'settings') && (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
              <div className="inline-flex p-4 rounded-full bg-gray-50 mb-4">
                {activeTab === 'team' ? <UsersIcon className="w-8 h-8 text-gray-400" /> : <SettingsIcon className="w-8 h-8 text-gray-400" />}
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1 capitalize">{activeTab} View</h3>
              <p className="text-gray-500">This section is currently under construction.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}