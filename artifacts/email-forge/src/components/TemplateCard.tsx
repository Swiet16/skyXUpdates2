import { Template } from '../data/templates';
import { EmailPreview } from './EmailPreview';
import { Play, Copy, Download, Bookmark, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateCardProps {
  template: Template;
  viewMode: 'large' | 'compact';
  isBookmarked: boolean;
  onBookmark: (id: string) => void;
}

export function TemplateCard({ template, viewMode, isBookmarked, onBookmark }: TemplateCardProps) {
  const { toast } = useToast();

  const handleCopyHTML = () => {
    const mockHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    /* Simulated HTML for ${template.filename} */
  </style>
</head>
<body>
  <h1>${template.companyName}</h1>
  <p>${template.subjectLine}</p>
  <!-- Layout: ${template.layout} -->
</body>
</html>`;
    
    navigator.clipboard.writeText(mockHtml);
    toast({
      title: 'HTML Copied to Clipboard',
      description: `${template.filename} is ready to paste.`,
    });
  };

  const handleDownload = () => {
    toast({
      title: 'Download Started',
      description: `Downloading ${template.filename}...`,
    });
  };

  const handlePreview = () => {
    toast({
      title: 'Preview Mode',
      description: `Opening full preview for ${template.companyName} template.`,
    });
  };

  return (
    <div className="group relative flex flex-col bg-[#141414] border border-[#262626] rounded-xl overflow-hidden hover:border-[#404040] transition-colors duration-200">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#262626] bg-[#0f0f0f]">
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: template.colorAccent }}
          />
          <span className="text-sm font-medium text-[#e5e5e5]">{template.companyName}</span>
        </div>
        <div className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider text-[#a3a3a3] bg-[#1f1f1f] border border-[#262626] uppercase">
          {template.category}
        </div>
      </div>

      {/* Preview Area */}
      <div className={`w-full bg-[#0d0d0d] flex items-center justify-center p-4 ${viewMode === 'large' ? 'h-[220px]' : 'h-[160px]'}`}>
        <div className={`w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]`}>
           <EmailPreview template={template} />
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#262626] bg-[#0f0f0f] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#737373]">
            <Terminal className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{template.filename}</span>
          </div>
          <span className="text-[10px] text-[#525252] font-medium border border-[#262626] px-1.5 py-0.5 rounded bg-[#141414]">
            {template.layout}
          </span>
        </div>
        
        {viewMode === 'large' && (
          <p className="text-xs text-[#a3a3a3] line-clamp-1 mt-1">
            {template.description}
          </p>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#262626]/50">
          <div className="flex items-center gap-1">
            <button 
              className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-[#262626] text-[#a3a3a3] hover:text-white transition-colors"
              onClick={handlePreview}
              title="Preview"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <button 
              className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-[#262626] text-[#a3a3a3] hover:text-white transition-colors"
              onClick={handleCopyHTML}
              title="Copy HTML"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button 
              className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-[#262626] text-[#a3a3a3] hover:text-white transition-colors"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <button 
            className={`flex items-center justify-center h-7 w-7 rounded-md hover:bg-[#262626] transition-colors ${isBookmarked ? 'text-yellow-500 hover:text-yellow-400' : 'text-[#a3a3a3] hover:text-white'}`}
            onClick={() => onBookmark(template.id)}
            title="Bookmark"
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      
    </div>
  );
}
