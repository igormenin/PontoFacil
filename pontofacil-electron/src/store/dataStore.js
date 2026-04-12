import { create } from 'zustand';
import api from '../api/client';
import { useUiStore } from './uiStore';

export const useDataStore = create((set, get) => ({
  clientes: [],
  meses: [],
  feriados: [],
  valorHoraHistory: [],
  usuarios: [],
  smtpConfig: null,
  selectedMes: null,
  selectedDia: null,
  loading: false,
  error: null,

  fetchClientes: async () => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Carregando Dados', 'Buscando informações da carteira...');
    try {
      const response = await api.get('/cliente');
      set({ clientes: response.data, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar clientes', loading: false });
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  fetchMeses: async () => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Carregando Dados', 'Buscando meses de faturamento...');
    try {
      const response = await api.get('/mes');
      set({ meses: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: 'Erro ao carregar meses', loading: false });
      return [];
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  fetchMesDetail: async (anoMes) => {
    const target = anoMes || new Date().toISOString().substring(0, 7);
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Carregando Dados', 'Buscando espelho do mês...');
    try {
      // Auto-create month if it doesn't exist
      try { await api.get(`/mes/${target}`); } catch (e) {}
      
      const response = await api.get(`/dia/${target}`);
      set({ selectedMes: response.data, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar detalhes do mês', loading: false });
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  addIntervalo: async (intervalo) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando Solicitação', 'Salvando novo intervalo...');
    try {
      await api.post('/intervalo', intervalo);
      if (get().selectedMes) {
        const anoMes = get().selectedMes[0]?.diaData?.substring(0, 7);
        if (anoMes) await get().fetchMesDetail(anoMes);
      }
      return true;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao salvar intervalo' });
      return false;
    } finally {
      set({ loading: false });
      useUiStore.getState().hideLoading();
    }
  },

  updateIntervalo: async (id, data) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando Solicitação', 'Atualizando o intervalo selecionado...');
    try {
      await api.put(`/intervalo/${id}`, data);
      if (get().selectedMes) {
        const anoMes = get().selectedMes[0]?.diaData?.substring(0, 7);
        if (anoMes) await get().fetchMesDetail(anoMes);
      }
      return true;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao atualizar intervalo' });
      return false;
    } finally {
      set({ loading: false });
      useUiStore.getState().hideLoading();
    }
  },

  removeIntervalo: async (id) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Removendo Registro', 'Apagando os dados do sistema...');
    try {
      await api.delete(`/intervalo/${id}`);
      if (get().selectedMes && get().selectedMes.length > 0) {
        const anoMes = get().selectedMes[0]?.diaData?.substring(0, 7);
        if (anoMes) await get().fetchMesDetail(anoMes);
      }
      return true;
    } catch (error) {
      set({ error: 'Erro ao remover intervalo' });
      return false;
    } finally {
      set({ loading: false });
      useUiStore.getState().hideLoading();
    }
  },

  addCliente: async (cliente) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando Solicitação', 'Cadastrando novo cliente...');
    try {
      await api.post('/cliente', cliente);
      await get().fetchClientes();
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao adicionar cliente', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  updateCliente: async (id, data) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando Solicitação', 'Atualizando dados do cliente...');
    try {
      await api.put(`/cliente/${id}`, data);
      await get().fetchClientes();
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao atualizar cliente', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  deleteCliente: async (id) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Removendo Registro', 'Excluindo o cliente do sistema...');
    try {
      await api.delete(`/cliente/${id}`);
      await get().fetchClientes();
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: 'Erro ao excluir cliente. Verifique se existem lançamentos vinculados.', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  fetchValorHoraHistory: async (cliId) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Carregando Dados', 'Buscando histórico de valor-hora...');
    try {
      const response = await api.get(`/valor-hora?cliId=${cliId}`);
      set({ valorHoraHistory: response.data, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar histórico de valor/hora', loading: false });
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  addValorHora: async (data) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando Solicitação', 'Registrando novo valor de hora...');
    try {
      await api.post('/valor-hora', data);
      await get().fetchValorHoraHistory(data.vhCliId);
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao definir novo valor/hora', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  fetchFeriados: async () => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Carregando Dados', 'Buscando cadastro de feriados...');
    try {
      const response = await api.get('/feriado');
      set({ feriados: response.data, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar feriados', loading: false });
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  saveFeriado: async (data) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando Solicitação', 'Salvando dados do feriado...');
    try {
      await api.post('/feriado', data);
      await get().fetchFeriados();
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao salvar feriado', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  deleteFeriado: async (id) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Removendo Registro', 'Excluindo o feriado...');
    try {
      await api.delete(`/feriado/${id}`);
      await get().fetchFeriados();
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: 'Erro ao excluir feriado', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  fetchUsuarios: async () => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Carregando Dados', 'Buscando lista de usuários...');
    try {
      const response = await api.get('/usuario');
      set({ usuarios: response.data, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar usuários', loading: false });
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  saveUsuario: async (id, data) => {
    set({ loading: true, error: null });
    const isNew = !id;
    useUiStore.getState().showLoading('Processando Solicitação', isNew ? 'Cadastrando novo usuário...' : 'Atualizando dados do usuário...');
    try {
      if (isNew) {
        await api.post('/usuario', data);
      } else {
        await api.put(`/usuario/${id}`, data);
      }
      await get().fetchUsuarios();
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao salvar usuário', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  deleteUsuario: async (id) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Removendo Registro', 'Excluindo o usuário do sistema...');
    try {
      await api.delete(`/usuario/${id}`);
      await get().fetchUsuarios();
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: 'Erro ao excluir usuário', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  resetUsuarioPassword: async (id) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando Solicitação', 'Resetando senha para padrão...');
    try {
      await api.post(`/usuario/${id}/reset-password`);
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: 'Erro ao resetar senha', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  fetchSmtpConfig: async () => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Carregando Dados', 'Buscando configurações SMTP...');
    try {
      const response = await api.get('/configuracao/smtp');
      set({ smtpConfig: response.data, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar configurações SMTP', loading: false });
    } finally {
      useUiStore.getState().hideLoading();
    }
  },

  saveSmtpConfig: async (data) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando Solicitação', 'Salvando configurações SMTP...');
    try {
      await api.post('/configuracao/smtp', data);
      set({ smtpConfig: data, loading: false });
      return true;
    } catch (error) {
      set({ error: 'Erro ao salvar configurações SMTP', loading: false });
      return false;
    } finally {
      useUiStore.getState().hideLoading();
    }
  }
}));
