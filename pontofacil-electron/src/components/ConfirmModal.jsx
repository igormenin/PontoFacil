import React from 'react';
import { useUiStore } from '../store/uiStore';
import { AlertCircle, X, CheckSquare } from 'lucide-react';

const ConfirmModal = () => {
  const { isConfirmOpen, confirmTitle, confirmMessage, onConfirmAction, hideConfirm } = useUiStore();

  if (!isConfirmOpen) return null;

  const handleConfirm = () => {
    if (onConfirmAction) onConfirmAction();
    hideConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1e1a22]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border-2 border-[#eee5f0] animate-in zoom-in-95 duration-200">
        
        {/* Header Decorativo */}
        <div className="p-8 bg-[#fff7ff] border-b border-[#eee5f0] flex justify-between items-start">
           <div className="w-14 h-14 bg-[#ffdad6] rounded-2xl flex items-center justify-center text-[#ba1a1a] shadow-inner">
              <AlertCircle size={32} />
           </div>
           <button 
             onClick={hideConfirm}
             className="p-2 hover:bg-white rounded-full text-[#82737d] transition-all"
           >
             <X size={20} />
           </button>
        </div>

        {/* Conteúdo */}
        <div className="p-10 space-y-4">
          <h3 className="text-3xl font-black text-[#1e1a22] tracking-tighter leading-tight">
            {confirmTitle}
          </h3>
          <p className="text-[#50434d] font-bold text-lg leading-relaxed">
            {confirmMessage}
          </p>
        </div>

        {/* Ações */}
        <div className="p-10 bg-[#f4ebf6]/30 flex gap-4">
          <button 
            onClick={hideConfirm}
            className="flex-1 py-5 font-black text-[#82737d] rounded-[1.5rem] hover:bg-white transition-all text-sm uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-[2] py-5 bg-[#631660] text-white font-black rounded-[1.5rem] shadow-xl hover:bg-[#460045] transition-all transform active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
          >
            <CheckSquare size={18} />
            Confirmar e Seguir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
