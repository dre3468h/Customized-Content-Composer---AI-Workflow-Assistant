import React, { useState } from 'react';
import { NewsTopic } from '../types';
import { Translations } from '../locales';

interface TopicSelectorProps {
  topics: NewsTopic[];
  onSelect: (topic: NewsTopic) => void;
  isLoading: boolean;
  onRefresh: (category: string) => void;
  t: Translations;
}

const CATEGORIES = [
  "General", "Technology", "Socio-Economics", "Politics", "Education", "Finance", "Health"
];

const TopicSelector: React.FC<TopicSelectorProps> = ({ topics, onSelect, isLoading, onRefresh, t }) => {
  const [activeCategory, setActiveCategory] = useState('General');
  const [customTopic, setCustomTopic] = useState('');

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    onRefresh(cat);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;
    
    const topic: NewsTopic = {
      id: `custom-${Date.now()}`,
      title: customTopic,
      summary: 'Custom topic entered by user.',
      sourceUrls: [],
      relevanceScore: 100,
      category: 'Custom'
    };
    onSelect(topic);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pt-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{t.topic.title}</h2>
        <p className="text-gray-400">{t.topic.subtitle}</p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => !isLoading && handleCategoryChange(cat)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Manual Input */}
      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-xl mb-8">
         <form onSubmit={handleCustomSubmit} className="flex gap-4">
          <input 
            type="text" 
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder={t.topic.placeholder}
            className="flex-1 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
          />
          <button 
            type="submit"
            disabled={!customTopic.trim() || isLoading}
            className="px-6 py-3 bg-white text-indigo-900 hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl font-bold transition-all shadow-lg whitespace-nowrap"
          >
            {t.topic.compose}
          </button>
        </form>
      </div>

      {/* Topics Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {t.topic.trending} <span className="text-indigo-400">{activeCategory}</span>
          </h3>
          <button
            onClick={() => onRefresh(activeCategory)}
            disabled={isLoading}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            {t.topic.refresh}
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-48 bg-gray-800 rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <div 
                key={topic.id} 
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-indigo-500 hover:shadow-indigo-500/10 cursor-pointer transition-all shadow-lg group flex flex-col h-full"
                onClick={() => onSelect(topic)}
              >
                <div className="mb-4">
                   <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{topic.category || activeCategory}</span>
                    <span className="bg-indigo-900/30 text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                      Score: {topic.relevanceScore}
                    </span>
                   </div>
                   <h3 className="text-lg font-bold text-gray-100 group-hover:text-indigo-400 leading-snug">
                     {topic.title}
                   </h3>
                </div>
                
                <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-1">
                  {topic.summary}
                </p>
                
                <div className="mt-auto pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
                  <span>{topic.sourceUrls.length} {t.topic.sources}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-indigo-400">{t.topic.select} &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!isLoading && topics.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            {t.topic.noTopics}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicSelector;
