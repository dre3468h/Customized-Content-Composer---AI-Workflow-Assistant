import React from 'react';
import { GeneratedScript } from '../types';
import { Translations } from '../locales';

interface ScriptEditorProps {
  script: GeneratedScript | null;
  error?: string | null;
  onUpdate: (updatedScript: GeneratedScript) => void;
  onConfirm: () => void;
  onRetry?: () => void;
  onBack?: () => void;
  t: Translations;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, error, onUpdate, onConfirm, onRetry, onBack, t }) => {
  
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="bg-red-900/20 border border-red-800 p-8 rounded-2xl max-w-md w-full">
          <h3 className="text-xl font-bold text-white mb-2">{t.editor.failed}</h3>
          <p className="text-red-300 mb-6 font-mono text-sm">{error}</p>
          <div className="flex gap-4 justify-center">
             <button onClick={onBack} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold">{t.editor.back}</button>
             <button onClick={onRetry} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold">{t.editor.tryAgain}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="h-full flex flex-col space-y-4 animate-pulse p-4">
        <div className="h-48 bg-gray-800 rounded-xl"></div>
        <div className="flex-1 bg-gray-800 rounded-xl space-y-4 p-6">
           <div className="h-4 w-1/3 bg-gray-700 rounded"></div>
           <div className="h-4 w-full bg-gray-700 rounded"></div>
           <div className="h-4 w-full bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const isVideo = script.config.format === 'Video Script';

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...script, title: e.target.value });
  };

  const handleSectionContentChange = (index: number, newContent: string) => {
    const newSections = [...script.sections];
    newSections[index] = { ...newSections[index], content: newContent };
    onUpdate({ ...script, sections: newSections });
  };

  const handleExport = () => {
    // Plain Text Export
    let textContent = `${script.title}\n\n${script.subtitleOrDescription}\n\n`;
    textContent += "========================================\n\n";
    
    script.sections.forEach(s => {
        textContent += `--- ${s.title} ---\n\n`;
        if (s.visualPrompt) textContent += `[Visual: ${s.visualPrompt}]\n`;
        textContent += `${s.content}\n\n`;
    });
    
    // Add Copyright
    textContent += `\n\n========================================\n© ${new Date().getFullYear()} Kong Chun Yin. All Rights Reserved.`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-${script.title.substring(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in max-w-5xl mx-auto w-full pt-8">
      {/* Metadata Editor */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-4">
             <button onClick={onBack} className="text-gray-500 hover:text-white">&larr; {t.editor.back}</button>
             <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-l border-gray-600 pl-4">{script.config.format} • {script.config.wordCount} words</span>
           </div>
           
           <div className="flex gap-3">
             <button onClick={handleExport} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {t.editor.export} (.txt)
             </button>
             <button onClick={onConfirm} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-600/20 flex items-center gap-2">
              <span>{t.editor.proceed}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
             </button>
           </div>
        </div>
        
        <input 
          value={script.title} 
          onChange={handleTitleChange}
          className="w-full bg-transparent text-3xl font-bold text-white placeholder-gray-500 outline-none mb-2"
          placeholder={t.editor.titlePlaceholder}
        />
        <textarea 
          value={script.subtitleOrDescription} 
          onChange={(e) => onUpdate({ ...script, subtitleOrDescription: e.target.value })}
          className="w-full bg-transparent text-gray-400 text-lg outline-none resize-none"
          rows={2}
          placeholder={t.editor.descPlaceholder}
        />
      </div>

      {/* Content Editor */}
      <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col shadow-lg">
        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          {script.sections.map((section, idx) => (
            <div key={idx} className={`${isVideo ? 'pl-6 border-l-2 border-indigo-500/30' : ''}`}>
              
              {/* Header */}
              <div className="flex items-baseline gap-3 mb-2">
                {isVideo && section.timestampStr && (
                  <span className="font-mono text-xs text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded">{section.timestampStr}</span>
                )}
                <h3 className="text-xl font-bold text-gray-200 font-serif">{section.title}</h3>
              </div>

              {/* Body */}
              <textarea
                rows={Math.max(4, section.content.length / 80)}
                value={section.content}
                onChange={(e) => handleSectionContentChange(idx, e.target.value)}
                className={`w-full bg-transparent border-none p-0 text-gray-300 text-lg leading-relaxed outline-none resize-none focus:ring-0 ${isVideo ? '' : 'font-serif'}`}
              />

              {/* Visual Prompt (Only for video) */}
              {isVideo && section.visualPrompt && (
                <div className="mt-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                  <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">{t.editor.visual}</label>
                  <p className="text-sm text-gray-400 italic">{section.visualPrompt}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;