import React, { useState } from 'react';
import { Cpu, Copy } from 'lucide-react';

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
请根据上述项目背景和当前的待办事项，为我提供下一步的具体实施建议或代码实现思路。
    `.trim();
    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
        setCopyStatus('已复制！');
        setTimeout(() => setCopyStatus('复制提示词'), 2000);
    });
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center text-indigo-600">
          <Cpu className="w-5 h-5 mr-2" /> AI 协作助手
        </h3>
        <button onClick={generatePrompt} className="text-xs md:text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors font-medium">
          刷新上下文
        </button>
      </div>
      <div className="relative">
        <textarea 
          className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" 
          value={generatedPrompt} 
          readOnly 
          placeholder="点击右上角'刷新上下文'生成提示词..." 
        />
        {generatedPrompt && (
          <button onClick={copyToClipboard} className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg hover:bg-indigo-700 flex items-center transition-all">
            <Copy className="w-4 h-4 mr-2" /> {copyStatus}
          </button>
        )}
      </div>
    </div>
  );
};

export default AIPromptModule;