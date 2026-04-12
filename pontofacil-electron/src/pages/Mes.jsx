import React, { useEffect, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { 
  Calendar, Info, Clock, 
  ArrowRight, Download, Settings,
  CalendarDays, Calculator, ListTodo
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUiStore } from '../store/uiStore';
import { convertToCSV, generateFilename } from '../utils/exportUtils';
import Footer from '../components/Footer';

const Mes = ({ anoMes: anoMesProp, onBack, onSelectDia }) => {
  const { selectedMes, fetchMesDetail, loading, meses } = useDataStore();
  const { showConfirm } = useUiStore();
  const [filter, setFilter] = useState('ALL'); // ALL, UTIL, FERIADO
  const [showHorasConfig, setShowHorasConfig] = useState(false);

  // Default to current month if no specific month is provided
  const [localAnoMes, setLocalAnoMes] = useState(anoMesProp || new Date().toISOString().substring(0, 7));

  // Horas/dia configurável por mês, persistido no localStorage
  const [horasDia, setHorasDia] = useState(() => {
    const saved = localStorage.getItem(`pontofacil_horasDia_${anoMesProp || new Date().toISOString().substring(0, 7)}`);
    return saved ? Number(saved) : 8;
  });

  useEffect(() => {
    const saved = localStorage.getItem(`pontofacil_horasDia_${localAnoMes}`);
    setHorasDia(saved ? Number(saved) : 8);
  }, [localAnoMes]);

  const saveHorasDia = (value) => {
    const num = Math.max(1, Math.min(24, Number(value) || 8));
    setHorasDia(num);
    localStorage.setItem(`pontofacil_horasDia_${localAnoMes}`, num.toString());
  };

  useEffect(() => {
    fetchMesDetail(localAnoMes);
  }, [localAnoMes, fetchMesDetail]);

  const handleMonthSelection = (newAnoMes) => {
    const today = new Date().toISOString().substring(0, 7);
    if (newAnoMes > today) {
        toast.error('Não é possível navegar para meses futuros');
        return;
    }

    const monthData = meses.find(m => m.mesAnoMes === newAnoMes);
    if (!monthData || Number(monthData.mesRealizado) === 0) {
      showConfirm(
        'Mês Sem Registros',
        `O mês ${newAnoMes} não possui lançamentos anteriores. Deseja navegar para este período mesmo assim?`,
        () => setLocalAnoMes(newAnoMes)
      );
    } else {
      setLocalAnoMes(newAnoMes);
    }
  };

  const changeMonth = (offset) => {
    const [year, month] = localAnoMes.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const newAnoMes = date.toISOString().substring(0, 7);
    handleMonthSelection(newAnoMes);
  };

  const handleExport = async () => {
    if (!selectedMes) return;
    
    const data = selectedMes.map(dia => ({
      Data: dia.diaData,
      Tipo: dia.diaTipo,
      Horas: dia.diaHorasTotal,
      Valor: dia.diaValorTotal,
      Intervalos: (dia.intervalos || []).length
    }));
    
    const csv = convertToCSV(data);
    const filename = generateFilename(`mes_${localAnoMes}`) + '.csv';
    
    const result = await window.electron.files.save(filename, csv);
    if (result.success) {
      toast.success('Mes exportado!');
    } else if (result.error) {
      toast.error('Erro ao salvar: ' + result.error);
    }
  };

  const stats = {
    totalLiquidado: selectedMes?.reduce((acc, dia) => acc + Number(dia.diaValorTotal || 0), 0) || 0,
    diasUteis: selectedMes?.filter(dia => dia.diaTipo === 'UTIL').length || 0,
    totalHoras: selectedMes?.reduce((acc, dia) => acc + Number(dia.diaHorasTotal || 0), 0) || 0
  };
  const horasPrevistas = stats.diasUteis * horasDia;
  const taxaHora = stats.totalHoras > 0 ? stats.totalLiquidado / stats.totalHoras : 0;
  const valorPrevisto = horasPrevistas * taxaHora;

  // Ajuste de fuso horário seguro para o dia atual no Brasil
  const currentDateBRT = new Date();
  currentDateBRT.setHours(currentDateBRT.getHours() - 3);
  const todayStr = currentDateBRT.toISOString().substring(0, 10);

  const filteredDias = selectedMes?.filter(dia => {
    // Esconder dias futuros
    if (dia.diaData.substring(0, 10) > todayStr) return false;

    if (filter === 'UTIL') return dia.diaTipo === 'UTIL';
    if (filter === 'FERIADO') return dia.diaTipo === 'FERIADO';
    return true;
  }).sort((a, b) => b.diaData.localeCompare(a.diaData)); // Ordem decrescente

  const getDayColor = (type) => {
    switch (type) {
      case 'UTIL': return 'text-[#1e1a22]';
      case 'SABADO':
      case 'DOMINGO': return 'text-[#82737d]';
      case 'FERIADO': return 'text-[#ba1a1a]';
      default: return 'text-[#1e1a22]';
    }
  };

  const formatDisplayDate = (dateStr) => {
    const safeDateStr = (dateStr || '').substring(0, 10);
    const date = new Date(safeDateStr + 'T12:00:00');
    return {
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
      day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    };
  };

  if (loading && !selectedMes) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#fff7ff]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#631660] rounded-full animate-bounce" />
          <p className="font-bold text-[#631660] uppercase tracking-widest text-sm">Curating Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header Contexto Local */}
      <header className="px-10 py-8 bg-white border-b border-[#eee5f0] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => changeMonth(-1)}
                className="w-10 h-10 flex items-center justify-center bg-[#f4ebf6] text-[#631660] rounded-xl font-bold hover:bg-[#e6d0e9] transition-all"
                title="Mês Anterior"
              >
                &lt;
              </button>
              <h2 className="text-3xl font-black text-[#1e1a22] tracking-tight min-w-[200px] text-center">
                {localAnoMes ? new Date(localAnoMes + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Março 2026'}
              </h2>
              <button 
                onClick={() => changeMonth(1)}
                className="w-10 h-10 flex items-center justify-center bg-[#f4ebf6] text-[#631660] rounded-xl font-bold hover:bg-[#e6d0e9] transition-all"
                title="Próximo Mês"
              >
                &gt;
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm font-bold text-[#82737d] uppercase tracking-widest">
                <span className="flex items-center gap-1"><Calendar size={14} /> {selectedMes?.length || 0} Dias</span>
                <span className="flex items-center gap-1 text-[#631660]"><Info size={14} /> Mês Aberto</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-3 border-2 border-[#631660] text-[#631660] rounded-xl font-bold hover:bg-[#f4ebf6] transition-all"
            >
                <Download size={18} /> Exportar CSV
            </button>
        </div>
      </header>

      {/* Row de Stats Editorial */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-1 px-10 py-6 bg-[#f4ebf6] shrink-0">
         {/* 1 - Dias de Trabalho */}
         <div className="flex flex-col items-center justify-center p-4 border-r border-[#d4c1cd]">
            <p className="text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em] mb-1">Dias de Trabalho</p>
            <p className="text-2xl font-black text-[#1e1a22]">{stats.diasUteis} <span className="text-sm text-[#82737d]">Úteis</span></p>
         </div>
         {/* 2 - Horas Previstas */}
         <div className="flex flex-col items-center justify-center p-4 border-r border-[#d4c1cd] relative">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em]">Horas Previstas</p>
              <button
                onClick={() => setShowHorasConfig(!showHorasConfig)}
                className="text-[#631660] hover:text-[#460045] transition-colors"
                title="Configurar horas/dia"
              >
                <Settings size={12} />
              </button>
            </div>
            <p className="text-2xl font-black text-[#1e1a22]">{horasPrevistas.toFixed(1)}h</p>
            {showHorasConfig && (
              <div className="absolute top-full mt-2 bg-white rounded-xl shadow-xl border border-[#eee5f0] p-4 z-20 min-w-[200px]">
                <label className="text-[10px] font-black text-[#631660] uppercase tracking-[0.2em] block mb-2">Horas por dia</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={horasDia}
                    onChange={(e) => saveHorasDia(e.target.value)}
                    className="w-20 px-3 py-2 bg-[#f4ebf6] rounded-lg font-bold text-[#1e1a22] text-center outline-none border-2 border-transparent focus:border-[#631660] transition-all"
                  />
                  <span className="text-sm font-bold text-[#82737d]">h/dia</span>
                </div>
                <button
                  onClick={() => setShowHorasConfig(false)}
                  className="mt-3 w-full py-2 bg-[#631660] text-white rounded-lg font-bold text-xs hover:bg-[#460045] transition-all"
                >
                  OK
                </button>
              </div>
            )}
         </div>
         {/* 3 - Valor Previsto */}
         <div className="flex flex-col items-center justify-center p-4 border-r border-[#d4c1cd]">
            <p className="text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em] mb-1">Valor Previsto</p>
            <p className="text-2xl font-black text-[#1e1a22]">R$ {valorPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
         {/* 4 - Horas Realizadas */}
         <div className="flex flex-col items-center justify-center p-4 border-r border-[#d4c1cd]">
            <p className="text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em] mb-1">Horas Realizadas</p>
            <p className="text-2xl font-black text-[#1e1a22]">{stats.totalHoras.toFixed(1)}h</p>
         </div>
         {/* 5 - Total Realizado */}
         <div className="flex flex-col items-center justify-center p-4">
            <p className="text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em] mb-1">Total Realizado</p>
            <p className="text-2xl font-black text-[#1e1a22]">R$ {stats.totalLiquidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
      </div>

      {/* Listagem Estilo Tabela Editorial */}
      <div className="flex-1 overflow-auto px-10 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center border-b-2 border-[#631660] pb-4">
                <h3 className="text-xl font-black text-[#1e1a22] flex items-center gap-2 uppercase tracking-tight">
                    <ListTodo className="text-[#631660]" /> Registros Diários
                </h3>
                <div className="flex bg-white p-1 rounded-xl border border-[#eee5f0] shadow-sm">
                    {['ALL', 'UTIL', 'FERIADO'].map(opt => (
                        <button 
                            key={opt}
                            onClick={() => setFilter(opt)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                filter === opt ? 'bg-[#631660] text-white' : 'text-[#82737d] hover:bg-[#f4ebf6]'
                            }`}
                        >
                            {opt === 'ALL' ? 'Todos' : opt === 'UTIL' ? 'Úteis' : 'Feriados'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {filteredDias?.map((dia) => {
                    const { weekday, day } = formatDisplayDate(dia.diaData);
                    
                    // Ajuste de fuso horário seguro para o dia atual no Brasil
                    const todayDate = new Date();
                    todayDate.setHours(todayDate.getHours() - 3); // BRT simplificado
                    const isToday = dia.diaData.substring(0, 10) === todayDate.toISOString().substring(0, 10);

                    return (
                        <div 
                            key={dia.diaId}
                            onClick={() => onSelectDia(dia)}
                            className={`p-5 rounded-2xl border flex items-center justify-between hover:shadow-md hover:border-[#631660] transition-all cursor-pointer group relative overflow-hidden ${
                                isToday ? 'bg-[#f4ebf6] border-[#631660] shadow-sm' : 'bg-white border-[#eee5f0]'
                            }`}
                        >
                            {isToday && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#631660]" />}
                            
                            <div className="flex items-center gap-6">
                                <div className="text-center w-14 border-r border-[#eee5f0] pr-6">
                                    <p className="text-[10px] font-black text-[#82737d] uppercase tracking-tighter opacity-70">
                                        {weekday.substring(0, 3)}
                                    </p>
                                    <p className={`text-lg font-black ${getDayColor(dia.diaTipo)}`}>
                                        {day.split('/')[0]}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-black text-lg ${getDayColor(dia.diaTipo)} capitalize`}>
                                            {weekday}
                                        </h4>
                                        {isToday && (
                                            <span className="bg-[#631660] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                Hoje
                                            </span>
                                        )}
                                        {dia.diaTipo === 'FERIADO' && (
                                            <span className="bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                Feriado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-[#82737d] mt-0.5 max-w-sm truncate whitespace-nowrap overflow-hidden">
                                        {dia.diaObservacao || 'Sem apontamentos extra'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-[#82737d] uppercase tracking-widest">Horas</p>
                                    <p className="font-black text-[#1e1a22] text-xl">
                                        {Number(dia.diaHorasTotal) > 0 ? `${Math.floor(dia.diaHorasTotal)}h${Math.round((dia.diaHorasTotal % 1) * 60).toString().padStart(2, '0')}` : '--'}
                                    </p>
                                </div>
                                <div className="text-right w-24">
                                    <p className="text-[10px] font-bold text-[#82737d] uppercase tracking-widest">Valor</p>
                                    <p className={`font-black text-xl ${Number(dia.diaValorTotal) > 0 ? 'text-[#631660]' : 'text-[#82737d]'}`}>
                                        {Number(dia.diaValorTotal) > 0 ? `R$ ${Number(dia.diaValorTotal).toFixed(0)}` : 'R$ 0'}
                                    </p>
                                </div>
                                <div className="p-2 rounded-lg group-hover:bg-[#631660] group-hover:text-white transition-all text-[#d4c1cd]">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Mes;
