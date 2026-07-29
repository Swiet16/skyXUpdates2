import { Category, Layout, Template } from '../data/templates';

interface EmailPreviewProps {
  template: Template;
}

export function EmailPreview({ template }: EmailPreviewProps) {
  const { layout, category, companyName, subjectLine, colorAccent } = template;

  // A helper to generate initials for the logo
  const initials = companyName.substring(0, 2).toUpperCase();

  // Different rendering logic based on layout type to give variety
  return (
    <div className="w-full h-full bg-neutral-900 rounded-md overflow-hidden border border-neutral-800 flex flex-col items-center justify-center relative p-3">
      {/* Subject Line overlay mock */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-neutral-950 border-b border-neutral-800 flex items-center px-2 z-10">
        <div className="flex space-x-1 mr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-700"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-700"></div>
        </div>
        <span className="text-[9px] font-mono text-neutral-500 truncate select-none">
          Subject: {subjectLine}
        </span>
      </div>

      <div className="w-full h-full mt-5 relative flex items-center justify-center">
        {/* The Email Canvas */}
        {renderLayout(layout, companyName, initials, colorAccent)}
      </div>
    </div>
  );
}

function renderLayout(layout: Layout, companyName: string, initials: string, colorAccent: string) {
  switch (layout) {
    case 'Banner Hero':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-white rounded shadow-sm overflow-hidden flex flex-col border border-neutral-200">
          <div className="h-12 w-full flex items-center justify-center shrink-0" style={{ backgroundColor: colorAccent }}>
            <span className="text-white font-bold text-xs mix-blend-overlay">{companyName}</span>
          </div>
          <div className="p-3 flex flex-col gap-1.5 bg-white flex-1">
            <div className="h-2 w-3/4 bg-neutral-200 rounded"></div>
            <div className="h-1.5 w-full bg-neutral-100 rounded mt-1"></div>
            <div className="h-1.5 w-5/6 bg-neutral-100 rounded"></div>
            <div className="mt-auto h-4 w-1/2 rounded self-center" style={{ backgroundColor: colorAccent }}></div>
          </div>
        </div>
      );

    case 'Dark Card':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-neutral-950 rounded shadow-sm overflow-hidden flex flex-col border border-neutral-800 p-4">
          <div className="w-6 h-6 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: colorAccent }}>
            <span className="text-[8px] font-bold text-white">{initials}</span>
          </div>
          <div className="h-2 w-2/3 bg-neutral-700 rounded mb-2"></div>
          <div className="h-1.5 w-full bg-neutral-800 rounded mb-1"></div>
          <div className="h-1.5 w-4/5 bg-neutral-800 rounded"></div>
          <div className="mt-auto h-5 w-full rounded border border-neutral-700 flex items-center justify-center">
            <div className="h-1 w-6 rounded" style={{ backgroundColor: colorAccent }}></div>
          </div>
        </div>
      );

    case 'Minimal Letter':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-white rounded shadow-sm overflow-hidden flex flex-col border border-neutral-200 p-4">
          <div className="mb-3 text-[10px] font-serif font-bold text-neutral-800">{companyName}</div>
          <div className="h-1.5 w-1/4 bg-neutral-300 rounded mb-3"></div>
          <div className="flex flex-col gap-1">
            <div className="h-1 w-full bg-neutral-200 rounded"></div>
            <div className="h-1 w-full bg-neutral-200 rounded"></div>
            <div className="h-1 w-3/4 bg-neutral-200 rounded"></div>
            <div className="h-1 w-5/6 bg-neutral-200 rounded"></div>
          </div>
          <div className="mt-auto flex flex-col gap-1">
            <div className="h-1 w-1/3 bg-neutral-300 rounded"></div>
            <div className="h-1 w-1/4 bg-neutral-300 rounded"></div>
          </div>
        </div>
      );

    case 'Split Header':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-neutral-50 rounded shadow-sm overflow-hidden flex flex-col border border-neutral-200">
          <div className="p-2 border-b border-neutral-200 flex justify-between items-center bg-white">
            <div className="font-bold text-[8px] text-neutral-800 flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorAccent }}></div>
              {companyName}
            </div>
            <div className="text-[6px] text-neutral-400">Oct 24</div>
          </div>
          <div className="p-3 flex flex-col gap-2">
            <div className="h-2 w-1/2 bg-neutral-300 rounded"></div>
            <div className="flex flex-col gap-1">
              <div className="h-1 w-full bg-neutral-200 rounded"></div>
              <div className="h-1 w-full bg-neutral-200 rounded"></div>
            </div>
            <div className="w-full p-2 bg-white border border-neutral-200 rounded flex justify-between mt-1">
              <div className="h-1.5 w-1/3 bg-neutral-200 rounded"></div>
              <div className="h-1.5 w-1/4 rounded" style={{ backgroundColor: colorAccent }}></div>
            </div>
          </div>
        </div>
      );

    case 'Icon Steps':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-white rounded shadow-sm overflow-hidden flex flex-col border border-neutral-200 p-3">
          <div className="self-center h-2 w-1/3 bg-neutral-300 rounded mb-4 mt-1"></div>
          <div className="flex justify-between items-center px-4 relative">
            <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-neutral-100 -z-0 -translate-y-1/2"></div>
            <div className="w-4 h-4 rounded-full border-2 border-white z-10" style={{ backgroundColor: colorAccent }}></div>
            <div className="w-4 h-4 rounded-full border-2 border-white bg-neutral-200 z-10"></div>
            <div className="w-4 h-4 rounded-full border-2 border-white bg-neutral-200 z-10"></div>
          </div>
          <div className="mt-4 flex flex-col items-center gap-1">
            <div className="h-1.5 w-1/2 bg-neutral-200 rounded"></div>
            <div className="h-1 w-3/4 bg-neutral-100 rounded"></div>
          </div>
        </div>
      );

    case 'Sidebar Stat':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-white rounded shadow-sm overflow-hidden flex border border-neutral-200">
          <div className="w-1/3 h-full flex flex-col p-2 gap-2" style={{ backgroundColor: `${colorAccent}20` }}>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colorAccent }}></div>
            <div className="mt-auto flex flex-col gap-1">
              <div className="h-3 w-3/4 rounded" style={{ backgroundColor: colorAccent }}></div>
              <div className="h-1 w-full bg-neutral-300 rounded mix-blend-multiply"></div>
              <div className="h-1 w-1/2 bg-neutral-300 rounded mix-blend-multiply"></div>
            </div>
          </div>
          <div className="w-2/3 p-3 flex flex-col gap-1.5 bg-white">
            <div className="h-2 w-2/3 bg-neutral-800 rounded mb-1"></div>
            <div className="h-1 w-full bg-neutral-200 rounded"></div>
            <div className="h-1 w-full bg-neutral-200 rounded"></div>
            <div className="h-1 w-4/5 bg-neutral-200 rounded"></div>
            <div className="mt-auto h-4 w-full rounded" style={{ backgroundColor: colorAccent }}></div>
          </div>
        </div>
      );
      
    case 'Outline Frame':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-neutral-50 rounded shadow-sm overflow-hidden flex items-center justify-center border border-neutral-200 p-2">
          <div className="w-full h-full bg-white border-2 border-dashed border-neutral-200 rounded-sm p-3 flex flex-col items-center text-center">
            <div className="w-6 h-6 rounded-md mb-2 flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: colorAccent }}>
              {initials}
            </div>
            <div className="h-2 w-2/3 bg-neutral-800 rounded mb-1.5"></div>
            <div className="h-1 w-full bg-neutral-200 rounded mb-0.5"></div>
            <div className="h-1 w-4/5 bg-neutral-200 rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-neutral-800 rounded-sm mt-auto"></div>
          </div>
        </div>
      );

    case 'Gradient Mesh':
      return (
        <div className="w-full max-w-[200px] h-[140px] rounded shadow-sm overflow-hidden flex flex-col border border-neutral-800 p-4 relative" 
             style={{ background: `linear-gradient(135deg, ${colorAccent}40 0%, #111 100%)` }}>
          <div className="absolute inset-0 bg-black/40 mix-blend-overlay"></div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
            <div className="text-[12px] font-black text-white tracking-widest mb-2">{companyName}</div>
            <div className="h-1.5 w-3/4 bg-white/70 rounded mb-1"></div>
            <div className="h-1 w-1/2 bg-white/40 rounded"></div>
            <div className="mt-3 px-3 py-1 bg-white text-black text-[6px] font-bold rounded-full">RESERVE NOW</div>
          </div>
        </div>
      );

    case 'Long-Form Story':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-[#fcfcfc] rounded shadow-sm overflow-hidden flex flex-col border border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorAccent }}></div>
            <div className="h-1.5 w-1/3 bg-neutral-400 rounded"></div>
          </div>
          <div className="flex flex-col gap-1 mb-2">
            <div className="h-1 w-full bg-neutral-300 rounded"></div>
            <div className="h-1 w-full bg-neutral-300 rounded"></div>
            <div className="h-1 w-5/6 bg-neutral-300 rounded"></div>
          </div>
          <div className="flex flex-col gap-1 mb-2">
            <div className="h-1 w-full bg-neutral-300 rounded"></div>
            <div className="h-1 w-11/12 bg-neutral-300 rounded"></div>
            <div className="h-1 w-4/5 bg-neutral-300 rounded"></div>
          </div>
          <div className="mt-auto h-1 w-1/4 bg-neutral-400 rounded"></div>
        </div>
      );

    case 'Magazine Grid':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-white rounded shadow-sm overflow-hidden flex flex-col border border-neutral-200">
          <div className="h-6 w-full flex items-center justify-center border-b border-neutral-100">
            <span className="text-[7px] font-serif font-black tracking-widest text-neutral-900">{companyName}</span>
          </div>
          <div className="flex-1 p-2 flex gap-2">
            <div className="w-1/2 flex flex-col gap-1">
              <div className="h-10 w-full bg-neutral-100 rounded"></div>
              <div className="h-1.5 w-full bg-neutral-800 rounded mt-1"></div>
              <div className="h-1 w-full bg-neutral-200 rounded"></div>
            </div>
            <div className="w-1/2 flex flex-col gap-1">
              <div className="h-6 w-full bg-neutral-100 rounded"></div>
              <div className="h-1 w-3/4 bg-neutral-800 rounded"></div>
              <div className="h-6 w-full bg-neutral-100 rounded mt-1"></div>
              <div className="h-1 w-3/4 bg-neutral-800 rounded"></div>
            </div>
          </div>
        </div>
      );

    case 'Digest List':
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-white rounded shadow-sm overflow-hidden flex flex-col border border-neutral-200 p-2">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-neutral-100">
            <div className="h-2 w-1/3 bg-neutral-800 rounded"></div>
            <div className="h-1 w-1/6 bg-neutral-300 rounded"></div>
          </div>
          <div className="flex gap-2 items-start mb-2">
            <div className="w-4 h-4 rounded bg-neutral-200 shrink-0"></div>
            <div className="flex flex-col gap-0.5 w-full pt-0.5">
              <div className="h-1.5 w-full bg-neutral-700 rounded"></div>
              <div className="h-1 w-3/4 bg-neutral-300 rounded"></div>
            </div>
          </div>
          <div className="flex gap-2 items-start mb-2">
            <div className="w-4 h-4 rounded bg-neutral-200 shrink-0"></div>
            <div className="flex flex-col gap-0.5 w-full pt-0.5">
              <div className="h-1.5 w-4/5 bg-neutral-700 rounded"></div>
              <div className="h-1 w-2/3 bg-neutral-300 rounded"></div>
            </div>
          </div>
          <div className="mt-auto self-center h-2 w-1/4 rounded-full bg-neutral-100 flex items-center justify-center">
             <div className="h-0.5 w-1/2 rounded-full" style={{ backgroundColor: colorAccent }}></div>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full max-w-[200px] h-[140px] bg-white rounded shadow-sm border border-neutral-200 p-3"></div>
      );
  }
}
