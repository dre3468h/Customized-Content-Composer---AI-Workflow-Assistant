import React, { useState, useEffect } from 'react';
import { NewsTopic, ScriptConfiguration, GeminiModel } from '../types';
import { Translations } from '../locales';

interface ScriptConfiguratorProps {
  topic: NewsTopic;
  initialConfig?: ScriptConfiguration;
  onGenerate: (config: ScriptConfiguration) => void;
  onBack: () => void;
  isProcessing: boolean;
  t: Translations;
}

const ScriptConfigurator: React.FC<ScriptConfiguratorProps> = ({ topic, initialConfig, onGenerate, onBack, isProcessing, t }) => {
  const [config, setConfig] = useState<ScriptConfiguration>({
    wordCount: 800,
    style: 'Analytical & Professional',
    model: GeminiModel.FLASH,
    authorRole: 'Industry Expert',
    format: 'Article',
    language: 'English'
  });

  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleChange = (field: keyof ScriptConfiguration, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pt-8">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-gray-700 bg-gray-900/50">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-4 flex items-center gap-1">
            &larr; {t.config.back}
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">{t.config.title}</h2>
          <p className="text-gray-400">{t.config.selectedTopic}: <span className="text-indigo-400">{topic.title}</span></p>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Format & Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.config.format}</label>
              <select 
                value={config.format}
                onChange={(e) => handleChange('format', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none"
              >
                <option value="Article">{t.config.formats.article}</option>
                <option value="Video Script">{t.config.formats.video}</option>
                <option value="Formal Report">{t.config.formats.report}</option>
                <option value="Newsletter">{t.config.formats.newsletter}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.config.model}</label>
              <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-600">
                <button
                  onClick={() => handleChange('model', GeminiModel.FLASH)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${config.model === GeminiModel.FLASH ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Flash
                </button>
                <button
                  onClick={() => handleChange('model', GeminiModel.PRO)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${config.model === GeminiModel.PRO ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Pro
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.config.wordCount}: <span className="text-indigo-400">{config.wordCount}</span>
              </label>
              <input 
                type="range" 
                min="300" 
                max="3000" 
                step="100" 
                value={config.wordCount}
                onChange={(e) => handleChange('wordCount', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>300 ({t.config.brief})</span>
                <span>3000 ({t.config.deepDive})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.config.style}</label>
                <select 
                  value={config.style}
                  onChange={(e) => handleChange('style', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none"
                >
                  <option>Analytical & Professional</option>
                  <option>Casual & Conversational</option>
                  <option>Witty & Humorous</option>
                  <option>Academic & Formal</option>
                  <option>Persuasive & Opinionated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.config.language}</label>
                 <select 
                  value={config.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none"
                >
                  <option>English</option>
                  <option>Cantonese (Traditional Chinese)</option>
                  <option>Taiwanese (Traditional Chinese)</option>
                  <option>Mandarin (Simplified Chinese)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.config.persona}</label>
              <input 
                type="text"
                value={config.authorRole}
                onChange={(e) => handleChange('authorRole', e.target.value)}
                placeholder="e.g. Senior Tech Journalist"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-gray-700 bg-gray-900/50 flex justify-end">
          <button
            onClick={() => onGenerate(config)}
            disabled={isProcessing}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {t.config.composing}
              </>
            ) : (
              <>
                <span>{t.config.generate}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptConfigurator;
