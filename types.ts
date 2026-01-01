export interface NewsTopic {
  id: string;
  title: string;
  summary: string;
  sourceUrls: string[];
  relevanceScore: number;
  category?: string;
}

export interface ScriptConfiguration {
  wordCount: number;
  style: string;
  model: GeminiModel;
  authorRole: string;
  format: 'Video Script' | 'Blog Post' | 'Article' | 'Formal Report';
  language: string; 
}

export interface ScriptSection {
  title: string;
  content: string; 
  visualPrompt?: string; 
  timestampStr?: string; 
}

export interface GeneratedScript {
  title: string;
  subtitleOrDescription: string;
  tags: string[];
  sections: ScriptSection[];
  config: ScriptConfiguration; 
}

export interface Slide {
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
}

export interface ProjectState {
  step: 'api_key' | 'discovery' | 'configuration' | 'scripting' | 'assets';
  selectedTopic: NewsTopic | null;
  scriptConfig: ScriptConfiguration;
  script: GeneratedScript | null;
  
  // Assets
  thumbnailUrl: string | null;
  audioOverviewUrl: string | null;
  slideDeck: Slide[] | null;
  formattedDocument: string | null; // HTML/Markdown string for Word

  // Processing States
  isProcessing: boolean;
  processStatus: string;
  progress: number;
  
  // Max step reached to allow navigating back/forward
  furthestStepReached: 'api_key' | 'discovery' | 'configuration' | 'scripting' | 'assets';
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  topic: NewsTopic;
  config: ScriptConfiguration;
  script: GeneratedScript;
  assets: {
    thumbnailUrl: string | null;
    audioOverviewUrl: string | null;
    slideDeck: Slide[] | null;
    formattedDocument: string | null;
  };
}

export enum GeminiModel {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview',
  IMAGE = 'gemini-3-pro-image-preview',
  AUDIO = 'gemini-2.5-flash-preview-tts'
}
