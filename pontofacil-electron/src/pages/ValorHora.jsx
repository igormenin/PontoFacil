import React, { useEffect, useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import { 
  CreditCard, Plus, Users, 
  Calendar, DollarSign, Clock, AlertCircle,
  Check, X, Loader2, ArrowUpRight, History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Footer from '../components/Footer';

const ValorHora = ({ onBack }) => {
  const { 
    clientes, fetchClientes, 
    valorHoraHistory, fetchValorHoraHistory, addValorHora,
    loading, error 
  } = useDataStore();

  const [selectedClientId, setSelectedClientId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    vhValor: '', 
    vhMesInicio: new Date().toISOString().substring(0, 10) 
  });

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    if (clientes.length === 1 && !selectedClientId) {
      setSelectedClientId(clientes[0].cliId.toString());
    }
  }, [clientes, selectedClientId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchValorHoraHistory(selectedClientId);
    }
  }, [selectedClientId, fetchValorHoraHistory]);

  const activeValor = useMemo(() => {
    return valorHoraHistory.find(v => v.vhAtivo) || null;
  }, [valorHoraHistory]);

  const selectedCliente = useMemo(() => {
    return clientes.find(c => c.cliId === parseInt(selectedClientId));
  }, [clientes, selectedClientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return;
    
    if (!formData.vhValor || parseFloat(formData.vhValor) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    const success = await addValorHora({
      vhCliId: parseInt(selectedClientId),
      vhValor: parseFloat(formData.vhValor),
      vhMesInicio: formData.vhMesInicio
    });

    if (success) {
      toast.success('Novo valor/hora estabelecido!');
      setIsModalOpen(false);
      setFormData({ 
        vhValor: '', 
        vhMesInicio: new Date().toISOString().substring(0, 10) 
      });
    } else {
      toast.error(useDataStore.getState().error?.message || useDataStore.getState().error || 'Erro ao definir valor/hora');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fff7ff]">
      {/* Header Editorial */}
      <header className="px-10 py-10 bg-white border-b border-[#eee5f0] shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div className="space-y-4">
            <div className="space-y-2 pt-8">
              <div className="flex items-center gap-2 text-[#631660] font-black uppercase tracking-[0.3em] text-[10px]">
                <CreditCard size={14} /> Economia Contratual
              </div>
              <h2 className="text-5xl font-black text-[#1e1a22] tracking-tighter">Valor por Hora</h2>
              <p className="text-[#50434d] font-medium max-w-xl">
                Gerencie as taxas de serviço e o histórico de valorização de seus contratos.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 min-w-[300px]">
             <label className="text-[10px] font-black text-[#631660] uppercase tracking-[0.2em] ml-1">Selecionar Cliente</label>
             <select 
               value={selectedClientId}
               onChange={(e) => setSelectedClientId(e.target.value)}
               className="w-full px-5 py-4 bg-[#f4ebf6] border-2 border-transparent focus:border-[#631660] focus:bg-white rounded-2xl outline-none font-bold text-[#1e1a22] transition-all appearance-none cursor-pointer"
             >
               <option value="">Escolha uma empresa...</option>
               {clientes.map(c => (
                 <option key={c.cliId} value={c.cliId}>{c.cliNome}</option>
               ))}
             </select>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-7xl mx-auto">
          {!selectedClientId ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-[#eee5f0] opacity-60">
               <div className="w-20 h-20 bg-[#f4ebf6] rounded-full flex items-center justify-center mb-6">
                  <Users size={40} className="text-[#631660] opacity-30" />
               </div>
               <h3 className="text-2xl font-black text-[#1e1a22]">Aguardando Seleção</h3>
               <p className="text-[#82737d] font-bold mt-2">Selecione um cliente acima para gerenciar seus valores.</p>
            </div>
          ) : loading && valorHoraHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#631660]" size={48} />
              <p className="font-black text-[#50434d] uppercase tracking-widest text-xs">Acessando Arquivos...</p>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Active Value Highlight */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#631660] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <DollarSign size={200} />
                  </div>
                  
                  <div className="relative z-10 space-y-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Valor Atual Ativo</p>
                      <h3 className="text-7xl font-black tracking-tighter">
                        {activeValor ? formatCurrency(activeValor.vhValor) : 'R$ 0,00'}
                      </h3>
                    </div>

                    <div className="flex gap-10">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Vigente desde</p>
                         <p className="font-bold text-lg">{activeValor ? formatDate(activeValor.vhMesInicio) : 'N/A'}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Status Contratual</p>
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                           <p className="font-bold text-lg">Ativo e Validado</p>
                         </div>
                       </div>
                    </div>

                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#631660] rounded-2xl font-black shadow-xl hover:bg-[#fff7ff] transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Plus size={20} /> Atualizar Taxa Horária
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border-2 border-[#eee5f0] p-10 flex flex-col justify-center items-center text-center space-y-4">
                   <div className="w-16 h-16 bg-[#f4ebf6] rounded-2xl flex items-center justify-center text-[#631660] mb-2">
                      <Clock size={32} />
                   </div>
                   <h4 className="text-xl font-black text-[#1e1a22]">Total de Horas</h4>
                   <p className="text-[#82737d] font-medium px-4">
                     As horas lançadas serão multiplicadas pelo valor ativo do período correspondente.
                   </p>
                </div>
              </div>

              {/* History Timeline */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <History className="text-[#631660]" size={20} />
                   <h4 className="text-xl font-black text-[#1e1a22] uppercase tracking-widest text-xs">Histórico de Reajustes</h4>
                </div>

                <div className="bg-white rounded-[2.5rem] border-2 border-[#eee5f0] overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#fff7ff] border-b border-[#eee5f0]">
                        <th className="px-8 py-6 text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em]">Início da Vigência</th>
                        <th className="px-8 py-6 text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em]">Valor / Hora</th>
                        <th className="px-8 py-6 text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em]">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em]">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee5f0]">
                      {valorHoraHistory.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-8 py-20 text-center text-[#82737d] font-bold">
                            Nenhum histórico registrado para este cliente.
                          </td>
                        </tr>
                      ) : (
                        valorHoraHistory.map((item) => (
                          <tr key={item.vhId} className="hover:bg-[#fff7ff] transition-colors">
                            <td className="px-8 py-6 font-bold text-[#1e1a22]">{formatDate(item.vhMesInicio)}</td>
                            <td className="px-8 py-6 font-black text-[#631660]">{formatCurrency(item.vhValor)}</td>
                            <td className="px-8 py-6">
                               <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                 item.vhAtivo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                               }`}>
                                 {item.vhAtivo ? 'Vigente' : 'Inativo'}
                               </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-[#d4c1cd] italic text-xs">Protegido</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Editorial for Update */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1e1a22]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-[#eee5f0] flex justify-between items-center bg-[#fff7ff]">
              <div>
                <h3 className="text-2xl font-black text-[#1e1a22] tracking-tighter">Novo Alinhamento</h3>
                <p className="text-xs font-bold text-[#631660] uppercase tracking-widest mt-1">Reajuste de Taxa Profissional</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-[#f4ebf6] rounded-full text-[#82737d] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#631660] uppercase tracking-[0.2em] ml-1">Para o Cliente</label>
                <div className="px-5 py-4 bg-[#f4ebf6] rounded-2xl font-black text-[#1e1a22] border-2 border-transparent">
                   {selectedCliente?.cliNome}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#631660] uppercase tracking-[0.2em] ml-1">Novo Valor / Hora (R$)</label>
                <div className="relative">
                  <DollarSign size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#82737d]" />
                  <input 
                    type="number"
                    step="0.01"
                    autoFocus
                    required
                    value={formData.vhValor}
                    onChange={(e) => setFormData({...formData, vhValor: e.target.value})}
                    placeholder="0,00"
                    className="w-full pl-12 pr-5 py-4 bg-[#f4ebf6] border-2 border-transparent focus:border-[#631660] focus:bg-white rounded-2xl outline-none font-bold text-[#1e1a22] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#631660] uppercase tracking-[0.2em] ml-1">Início da Vigência</label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#82737d]" />
                  <input 
                    type="date"
                    required
                    value={formData.vhMesInicio}
                    onChange={(e) => setFormData({...formData, vhMesInicio: e.target.value})}
                    className="w-full pl-12 pr-5 py-4 bg-[#f4ebf6] border-2 border-transparent focus:border-[#631660] focus:bg-white rounded-2xl outline-none font-bold text-[#1e1a22] transition-all"
                  />
                </div>
                <p className="text-[10px] text-[#82737d] italic mt-1 ml-1">* O valor ativo anterior será arquivado automaticamente.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-bold text-[#82737d] rounded-2xl hover:bg-[#f4ebf6] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 bg-[#631660] text-white font-black rounded-2xl shadow-lg hover:bg-[#460045] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpRight size={20} />}
                  Confirmar Valor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ValorHora;
