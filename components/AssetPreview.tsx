import React from 'react';
import { Slide } from '../types';
import { Translations } from '../locales';

interface AssetPreviewProps {
  thumbnailUrl: string | null;
  audioUrl: string | null;
  slideDeck: Slide[] | null;
  formattedDocument: string | null;
  scriptTitle: string;
  isProcessing: boolean;
  onGenerate: (type: 'thumbnail' | 'audio' | 'slides' | 'document') => void;
  onBack: () => void;
  t: Translations;
}

const AssetPreview: React.FC<AssetPreviewProps> = ({ 
  thumbnailUrl, audioUrl, slideDeck, formattedDocument, scriptTitle, isProcessing, onGenerate, onBack, t
}) => {

  const handleDownloadSlides = () => {
    if (!slideDeck) return;
    let content = `# Slide Deck: ${scriptTitle}\n\n`;
    slideDeck.forEach((slide, i) => {
        content += `## Slide ${i+1}: ${slide.title}\n`;
        slide.bulletPoints.forEach(bp => content += `- ${bp}\n`);
        content += `\n*Speaker Notes: ${slide.speakerNotes}*\n\n---\n\n`;
    });
    
    // Explicit Footer for Text/Markdown Export
    content += `\n\n© ${new Date().getFullYear()} Kong Chun Yin. All Rights Reserved.`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-${scriptTitle.substring(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDoc = () => {
    if (!formattedDocument) return;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${scriptTitle}</title></head><body>`;
    
    const footerContent = `<div style="text-align:center; margin-top: 50px; font-size: 0.8em; color: #666; border-top: 1px solid #ccc; padding-top: 20px;">© ${new Date().getFullYear()} Kong Chun Yin. All Rights Reserved.</div>`;
    const footer = `${footerContent}</body></html>`;
    
    const sourceHTML = header + formattedDocument + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${scriptTitle.substring(0, 10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pt-8">
      <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-gray-500 hover:text-white flex items-center gap-2">
            &larr; {t.assets.back}
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{t.assets.title}</h2>
            <p className="text-gray-400 text-sm">{t.assets.subtitle}</p>
          </div>
          <div className="w-24"></div> {/* Spacer */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 1. Thumbnail */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {t.assets.cover}
             </h3>
             {!thumbnailUrl && (
                 <button 
                   onClick={() => onGenerate('thumbnail')} 
                   disabled={isProcessing}
                   className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full disabled:opacity-50"
                 >
                   {t.assets.generate}
                 </button>
             )}
          </div>
          <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center border border-gray-700 relative group shadow-inner flex-1">
            {thumbnailUrl ? (
              <>
                <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                <a 
                  href={thumbnailUrl} 
                  download={`cover-${scriptTitle.substring(0, 10)}.png`}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-medium transition-all backdrop-blur-sm"
                >
                  <span className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20">{t.assets.downloadPng}</span>
                </a>
              </>
            ) : (
              <p className="text-gray-600 text-sm">{t.assets.clickToGen}</p>
            )}
          </div>
        </div>

        {/* 2. Audio */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                {t.assets.audio}
             </h3>
             {!audioUrl && (
                 <button 
                   onClick={() => onGenerate('audio')} 
                   disabled={isProcessing}
                   className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full disabled:opacity-50"
                 >
                   {t.assets.generate}
                 </button>
             )}
          </div>
          
          <div className="flex-1 bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center space-y-6 border border-gray-700 relative overflow-hidden min-h-[200px]">
            {audioUrl ? (
               <div className="w-full space-y-4 z-10 relative">
                 <audio controls src={audioUrl} className="w-full" />
                 <a 
                   href={audioUrl} 
                   download="intro-overview.wav"
                   className="block text-center text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                 >
                   {t.assets.downloadWav}
                 </a>
               </div>
            ) : (
               <p className="text-gray-600 text-sm">{t.assets.clickToGen}</p>
            )}
          </div>
        </div>

        {/* 3. PowerPoint Overview */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex flex-col">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                {t.assets.slides}
             </h3>
             {!slideDeck && (
                 <button 
                   onClick={() => onGenerate('slides')} 
                   disabled={isProcessing}
                   className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full disabled:opacity-50"
                 >
                   {t.assets.generate}
                 </button>
             )}
          </div>
          <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-700 relative overflow-y-auto max-h-[300px]">
             {slideDeck ? (
                <div className="space-y-4">
                    {slideDeck.map((slide, i) => (
                        <div key={i} className="border-b border-gray-800 pb-2 last:border-0">
                            <p className="text-white font-bold text-sm">Slide {i+1}: {slide.title}</p>
                            <ul className="list-disc ml-4 text-xs text-gray-400 mt-1">
                                {slide.bulletPoints.map((bp, j) => <li key={j}>{bp}</li>)}
                            </ul>
                        </div>
                    ))}
                    <button onClick={handleDownloadSlides} className="w-full mt-4 py-2 bg-gray-800 hover:bg-gray-700 text-indigo-400 text-xs rounded border border-gray-700">
                        {t.assets.downloadMd}
                    </button>
                </div>
             ) : (
                <div className="h-full flex items-center justify-center">
                   <p className="text-gray-600 text-sm">{t.assets.clickToGen}</p>
                </div>
             )}
          </div>
        </div>

        {/* 4. Word Document */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex flex-col">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {t.assets.doc}
             </h3>
             {!formattedDocument && (
                 <button 
                   onClick={() => onGenerate('document')} 
                   disabled={isProcessing}
                   className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full disabled:opacity-50"
                 >
                   {t.assets.generate}
                 </button>
             )}
          </div>
          <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-700 relative overflow-hidden flex flex-col">
             {formattedDocument ? (
                 <>
                    <div className="flex-1 bg-white p-4 overflow-y-auto mb-4 rounded text-black text-[10px] opacity-80">
                        <div dangerouslySetInnerHTML={{ __html: formattedDocument }}></div>
                    </div>
                    <button onClick={handleDownloadDoc} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-indigo-400 text-xs rounded border border-gray-700">
                        {t.assets.downloadDoc}
                    </button>
                 </>
             ) : (
                 <div className="h-full flex items-center justify-center">
                    <p className="text-gray-600 text-sm">{t.assets.clickToGen}</p>
                 </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssetPreview;
