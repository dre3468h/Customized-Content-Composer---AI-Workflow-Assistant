export const translations = {
  en: {
    sidebar: {
      title: "Content Composer",
      subtitle: "AI Workflow Assistant",
      steps: {
        discovery: "1. Topic",
        configuration: "2. Config",
        scripting: "3. Editor",
        assets: "4. Assets"
      },
      status: "STATUS",
      ready: "Ready",
      copyright: "Created by Kong Chun Yin.\nAll Rights Reserved."
    },
    topic: {
      title: "What do you want to create about?",
      subtitle: "Select a category to discover trending topics or start with your own idea.",
      placeholder: "Or type your own topic here...",
      compose: "Compose",
      trending: "Trending in",
      refresh: "Refresh List",
      sources: "sources",
      select: "Select",
      noTopics: "No topics found."
    },
    config: {
      title: "Configure Composition",
      back: "Back to topics",
      selectedTopic: "Selected Topic",
      format: "Content Format",
      model: "AI Model",
      wordCount: "Approx Word Count",
      style: "Writing Style",
      language: "Language",
      persona: "Author Persona / Role",
      generate: "Generate Draft",
      composing: "Composing...",
      brief: "Brief",
      deepDive: "Deep Dive",
      formats: {
        article: "Article / Blog Post",
        video: "Video Script",
        report: "Formal Report",
        newsletter: "Newsletter"
      }
    },
    editor: {
      back: "Back",
      export: "Export Script",
      proceed: "Proceed to Assets",
      titlePlaceholder: "Title...",
      descPlaceholder: "Subtitle or Description...",
      visual: "Visual Direction",
      failed: "Generation Failed",
      tryAgain: "Try Again"
    },
    assets: {
      back: "Back to Editor",
      title: "Asset Production",
      subtitle: "Generate assets on demand to save tokens.",
      cover: "Cover Image",
      audio: "Introductory Audio",
      slides: "Presentation Slides",
      doc: "Word Document",
      generate: "Generate",
      downloadPng: "Download PNG",
      downloadWav: "Download Audio (WAV)",
      downloadMd: "Download Slide Outline (.md)",
      downloadDoc: "Download Word File (.doc)",
      clickToGen: "Click Generate to create"
    }
  },
  zh: {
    sidebar: {
      title: "內容創作助手",
      subtitle: "AI 工作流輔助",
      steps: {
        discovery: "1. 選題",
        configuration: "2. 設定",
        scripting: "3. 編輯",
        assets: "4. 素材"
      },
      status: "狀態",
      ready: "就緒",
      copyright: "Kong Chun Yin 製作。\n保留所有權利。"
    },
    topic: {
      title: "您想創作什麼內容？",
      subtitle: "選擇類別以發現熱門話題，或從您自己的想法開始。",
      placeholder: "或在此輸入您的主題...",
      compose: "開始創作",
      trending: "熱門話題：",
      refresh: "刷新列表",
      sources: "來源",
      select: "選擇",
      noTopics: "未找到話題。"
    },
    config: {
      title: "配置內容",
      back: "返回話題",
      selectedTopic: "已選話題",
      format: "內容格式",
      model: "AI 模型",
      wordCount: "大約字數",
      style: "寫作風格",
      language: "輸出語言",
      persona: "作者角色 / 設定",
      generate: "生成草稿",
      composing: "撰寫中...",
      brief: "簡短",
      deepDive: "深度",
      formats: {
        article: "文章 / 部落格",
        video: "影片腳本",
        report: "正式報告",
        newsletter: "電子報"
      }
    },
    editor: {
      back: "返回",
      export: "導出腳本",
      proceed: "前往素材",
      titlePlaceholder: "標題...",
      descPlaceholder: "副標題或描述...",
      visual: "視覺指導",
      failed: "生成失敗",
      tryAgain: "重試"
    },
    assets: {
      back: "返回編輯器",
      title: "素材製作",
      subtitle: "按需生成素材以節省資源。",
      cover: "封面圖片",
      audio: "語音導讀",
      slides: "簡報投影片",
      doc: "Word 文檔",
      generate: "生成",
      downloadPng: "下載 PNG",
      downloadWav: "下載音訊 (WAV)",
      downloadMd: "下載投影片大綱 (.md)",
      downloadDoc: "下載 Word 檔 (.doc)",
      clickToGen: "點擊生成以創建"
    }
  }
};

export type Translations = typeof translations.en;
