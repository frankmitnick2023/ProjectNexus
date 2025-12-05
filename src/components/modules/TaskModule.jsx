import React, { useState } from 'react';
import { CheckSquare, Check, Trash2, Plus } from 'lucide-react';

const TaskModule = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
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
        <CheckSquare className="w-5 h-5 mr-2 text-emerald-500" /> 执行步骤
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="text-center text-slate-400 py-8 italic text-sm">暂无任务</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="group flex items-start p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
              <button 
                onClick={() => onToggleTask(task)} 
                className={`mt-0.5 w-6 h-6 rounded border flex items-center justify-center mr-3 shrink-0 transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}
              >
                {task.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              <span className={`text-sm md:text-base pt-0.5 break-words flex-1 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {task.title}
              </span>
              <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-1">
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
          <button type="submit" className="px-4 md:px-5 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskModule;

