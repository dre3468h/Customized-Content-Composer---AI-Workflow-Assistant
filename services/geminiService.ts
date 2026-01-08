import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { NewsTopic, GeneratedScript, GeminiModel, ScriptConfiguration, Slide } from "../types";

// Helper to get API Key (Env or LocalStorage)
const getApiKey = (): string => {
  // 1. Check process.env (for dev/build time injection)
  if (process.env.API_KEY) return process.env.API_KEY;
  
  // 2. Check LocalStorage (for deployed usage)
  const stored = localStorage.getItem("gemini_api_key");
  if (stored) return stored;

  throw new Error("API Key missing");
};

// ... (previous helper functions: base64ToWavBlob, writeString, cleanJsonString, SAFETY_SETTINGS) ...
// Helper: Convert Base64 PCM to WAV Blob
function base64ToWavBlob(base64: string, sampleRate: number = 24000): Blob {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const pcmData = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const byteRate = sampleRate * numChannels * 2; // 16-bit
  const blockAlign = numChannels * 2;
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);

  // write PCM data
  const pcmBytes = new Uint8Array(buffer, 44);
  pcmBytes.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Helper: Robust JSON cleaner
function cleanJsonString(text: string): string {
  if (!text) return "{}";
  let clean = text.replace(/```json\n?|```/g, '');
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  
  // Determine if it starts with { or [
  const start = (firstBrace === -1) ? firstBracket : (firstBracket === -1) ? firstBrace : Math.min(firstBrace, firstBracket);
  
  const lastBrace = clean.lastIndexOf('}');
  const lastBracket = clean.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);

  if (start !== -1 && end !== -1 && end > start) {
    clean = clean.substring(start, end + 1);
  }
  return clean.trim();
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

export const discoverTopics = async (category: string = 'General'): Promise<NewsTopic[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `
    You are a Content Strategist. 
    Find 5-6 trending, high-impact news topics related to "${category}".
    Prioritize recent events (last 7 days), but if specific news is scarce, include ongoing major trends or evergreen controversial topics suitable for content creation.
    
    Return the response in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        safetySettings: SAFETY_SETTINGS,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              relevanceScore: { type: Type.NUMBER, description: "Score 1-100 based on interest" }
            }
          }
        }
      }
    });

    let topics = JSON.parse(cleanJsonString(response.text || "[]"));
    
    // Robustness: Handle if model wraps array in an object (e.g. { "topics": [...] })
    if (!Array.isArray(topics)) {
        if ((topics as any).topics && Array.isArray((topics as any).topics)) {
            topics = (topics as any).topics;
        } else if ((topics as any).items && Array.isArray((topics as any).items)) {
            topics = (topics as any).items;
        } else {
             console.warn("Unexpected JSON structure for topics:", topics);
             return [];
        }
    }
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const urls = chunks
      .map(c => c.web?.uri)
      .filter((u): u is string => !!u);

    return topics.map((t: any, index: number) => ({
      ...t,
      id: `topic-${index}-${Date.now()}`,
      category: category,
      sourceUrls: urls.slice(0, 3)
    }));

  } catch (error) {
    console.error("Error discovering topics:", error);
    throw error;
  }
};

export const generateScript = async (topic: NewsTopic, config: ScriptConfiguration): Promise<GeneratedScript> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const isVideo = config.format === 'Video Script';
  
  const prompt = `
    Act as ${config.authorRole}.
    Compose a ${config.format} about: "${topic.title}".
    Context/Summary: "${topic.summary}".
    
    Target Audience: General Public interested in ${topic.category || 'General News'}.
    Language: ${config.language}.
    Tone/Style: ${config.style}.
    Approximate Length: ${config.wordCount} words.
    
    Structure the response as valid JSON with the following keys:
    1. title (String) - Engaging title.
    2. subtitleOrDescription (String) - Brief abstract or description.
    3. tags (Array of Strings)
    4. sections (Array of Objects)
       Each section object must have:
       - 'title' (String): Heading or Scene Header.
       - 'content' (String): The body text or spoken script.
       ${isVideo ? "- 'visualPrompt' (String): Detailed description for visual background." : ""}
       ${isVideo ? "- 'timestampStr' (String): E.g., '00:00'." : ""}
  `;

  const sectionProperties: any = {
    title: { type: Type.STRING },
    content: { type: Type.STRING },
  };

  if (isVideo) {
    sectionProperties.visualPrompt = { type: Type.STRING };
    sectionProperties.timestampStr = { type: Type.STRING };
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      subtitleOrDescription: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: sectionProperties
        }
      }
    }
  };

  const attemptGeneration = async (useStrictSchema: boolean): Promise<GeneratedScript> => {
    const geminiConfig: any = {
      safetySettings: SAFETY_SETTINGS,
      systemInstruction: `You are a professional content creator specializing in ${config.format}. Output valid JSON.`
    };

    if (useStrictSchema) {
      geminiConfig.responseMimeType = "application/json";
      geminiConfig.responseSchema = schema;
    } else {
      geminiConfig.responseMimeType = "application/json";
    }

    if (config.model === GeminiModel.PRO && config.wordCount > 1000) {
        geminiConfig.thinkingConfig = { thinkingBudget: 1024 };
    }

    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: geminiConfig
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");

    const parsed = JSON.parse(cleanJsonString(text));
    parsed.config = config;
    if (!parsed.sections && parsed.content) parsed.sections = parsed.content;
    
    // Add Copyright Section
    parsed.sections.push({
      title: "Copyright",
      content: `© ${new Date().getFullYear()} Kong Chun Yin. All Rights Reserved.`,
      visualPrompt: "Copyright screen with logo and author name",
      timestampStr: "End"
    });

    return parsed;
  };

  try {
    return await attemptGeneration(true);
  } catch (e) {
    console.warn("Strict generation failed, retrying with loose mode...", e);
    return await attemptGeneration(false);
  }
};

export const generateThumbnail = async (title: string, context: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `Create a cover image/thumbnail for a content piece titled "${title}". 
  Context: ${context}. 
  Style: Minimalist, editorial, high quality.
  Aspect Ratio: 16:9.`;

  const response = await ai.models.generateContent({
    model: GeminiModel.IMAGE,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image generated");
};

export const generateIntroOverview = async (script: GeneratedScript): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const summaryPrompt = `
    Based on the following content, write a compelling 30-40 second spoken introductory overview.
    It should hook the listener and summarize what they are about to read/watch.
    
    Title: ${script.title}
    Content Sample: ${script.sections.slice(0, 2).map(s => s.content).join(' ')}...
  `;
  
  const summaryResponse = await ai.models.generateContent({
    model: GeminiModel.FLASH,
    contents: summaryPrompt
  });
  
  const spokenText = summaryResponse.text || "Welcome to this presentation.";

  const response = await ai.models.generateContent({
    model: GeminiModel.AUDIO,
    contents: [{ parts: [{ text: spokenText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const wavBlob = base64ToWavBlob(base64Audio);
  return URL.createObjectURL(wavBlob);
};

export const generateSlideDeck = async (script: GeneratedScript): Promise<Slide[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `
    Based on the script provided, create a presentation slide deck structure (5-8 slides).
    Script Title: ${script.title}
    Script Content: ${script.sections.map(s => s.content).join('\n')}
    
    Return a JSON array where each item is a slide with:
    - title (String)
    - bulletPoints (Array of Strings) - Key takeaways
    - speakerNotes (String) - Brief notes for the presenter
  `;

  const response = await ai.models.generateContent({
    model: GeminiModel.FLASH,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            speakerNotes: { type: Type.STRING }
          }
        }
      }
    }
  });

  const slides = JSON.parse(cleanJsonString(response.text || "[]"));
  
  // Add Copyright Slide
  slides.push({
    title: "Copyright",
    bulletPoints: [`© ${new Date().getFullYear()} Kong Chun Yin`, "All Rights Reserved."],
    speakerNotes: "Closing attribution."
  });

  return slides;
};

export const generateFormattedDocument = async (script: GeneratedScript): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Generating an HTML structure that can be saved as .doc
  const prompt = `
    Convert the following script into a formatted HTML document suitable for export to MS Word.
    Use semantic HTML (h1, h2, p, ul).
    Add a professional header with the title and "Prepared by Kong Chun Yin".
    Add a Table of Contents placeholder if appropriate.
    
    Script Title: ${script.title}
    Script Content: ${script.sections.map(s => `<h2>${s.title}</h2><p>${s.content}</p>`).join('\n')}
    
    Return ONLY the HTML code inside <body> tags (no html/head tags needed).
  `;

  const response = await ai.models.generateContent({
    model: GeminiModel.FLASH,
    contents: prompt
  });

  return response.text || "";
};
