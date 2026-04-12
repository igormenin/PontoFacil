import React from 'react';
import { useUiStore } from '../store/uiStore';
import { Loader2 } from 'lucide-react';

const GlobalLoadingModal = () => {
  const { isLoading, loadingTitle, loadingMessage } = useUiStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1e1a22]/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-6 border-2 border-[#eee5f0] animate-in zoom-in-95 duration-200">
        
        {/* Spinner */}
        <div className="relative flex items-center justify-center mt-2">
          <div className="absolute inset-0 bg-[#f4ebf6] rounded-full blur-xl scale-150 animate-pulse" />
          <div className="w-20 h-20 bg-[#fff7ff] rounded-2xl flex items-center justify-center shadow-inner border border-[#eee5f0] relative z-10">
            <Loader2 size={40} className="text-[#631660] animate-spin" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2 mt-4">
          <h2 className="text-2xl font-black text-[#1e1a22] tracking-tight">{loadingTitle}</h2>
          <p className="text-[#50434d] font-medium text-sm leading-relaxed max-w-[240px] mx-auto">
            {loadingMessage}
          </p>
        </div>

        {/* Branding */}
        <div className="mt-4 pt-6 border-t border-[#eee5f0] w-full">
          <p className="text-[10px] font-black uppercase text-[#82737d] tracking-[0.2em]">
            Ponto Fácil
          </p>
        </div>

      </div>
    </div>
  );
};

export default GlobalLoadingModal;
