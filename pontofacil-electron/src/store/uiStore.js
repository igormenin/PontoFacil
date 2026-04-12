import { create } from 'zustand';

export const useUiStore = create((set) => ({
  isLoading: false,
  loadingTitle: 'Processando Solicitação',
  loadingMessage: 'Estamos salvando suas alterações, um momento...',

  isConfirmOpen: false,
  confirmTitle: 'Confirmar Ação',
  confirmMessage: 'Tem certeza que deseja prosseguir?',
  onConfirmAction: null,

  showLoading: (title = 'Processando Solicitação', message = 'Aguarde um momento...') => 
    set({ isLoading: true, loadingTitle: title, loadingMessage: message }),

  hideLoading: () => 
    set({ isLoading: false }),

  showConfirm: (title, message, onConfirm) => 
    set({ 
      isConfirmOpen: true, 
      confirmTitle: title, 
      confirmMessage: message, 
      onConfirmAction: onConfirm 
    }),

  hideConfirm: () => 
    set({ 
      isConfirmOpen: false, 
      onConfirmAction: null 
    }),
}));
