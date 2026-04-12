import React, { useState } from 'react';
import { 
  Clock, Plus, Trash2, 
  Save, AlertCircle, Calendar, User,
  CheckCircle2, Timer, Zap, Loader2, Download, ArrowLeft
} from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';
import TimePicker from '../components/TimePicker';
import { toast } from 'react-hot-toast';
import { convertToCSV, generateFilename } from '../utils/exportUtils';
import Footer from '../components/Footer';

const Dia = ({ dia, onBack }) => {
  const { clientes, selectedMes, addIntervalo, updateIntervalo, removeIntervalo, loading } = useDataStore();
  const { showConfirm } = useUiStore();
  
  // Encontrar o dia atualizado na store para refletir mudanças em tempo real (totais, lista)
  const currentDia = selectedMes?.find(d => d.diaId === dia.diaId) || dia;
  
  const [showModal, setShowModal] = useState(false);
  const [editingIntervalo, setEditingIntervalo] = useState(null);
  const [formData, setFormData] = useState({
    cliId: clientes[0]?.cliId || '',
    ordem: (currentDia.intervalos?.length || 0) + 1,
    inicio: '',
    fim: '',
    anotacoes: ''
  });

  const handleOpenAdd = () => {
    setEditingIntervalo(null);
    setFormData({
      cliId: clientes[0]?.cliId || '',
      ordem: (currentDia.intervalos?.length || 0) + 1,
      inicio: '',
      fim: '',
      anotacoes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (intervalo) => {
    setEditingIntervalo(intervalo);
    setFormData({
      cliId: intervalo.intCliId,
      ordem: intervalo.intOrdem,
      inicio: intervalo.intInicio,
      fim: intervalo.intFim || '',
      anotacoes: intervalo.intAnotacoes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliId || !formData.inicio) {
      toast.error('Cliente e Início são obrigatórios');
      return;
    }

    const intervalData = {
      ...formData,
      diaId: currentDia.diaId,
      cliId: Number(formData.cliId),
      ordem: Number(formData.ordem),
      fim: formData.fim === '' ? null : formData.fim
    };

    let success;
    if (editingIntervalo) {
      success = await updateIntervalo(editingIntervalo.intId, intervalData);
    } else {
      success = await addIntervalo(intervalData);
    }

    if (success) {
      toast.success(editingIntervalo ? 'Registro atualizado!' : 'Intervalo registrado!');
      setShowModal(false);
      setEditingIntervalo(null);
    } else {
      const storeError = useDataStore.getState().error;
      const errorMsg = typeof storeError === 'string' ? storeError : storeError?.message || 'Erro ao processar operação';
      toast.error(errorMsg);
    }
  };

  const handleRemove = async (id) => {
    showConfirm(
      'Excluir Intervalo',
      'Deseja excluir este intervalo? Todos os cálculos serão atualizados.',
      async () => {
        const success = await removeIntervalo(id);
        if (success) toast.success('Removido com sucesso');
      }
    );
  };

  const handleExport = async () => {
    if (!currentDia.intervalos || currentDia.intervalos.length === 0) {
      toast.error('Não há registros para exportar');
      return;
    }
    
    const data = currentDia.intervalos.map(int => ({
      Ordem: int.intOrdem,
      Cliente: clientes.find(c => c.cliId === int.intCliId)?.cliNome || 'N/A',
      Inicio: int.intInicio,
      Fim: int.intFim || '--:--',
      Horas: int.intHoras,
      Valor: int.intValorTotal
    }));
    
    const csv = convertToCSV(data);
    const filename = generateFilename(`dia_${currentDia.diaData}`) + '.csv';
    
    const result = await window.electron.files.save(filename, csv);
    if (result.success) {
      toast.success('Lançamentos exportados!');
    } else if (result.error) {
      toast.error('Erro ao salvar: ' + result.error);
    }
  };

  const formatDisplayDate = (dateStr) => {
    const safeDateStr = (dateStr || '').substring(0, 10);
    const date = new Date(safeDateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long' 
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header Contexto Local */}
      <header className="px-10 py-8 bg-white border-b border-[#eee5f0] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center bg-[#f4ebf6] text-[#631660] rounded-2xl hover:bg-[#e6d0e9] transition-all group"
            title="Voltar para a lista do Mês"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-[#1e1a22] tracking-tight capitalize">
              {formatDisplayDate(currentDia.diaData)}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-sm font-bold text-[#82737d] uppercase tracking-widest">
                <span className={`flex items-center gap-1 ${currentDia.diaTipo === 'FERIADO' ? 'text-[#ba1a1a]' : ''}`}>
                    <Zap size={14} /> {currentDia.diaTipo}
                </span>
                <span className="flex items-center gap-1 text-[#631660]">
                    <Clock size={14} /> {Number(currentDia.diaHorasTotal || 0).toFixed(2)}h Total
                </span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 border-2 border-[#631660] text-[#631660] rounded-xl font-bold hover:bg-[#f4ebf6] transition-all"
                title="Exportar CSV"
            >
                <Download size={20} /> Exportar Dia
            </button>
            <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-6 py-3 bg-[#631660] text-white rounded-xl font-bold shadow-lg hover:bg-[#460045] transition-all"
            >
                <Plus size={20} /> Adicionar Intervalo
            </button>
        </div>
      </header>

      {/* Main Timeline Content */}
      <div className="flex-1 overflow-auto px-10 py-10">
        <div className="max-w-4xl mx-auto">
            {/* Timeline Pulse Container */}
            <div className="relative pl-12 border-l-4 border-[#eee5f0] space-y-8">
                {!currentDia.intervalos || currentDia.intervalos.length === 0 ? (
                    <div className="py-20 text-center text-[#82737d]">
                        <Timer size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xl font-bold">Nenhuma batida registrada</p>
                        <p className="text-sm">Comece adicionando seu primeiro turno de trabalho.</p>
                    </div>
                ) : (
                    [...currentDia.intervalos].sort((a,b) => a.intOrdem - b.intOrdem).map((intervalo) => (
                        <div key={intervalo.intId} className="relative">
                            {/* Timeline Node */}
                            <div className="absolute -left-[58px] top-6 w-8 h-8 bg-white border-4 border-[#631660] rounded-full shadow-md z-10 flex items-center justify-center">
                                <span className="text-[10px] font-black text-[#631660]">{intervalo.intOrdem}</span>
                            </div>

                            {/* Interval Card */}
                            <div className="bg-white p-6 rounded-2xl border border-[#eee5f0] shadow-sm hover:shadow-md hover:border-[#631660] transition-all flex justify-between items-center group">
                                <div className="flex gap-8 items-center">
                                    <div className="flex flex-col items-center">
                                        <p className="text-2xl font-black text-[#1e1a22]">{intervalo.intInicio}</p>
                                        <p className="text-[10px] font-bold text-[#82737d] uppercase tracking-widest">Início</p>
                                    </div>
                                    <div className="h-10 w-px bg-[#eee5f0]" />
                                    <div className="flex flex-col items-center">
                                        <p className="text-2xl font-black text-[#1e1a22]">{intervalo.intFim || '--:--'}</p>
                                        <p className="text-[10px] font-bold text-[#82737d] uppercase tracking-widest">Fim</p>
                                    </div>
                                    <div className="ml-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User size={14} className="text-[#631660]" />
                                            <p className="font-black text-[#1e1a22]">{clientes.find(c => c.cliId === intervalo.intCliId)?.cliNome || 'Cliente Deletado'}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <span className="text-xs font-bold text-[#82737d] flex items-center gap-1">
                                                <Clock size={12} /> {Number(intervalo.intHoras || 0).toFixed(2)}h calculadas
                                            </span>
                                            <span className="text-xs font-bold text-[#631660] flex items-center gap-1">
                                                <Zap size={12} /> R$ {Number(intervalo.intValorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {intervalo.intAnotacoes && (
                                            <p className="text-xs italic text-[#82737d] mt-2 bg-[#f4ebf6]/50 p-2 rounded-lg border-l-2 border-[#631660] max-w-md">
                                                "{intervalo.intAnotacoes}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleOpenEdit(intervalo)}
                                        className="p-3 text-[#631660] hover:bg-[#f4ebf6] rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                        title="Editar Registro"
                                    >
                                        <Clock size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleRemove(intervalo.intId)}
                                        className="p-3 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                        title="Excluir Registro"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-16 bg-[#631660] rounded-2xl p-8 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                <div className="relative z-10">
                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] opacity-80">Resumo Diário</h3>
                    <p className="text-4xl font-black mt-2">
                      {Number(currentDia.diaHorasTotal || 0).toFixed(2)} horas 
                      <span className="text-xl font-medium opacity-60 ml-2">de produtividade</span>
                    </p>
                </div>
                <div className="text-right relative z-10">
                    <p className="text-4xl font-black">R$ {Number(currentDia.diaValorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm font-bold uppercase tracking-widest mt-2">Valor Ganho Hoje</p>
                </div>
            </div>
        </div>
      </div>

      {/* Modal Lançamento / Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-[#460045] bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8 border-b border-[#eee5f0] flex justify-between items-center bg-[#f4ebf6]">
                    <div className="flex items-center gap-3">
                        {editingIntervalo ? <Clock className="text-[#631660]" /> : <Plus className="text-[#631660]" />}
                        <h3 className="text-xl font-black text-[#631660]">
                          {editingIntervalo ? 'Editar Registro' : 'Novo Registro'}
                        </h3>
                    </div>
                    <button onClick={() => setShowModal(false)} className="text-[#50434d] hover:text-[#1e1a22] font-black">Esc</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-[#82737d] uppercase tracking-widest">Cliente</label>
                            <select 
                                value={formData.cliId}
                                onChange={(e) => setFormData({...formData, cliId: e.target.value})}
                                className="w-full px-4 py-3 bg-[#f4ebf6] rounded-xl font-bold text-[#1e1a22] outline-none border-2 border-transparent focus:border-[#631660] transition-all"
                            >
                                {clientes.map(c => <option key={c.cliId} value={c.cliId}>{c.cliNome}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#82737d] uppercase tracking-widest">Ordem</label>
                            <input 
                              type="number"
                              min="1"
                              max="7"
                              value={formData.ordem}
                              onChange={(e) => setFormData({...formData, ordem: e.target.value})}
                              className="w-full px-4 py-3 bg-[#f4ebf6] rounded-xl font-bold text-[#1e1a22] outline-none border-2 border-transparent focus:border-[#631660] transition-all text-center"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-center">
                            <label className="text-xs font-bold text-[#82737d] uppercase tracking-widest">Início</label>
                            <TimePicker 
                                value={formData.inicio} 
                                onChange={(val) => setFormData({...formData, inicio: val})}
                                className="w-full text-2xl"
                            />
                        </div>
                        <div className="space-y-2 text-center">
                            <label className="text-xs font-bold text-[#82737d] uppercase tracking-widest">Fim (Opcional)</label>
                            <TimePicker 
                                value={formData.fim} 
                                onChange={(val) => setFormData({...formData, fim: val})}
                                className="w-full text-2xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-[#82737d] uppercase tracking-widest">Anotações (Opcional)</label>
                            <span className={`text-[10px] font-bold ${formData.anotacoes?.length > 900 ? 'text-[#ba1a1a]' : 'text-[#82737d]'}`}>
                                {formData.anotacoes?.length || 0}/1000
                            </span>
                        </div>
                        <textarea 
                            value={formData.anotacoes}
                            onChange={(e) => setFormData({...formData, anotacoes: e.target.value.substring(0, 1000)})}
                            placeholder="Descreva detalhes do que foi feito neste intervalo..."
                            rows={3}
                            className="w-full px-4 py-3 bg-[#f4ebf6] rounded-xl font-bold text-[#1e1a22] outline-none border-2 border-transparent focus:border-[#631660] transition-all resize-none text-sm"
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-4 font-bold text-[#50434d] hover:bg-[#eee5f0] rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 bg-[#631660] text-white rounded-xl font-bold shadow-lg hover:bg-[#460045] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} 
                            {editingIntervalo ? 'Salvar Alterações' : 'Salvar Registro'}
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

export default Dia;
