import React, { useState, useEffect } from 'react';
import TopicSelector from './components/TopicSelector';
import ScriptConfigurator from './components/ScriptConfigurator';
import ScriptEditor from './components/ScriptEditor';
import AssetPreview from './components/AssetPreview';
import { discoverTopics, generateScript, generateThumbnail, generateIntroOverview, generateSlideDeck, generateFormattedDocument } from './services/geminiService';
import { NewsTopic, GeneratedScript, ProjectState, ScriptConfiguration, HistoryItem } from './types';
import { translations, Translations } from './locales';

// Icons
const Icons = {
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
  Document: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Assets: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  History: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const STEPS_ORDER = ['discovery', 'configuration', 'scripting', 'assets'];

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [topics, setTopics] = useState<NewsTopic[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [uiLang, setUiLang] = useState<'en' | 'zh'>('en');
  
  const t: Translations = translations[uiLang];

  const [state, setState] = useState<ProjectState>({
    step: 'api_key',
    selectedTopic: null,
    scriptConfig: {} as any, 
    script: null,
    thumbnailUrl: null,
    audioOverviewUrl: null,
    slideDeck: null,
    formattedDocument: null,
    isProcessing: false,
    processStatus: '',
    progress: 0,
    furthestStepReached: 'api_key'
  });

  useEffect(() => {
    const checkKey = async () => {
      let keyExists = false;
      if (window.aistudio) {
        keyExists = await window.aistudio.hasSelectedApiKey();
      } else if (process.env.API_KEY && process.env.API_KEY.length > 0) {
        keyExists = true;
      }
      if (keyExists) {
        setHasKey(true);
        setState(prev => ({ ...prev, step: 'discovery', furthestStepReached: 'discovery' }));
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (hasKey && state.step === 'discovery' && topics.length === 0) {
      handleRefreshTopics('General');
    }
  }, [hasKey, state.step]);

  // Helper to save current state to history
  const updateHistory = (
    topic: NewsTopic, 
    config: ScriptConfiguration, 
    script: GeneratedScript, 
    assets: HistoryItem['assets']
  ) => {
    setHistory(prev => {
      // Check if we are updating an existing recent item (simple dedupe based on topic ID and title)
      const existingIdx = prev.findIndex(item => item.topic.id === topic.id && item.script.title === script.title);
      
      const newItem: HistoryItem = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `hist-${Date.now()}`,
        timestamp: Date.now(),
        topic,
        config,
        script,
        assets
      };

      if (existingIdx >= 0) {
        const newHistory = [...prev];
        newHistory[existingIdx] = newItem;
        return newHistory;
      }
      return [newItem, ...prev];
    });
  };

  const handleLoadHistory = (item: HistoryItem) => {
    if (state.isProcessing) return;
    
    setState({
      step: 'scripting', // Jump to editor to review
      selectedTopic: item.topic,
      scriptConfig: item.config,
      script: item.script,
      thumbnailUrl: item.assets.thumbnailUrl,
      audioOverviewUrl: item.assets.audioOverviewUrl,
      slideDeck: item.assets.slideDeck,
      formattedDocument: item.assets.formattedDocument,
      isProcessing: false,
      processStatus: 'Restored from history',
      progress: 100,
      furthestStepReached: 'assets' // Unlock all steps
    });
  };

  const updateStep = (newStep: ProjectState['step']) => {
    setState(prev => {
        const currentIdx = STEPS_ORDER.indexOf(prev.furthestStepReached);
        const newIdx = STEPS_ORDER.indexOf(newStep);
        return {
            ...prev,
            step: newStep,
            furthestStepReached: newIdx > currentIdx ? newStep : prev.furthestStepReached
        };
    });
  };

  const handleKeySelection = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setHasKey(true);
        updateStep('discovery');
      } else {
        alert("AI Studio environment not detected. Check API_KEY.");
      }
    } catch (e) {
      console.error(e);
      alert("Selection failed.");
    }
  };

  const handleRefreshTopics = async (category: string) => {
    setState(prev => ({ ...prev, isProcessing: true, processStatus: `Scanning ${category} trends...`, progress: 30 }));
    try {
      const newTopics = await discoverTopics(category);
      setTopics(newTopics);
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.includes("Requested entity was not found")) {
        setHasKey(false);
        setState(prev => ({ ...prev, step: 'api_key' }));
      }
    } finally {
      setState(prev => ({ ...prev, isProcessing: false, processStatus: '', progress: 100 }));
    }
  };

  const handleSelectTopic = (topic: NewsTopic) => {
    setState(prev => ({ 
      ...prev, 
      selectedTopic: topic, 
      progress: 33 
    }));
    updateStep('configuration');
  };

  const handleGenerateScript = async (config: ScriptConfiguration) => {
    if (!state.selectedTopic) return;

    setState(prev => ({ 
      ...prev, 
      scriptConfig: config,
      isProcessing: true, 
      processStatus: `Composing ${config.format}...`,
      progress: 10
    }));
    updateStep('scripting');

    const progressInterval = setInterval(() => {
       setState(prev => {
         if (!prev.isProcessing || prev.progress >= 90) return prev;
         return { ...prev, progress: prev.progress + 3 };
       });
    }, 500);
    
    try {
      const script = await generateScript(state.selectedTopic, config);
      clearInterval(progressInterval);
      
      setState(prev => {
        // Save to history immediately upon success
        const assets = {
          thumbnailUrl: prev.thumbnailUrl,
          audioOverviewUrl: prev.audioOverviewUrl,
          slideDeck: prev.slideDeck,
          formattedDocument: prev.formattedDocument
        };
        updateHistory(prev.selectedTopic!, config, script, assets);

        return { 
          ...prev, 
          script, 
          isProcessing: false,
          processStatus: 'Draft ready.',
          progress: 100
        };
      });

    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      setState(prev => ({ ...prev, isProcessing: false, progress: 0, processStatus: `Error: ${err}` }));
    }
  };

  const handleProceedToAssets = () => {
    updateStep('assets');
  };

  const handleGenerateAsset = async (type: 'thumbnail' | 'audio' | 'slides' | 'document') => {
    if (!state.script) return;
    
    setState(prev => ({ ...prev, isProcessing: true, processStatus: `Generating ${type}...` }));

    try {
        let updates: Partial<ProjectState> = {};

        if (type === 'thumbnail') {
            const thumb = await generateThumbnail(state.script.title, state.script.sections[0]?.content || "Topic");
            updates = { thumbnailUrl: thumb };
        } else if (type === 'audio') {
            const audio = await generateIntroOverview(state.script);
            updates = { audioOverviewUrl: audio };
        } else if (type === 'slides') {
            const slides = await generateSlideDeck(state.script);
            updates = { slideDeck: slides };
        } else if (type === 'document') {
            const doc = await generateFormattedDocument(state.script);
            updates = { formattedDocument: doc };
        }

        // Apply state update and save to history
        setState(prev => {
           const newState = { ...prev, ...updates };
           if (prev.selectedTopic && prev.script) {
             const assets = {
               thumbnailUrl: newState.thumbnailUrl,
               audioOverviewUrl: newState.audioOverviewUrl,
               slideDeck: newState.slideDeck,
               formattedDocument: newState.formattedDocument
             };
             updateHistory(prev.selectedTopic, prev.scriptConfig, prev.script, assets);
           }
           return newState;
        });

    } catch (err) {
        console.error(err);
        alert(`Failed to generate ${type}`);
    } finally {
        setState(prev => ({ ...prev, isProcessing: false, processStatus: '' }));
    }
  };

  const handleNavClick = (targetStep: ProjectState['step']) => {
    if (state.isProcessing) return;
    const targetIdx = STEPS_ORDER.indexOf(targetStep);
    const maxIdx = STEPS_ORDER.indexOf(state.furthestStepReached);
    if (targetIdx <= maxIdx) {
        setState(prev => ({ ...prev, step: targetStep }));
    }
  };

  const steps = [
    { id: 'discovery', label: t.sidebar.steps.discovery, icon: Icons.Search },
    { id: 'configuration', label: t.sidebar.steps.configuration, icon: Icons.Settings },
    { id: 'scripting', label: t.sidebar.steps.scripting, icon: Icons.Document },
    { id: 'assets', label: t.sidebar.steps.assets, icon: Icons.Assets },
  ];

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl text-center">
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-indigo-400">{t.sidebar.title}</h1>
          <p className="text-gray-400 mb-8">{t.sidebar.subtitle}</p>
          <button 
            onClick={handleKeySelection}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all"
          >
            Start Project (Select Key)
          </button>
          <p className="text-xs text-gray-500 mt-4"><a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">Billing Required</a> for Advanced Models</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-indigo-400">
            {t.sidebar.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{t.sidebar.subtitle}</p>
        </div>
        
        {/* Navigation Steps */}
        <nav className="p-4 space-y-2 flex-shrink-0">
          {steps.map((s, idx) => {
            const isActive = state.step === s.id;
            const currentMaxStepIdx = STEPS_ORDER.indexOf(state.furthestStepReached);
            const isReachable = idx <= currentMaxStepIdx;
            
            return (
              <button 
                key={s.id}
                onClick={() => handleNavClick(s.id as any)}
                disabled={!isReachable}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  isActive ? 'bg-indigo-600 text-white shadow-lg' : 
                  isReachable ? 'text-gray-400 hover:bg-gray-700/50 hover:text-white cursor-pointer' : 'text-gray-600 cursor-not-allowed'
                }`}
              >
                <s.icon />
                <span className="font-medium">{s.label}</span>
                {idx < currentMaxStepIdx && <div className="ml-auto text-green-400"><Icons.Check /></div>}
              </button>
            );
          })}
        </nav>

        {/* History Log */}
        <div className="flex-1 overflow-y-auto px-4 py-2 border-t border-gray-700/50">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-800 py-2">
            <Icons.History />
            History Log
          </div>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-xs text-gray-600 italic pl-1">No compositions yet.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleLoadHistory(item)}
                  disabled={state.isProcessing}
                  className="w-full text-left p-3 rounded-lg bg-gray-900/50 hover:bg-gray-700 border border-gray-800 hover:border-gray-600 transition-all group disabled:opacity-50"
                >
                  <div className="text-sm font-medium text-gray-300 group-hover:text-white line-clamp-1 mb-1">
                    {item.script.title}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    <span className="bg-gray-800 px-1.5 py-0.5 rounded">{item.config.format.split(' ')[0]}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="p-4 bg-gray-900 m-4 rounded-lg border border-gray-700 flex-shrink-0">
           <div className="text-xs text-gray-400 mb-2 font-bold tracking-wider">{t.sidebar.status}</div>
           <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${state.isProcessing ? 'bg-indigo-500 animate-pulse' : 'bg-green-500'}`}
                style={{ width: `${state.progress}%` }}
              ></div>
           </div>
           <p className="text-xs text-gray-400 truncate">{state.processStatus || t.sidebar.ready}</p>
        </div>

        {/* Copyright Footer */}
        <div className="p-4 text-xs text-gray-500 border-t border-gray-800 text-center whitespace-pre-wrap">
            {t.sidebar.copyright}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* Language Selector */}
        <div className="absolute top-6 right-8 z-50">
          <select 
            value={uiLang} 
            onChange={(e) => setUiLang(e.target.value as any)}
            className="bg-gray-800 text-xs text-gray-300 border border-gray-600 rounded-md px-2 py-1 outline-none focus:border-indigo-500"
          >
            <option value="en">English (UI)</option>
            <option value="zh">繁體中文 (介面)</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {state.step === 'discovery' && (
            <TopicSelector 
              topics={topics} 
              onSelect={handleSelectTopic} 
              isLoading={state.isProcessing}
              onRefresh={handleRefreshTopics}
              t={t}
            />
          )}

          {state.step === 'configuration' && state.selectedTopic && (
            <ScriptConfigurator 
              topic={state.selectedTopic}
              initialConfig={state.scriptConfig}
              onGenerate={handleGenerateScript}
              onBack={() => updateStep('discovery')}
              isProcessing={state.isProcessing}
              t={t}
            />
          )}

          {state.step === 'scripting' && (
            <ScriptEditor 
              script={state.script}
              error={state.processStatus.startsWith('Error') ? state.processStatus : null}
              onUpdate={(s) => setState(prev => ({...prev, script: s}))}
              onConfirm={handleProceedToAssets}
              onRetry={() => handleGenerateScript(state.scriptConfig)}
              onBack={() => updateStep('configuration')}
              t={t}
            />
          )}

          {state.step === 'assets' && state.script && (
            <AssetPreview 
              thumbnailUrl={state.thumbnailUrl}
              audioUrl={state.audioOverviewUrl}
              slideDeck={state.slideDeck}
              formattedDocument={state.formattedDocument}
              scriptTitle={state.script.title}
              isProcessing={state.isProcessing}
              onGenerate={handleGenerateAsset}
              onBack={() => updateStep('scripting')}
              t={t}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
