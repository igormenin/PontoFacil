import React, { useEffect, useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import { 
  BookOpen, Plus, Search, Calendar, 
  Trash2, Edit2, X, 
  Check, AlertCircle, Loader2,
  Globe, Map, MapPin, Star, Repeat
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Footer from '../components/Footer';

const Feriados = ({ onBack }) => {
  const { 
    feriados, fetchFeriados, saveFeriado, deleteFeriado,
    loading, error 
  } = useDataStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeriado, setEditingFeriado] = useState(null);
  const [formData, setFormData] = useState({ 
    ferData: '', 
    ferNome: '', 
    ferTipo: 'NACIONAL',
    ferFixo: false
  });
  const [isDeleting, setIsDeleting] = useState(null);

  useEffect(() => {
    fetchFeriados();
  }, [fetchFeriados]);

  const years = useMemo(() => {
    const yearsSet = new Set();
    yearsSet.add(new Date().getFullYear().toString());
    feriados.forEach(f => {
      const year = new Date(f.ferData).getFullYear().toString();
      yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [feriados]);

  const filteredFeriados = useMemo(() => {
    return feriados
      .filter(f => {
        const yearMatch = (new Date(f.ferData).getFullYear().toString() === selectedYear) || f.ferFixo;
        const searchMatch = f.ferNome.toLowerCase().includes(searchTerm.toLowerCase());
        return yearMatch && searchMatch;
      })
      .map(f => {
        if (!f.ferFixo) return f;
        const d = new Date(f.ferData);
        d.setFullYear(parseInt(selectedYear, 10));
        return { ...f, virtualData: d.toISOString() };
      })
      .sort((a, b) => new Date(a.virtualData || a.ferData) - new Date(b.virtualData || b.ferData));
  }, [feriados, selectedYear, searchTerm]);

  // Group by month for agenda view
  const groupedFeriados = useMemo(() => {
    const groups = {};
    filteredFeriados.forEach(f => {
      const month = new Date(f.virtualData || f.ferData).toLocaleDateString('pt-BR', { month: 'long' });
      if (!groups[month]) groups[month] = [];
      groups[month].push(f);
    });
    return groups;
  }, [filteredFeriados]);

  const handleOpenModal = (feriado = null) => {
    if (feriado) {
      setEditingFeriado(feriado);
      // Backend returns DATE as ISO, we need YYYY-MM-DD for input
      const date = new Date(feriado.ferData).toISOString().split('T')[0];
      setFormData({ 
        ferData: date, 
        ferNome: feriado.ferNome, 
        ferTipo: feriado.ferTipo || 'NACIONAL',
        ferFixo: feriado.ferFixo || false 
      });
    } else {
      setEditingFeriado(null);
      setFormData({ 
        ferData: '', 
        ferNome: '', 
        ferTipo: 'NACIONAL',
        ferFixo: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ferData || !formData.ferNome.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Logic for editing a feriado with a date change
    // If we're editing and the date changed, we should delete the old one
    if (editingFeriado) {
        const oldDate = new Date(editingFeriado.ferData).toISOString().split('T')[0];
        if (oldDate !== formData.ferData) {
            await deleteFeriado(editingFeriado.ferId);
        }
    }

    const success = await saveFeriado(formData);
    if (success) {
      toast.success(editingFeriado ? 'Feriado atualizado!' : 'Feriado cadastrado!');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente remover este feriado? Isso afetará os cálculos do mês correspondente.')) {
      setIsDeleting(id);
      const success = await deleteFeriado(id);
      setIsDeleting(null);
      if (success) toast.success('Feriado removido');
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'NACIONAL': return <Globe size={14} />;
      case 'ESTADUAL': return <Map size={14} />;
      case 'MUNICIPAL': return <MapPin size={14} />;
      case 'FACULTATIVO': return <Star size={14} />;
      default: return <Calendar size={14} />;
    }
  };

  const getTipoLabel = (tipo) => {
    return tipo?.charAt(0) + tipo?.slice(1).toLowerCase();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fff7ff]">
      {/* Header Editorial */}
      <header className="px-10 py-10 bg-white border-b border-[#eee5f0] shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div className="space-y-4">
            <div className="space-y-2 pt-8">
              <div className="flex items-center gap-2 text-[#631660] font-black uppercase tracking-[0.3em] text-[10px]">
                <BookOpen size={14} /> Calendário Institucional
              </div>
              <h2 className="text-5xl font-black text-[#1e1a22] tracking-tighter">Cronograma de Feriados</h2>
              <p className="text-[#50434d] font-medium max-w-xl">
                Gerencie pausas e feriados para garantir a precisão nas metas e faturamentos.
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-8 py-4 bg-[#631660] text-white rounded-2xl font-bold shadow-xl hover:bg-[#460045] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} /> Adicionar Novo Feriado
          </button>
        </div>
      </header>

      {/* Stats and Filter */}
      <div className="bg-[#f4ebf6] px-10 py-6 border-b border-[#eee5f0] shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex flex-col gap-1">
               <span className="text-[10px] font-black text-[#631660] uppercase tracking-widest ml-1">Filtrar por Ano</span>
               <div className="flex bg-white rounded-xl border border-[#d4c1cd] p-1">
                 {years.map(year => (
                   <button
                     key={year}
                     onClick={() => setSelectedYear(year)}
                     className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                       selectedYear === year 
                       ? 'bg-[#631660] text-white shadow-sm' 
                       : 'text-[#82737d] hover:bg-[#f4ebf6]'
                     }`}
                   >
                     {year}
                   </button>
                 ))}
               </div>
            </div>
          </div>
          
          <div className="bg-white p-1 rounded-xl border border-[#d4c1cd] shadow-sm flex items-center w-80">
            <Search size={18} className="ml-3 text-[#82737d]" />
            <input 
              type="text" 
              placeholder="Pesquisar feriado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 bg-transparent outline-none font-bold text-sm text-[#1e1a22] flex-1 placeholder:text-[#d4c1cd]"
            />
          </div>
        </div>
      </div>

      {/* Content Area - Agenda Style */}
      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-4xl mx-auto">
          {loading && feriados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#631660]" size={48} />
              <p className="font-black text-[#50434d] uppercase tracking-widest text-xs">Sincronizando Calendário...</p>
            </div>
          ) : Object.keys(groupedFeriados).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-[#eee5f0]">
               <div className="w-20 h-20 bg-[#f4ebf6] rounded-full flex items-center justify-center mb-6">
                  <Calendar size={40} className="text-[#631660] opacity-30" />
               </div>
               <h3 className="text-2xl font-black text-[#1e1a22]">Nenhum feriado em {selectedYear}</h3>
               <p className="text-[#82737d] font-bold mt-2 text-center max-w-xs">Organize seu cronograma anual agora mesmo.</p>
               <button 
                 onClick={() => handleOpenModal()}
                 className="mt-8 flex items-center gap-2 px-6 py-3 bg-[#631660] text-white rounded-xl font-bold transition-all hover:px-8"
               >
                 <Plus size={18} /> Cadastrar Feriado
               </button>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
               {Object.entries(groupedFeriados).map(([month, monthFeriados]) => (
                 <div key={month} className="space-y-4">
                    <h3 className="text-xs font-black text-[#631660] uppercase tracking-[0.4em] sticky top-0 py-2 bg-[#fff7ff] z-10">
                      {month}
                    </h3>
                    <div className="grid gap-4">
                      {monthFeriados.map((f) => (
                        <div 
                          key={f.ferId}
                          className="bg-white rounded-[2rem] border border-[#eee5f0] p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-6">
                             <div className="flex flex-col items-center justify-center w-16 h-16 bg-[#f4ebf6] rounded-2xl border border-[#eee5f0] shrink-0">
                                <span className="text-[10px] font-black text-[#631660] uppercase">
                                  {new Date(f.virtualData || f.ferData).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                                </span>
                                <span className="text-2xl font-black text-[#1e1a22]">
                                  {new Date(f.virtualData || f.ferData).getUTCDate()}
                                </span>
                             </div>
                             
                             <div className="space-y-1">
                                <h4 className="text-xl font-black text-[#1e1a22] tracking-tight">{f.ferNome}</h4>
                                <div className="flex items-center gap-3">
                                   <div className="flex items-center gap-1 text-[10px] font-black text-[#82737d] uppercase tracking-widest bg-[#f4ebf6]/50 px-2 py-0.5 rounded">
                                      {getTipoIcon(f.ferTipo)}
                                      {getTipoLabel(f.ferTipo)}
                                   </div>
                                   {f.ferFixo && (
                                     <div className="flex items-center gap-1 text-[10px] font-black text-[#631660] uppercase tracking-widest bg-[#f4ebf6] px-2 py-0.5 rounded border border-[#e6d5e9]">
                                       <Repeat size={12} /> Fixo
                                     </div>
                                   )}
                                </div>
                             </div>
                          </div>

                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenModal(f)}
                              className="p-3 bg-[#f4ebf6] text-[#631660] rounded-xl hover:bg-[#631660] hover:text-white transition-all shadow-sm"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              disabled={isDeleting === f.ferId}
                              onClick={() => handleDelete(f.ferId)}
                              className="p-3 border-2 border-transparent text-[#82737d] hover:text-[#ba1a1a] transition-colors"
                            >
                              {isDeleting === f.ferId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Editorial for CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1e1a22]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-[#eee5f0] flex justify-between items-center bg-[#fff7ff]">
              <div>
                <h3 className="text-2xl font-black text-[#1e1a22] tracking-tighter">
                  {editingFeriado ? 'Editar Feriado' : 'Novo Alinhamento'}
                </h3>
                <p className="text-xs font-bold text-[#631660] uppercase tracking-widest mt-1">Configuração de Calendário</p>
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
                <label className="text-[10px] font-black text-[#631660] uppercase tracking-[0.2em] ml-1">Nome do Feriado</label>
                <input 
                  type="text"
                  autoFocus
                  required
                  value={formData.ferNome}
                  onChange={(e) => setFormData({...formData, ferNome: e.target.value})}
                  placeholder="Ex: Independência do Brasil"
                  className="w-full px-5 py-4 bg-[#f4ebf6] border-2 border-transparent focus:border-[#631660] focus:bg-white rounded-2xl outline-none font-bold text-[#1e1a22] transition-all placeholder:text-[#d4c1cd]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#631660] uppercase tracking-[0.2em] ml-1">Data</label>
                  <input 
                    type="date"
                    required
                    value={formData.ferData}
                    onChange={(e) => setFormData({...formData, ferData: e.target.value})}
                    className="w-full px-5 py-4 bg-[#f4ebf6] border-2 border-transparent focus:border-[#631660] focus:bg-white rounded-2xl outline-none font-bold text-[#1e1a22] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#631660] uppercase tracking-[0.2em] ml-1">Tipo</label>
                  <select 
                    value={formData.ferTipo}
                    onChange={(e) => setFormData({...formData, ferTipo: e.target.value})}
                    className="w-full px-5 py-4 bg-[#f4ebf6] border-2 border-transparent focus:border-[#631660] focus:bg-white rounded-2xl outline-none font-bold text-[#1e1a22] transition-all appearance-none"
                  >
                    <option value="NACIONAL">Nacional</option>
                    <option value="ESTADUAL">Estadual</option>
                    <option value="MUNICIPAL">Municipal</option>
                    <option value="FACULTATIVO">Facultativo</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#f4ebf6]/50 p-4 rounded-2xl border border-[#eee5f0]">
                <input
                  type="checkbox"
                  id="ferFixo"
                  checked={formData.ferFixo}
                  onChange={(e) => setFormData({...formData, ferFixo: e.target.checked})}
                  className="w-5 h-5 rounded text-[#631660] focus:ring-[#631660] accent-[#631660]"
                />
                <label htmlFor="ferFixo" className="flex flex-col cursor-pointer">
                  <span className="font-bold text-[#1e1a22] text-sm">Feriado Fixo (Repete anualmente)</span>
                  <span className="text-xs text-[#82737d] font-medium">Marcando isso, o sistema replicará este feriado nesta mesma data (dia/mês) em todos os anos passados e futuros.</span>
                </label>
              </div>

              <div className="bg-[#fff7ff] p-4 rounded-2xl border border-[#eee5f0] flex gap-3">
                 <AlertCircle size={20} className="text-[#631660] shrink-0 mt-0.5" />
                 <p className="text-[10px] font-bold text-[#50434d] leading-relaxed italic">
                   Este cadastro impactará automaticamente o cálculo de dias úteis e metas para o mês correspondente.
                 </p>
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
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                  {editingFeriado ? 'Salvar Ajustes' : 'Confirmar Cadastro'}
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

export default Feriados;
