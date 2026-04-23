import React, { useEffect, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { 
  Users, Clock, Wallet, CheckCircle,
  BarChart, PieChart, Download
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useUiStore } from '../store/uiStore';
import { convertToCSV, generateFilename } from '../utils/exportUtils';
import Footer from '../components/Footer';

const Dashboard = ({ onSelectMes, onShowClientes }) => {
  const { user, logout } = useAuthStore();
  const { 
    meses, clientes, selectedMes, 
    fetchMeses, fetchClientes, fetchMesDetail, 
    loading 
  } = useDataStore();
  const { showConfirm } = useUiStore();

  useEffect(() => {
    const init = async () => {
      await fetchClientes();
      const currentMeses = await fetchMeses();
      
      // Fetch details for the first (most recent) month to get client distribution
      if (currentMeses && currentMeses.length > 0) {
        fetchMesDetail(currentMeses[0].mesAnoMes);
      } else {
        // Fallback to current calendar month if no data exists
        fetchMesDetail(new Date().toISOString().substring(0, 7));
      }
    };
    init();
  }, [fetchMeses, fetchClientes, fetchMesDetail]);

  // Current month stats from the summary list
  const currentMonth = meses[0] || {
    mesAnoMes: new Date().toISOString().substring(0, 7),
    mesRealizado: 0,
    mesHorasMeta: 160,
    mesValorHora: 0,
    mesEstimativa: 0,
    mesValorTotal: 0,
    mesDiasTrabalhados: 0,
    mesDiasUteis: 22
  };

  // Aggregate Top Clients from intervals of the selected month
  const topClients = useMemo(() => {
    if (!selectedMes || !clientes.length) return [];
    
    const clientHours = {};
    selectedMes.forEach(dia => {
      dia.intervalos?.forEach(int => {
        clientHours[int.intCliId] = (clientHours[int.intCliId] || 0) + Number(int.intHoras);
      });
    });

    return Object.entries(clientHours)
      .map(([id, hours]) => ({
        id: Number(id),
        hours,
        name: clientes.find(c => c.cliId === Number(id))?.cliNome || 'Outros'
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 3);
  }, [selectedMes, clientes]);

  // Data for the Annual History Bar Chart (Last 6 months)
  const annualHistory = useMemo(() => {
    if (!meses || !Array.isArray(meses)) return [];
    return meses.slice(0, 6).reverse().map(m => {
      const dateStr = m.mesAnoMes ? `${m.mesAnoMes}-01` : null;
      return {
        label: dateStr ? new Date(dateStr).toLocaleDateString('pt-BR', { month: 'short' }) : '?',
        value: Number(m.mesRealizado || 0),
        meta: Number(m.mesHorasMeta || 160)
      };
    });
  }, [meses]);

  const handleExportAnnual = async () => {
    if (!meses || meses.length === 0) {
      toast.error('Não há histórico para exportar');
      return;
    }
    
    const data = meses.map(m => ({
      Mes: m.mesAnoMes,
      Realizado: m.mesRealizado,
      Meta: m.mesHorasMeta,
      DiasTrabalhados: m.mesDiasTrabalhados,
      ValorEstimado: m.mesEstimativa
    }));
    
    const csv = convertToCSV(data);
    const filename = generateFilename('historico_anual') + '.csv';
    
    const result = await window.electron.files.save(filename, csv);
    if (result.success) {
      toast.success('Histórico exportado!');
    } else if (result.error) {
      toast.error('Erro ao salvar: ' + result.error);
    }
  };

  const handleMonthSelection = (anoMes) => {
    const today = new Date().toISOString().substring(0, 7);
    if (anoMes > today) {
      toast.error('Não é possível navegar para meses futuros');
      return;
    }

    const monthData = meses.find(m => m.mesAnoMes === anoMes);
    if (!monthData || Number(monthData.mesRealizado) === 0) {
      showConfirm(
        'Mês Sem Registros',
        `O mês ${anoMes} não possui lançamentos anteriores. Deseja navegar para este período mesmo assim?`,
        () => onSelectMes(anoMes)
      );
    } else {
      onSelectMes(anoMes);
    }
  };

  const handleMonthClick = () => {
    handleMonthSelection(currentMonth.mesAnoMes);
  };

  const StatCard = ({ title, value, subValue, icon: Icon, color, loading }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#eee5f0] flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={24} className="text-[#631660]" />
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-[#50434d] uppercase tracking-wider">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-[#f4ebf6] animate-pulse rounded-md mt-1" />
        ) : (
          <h3 className="text-3xl font-black text-[#1e1a22] mt-1">{value}</h3>
        )}
        {subValue && <p className="text-xs font-semibold text-[#82737d] mt-1">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fff7ff]">
      <div className="flex-1 overflow-auto p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-4xl font-black text-[#1e1a22] tracking-tight capitalize">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-[#50434d] font-medium mt-1">Bem-vindo de volta, {user?.name || 'Curador'}</p>
          </div>
          <div className="flex gap-4 items-center">
              <button 
                  onClick={handleExportAnnual}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-[#631660] text-[#631660] rounded-xl font-bold hover:bg-[#f4ebf6] transition-all"
                  title="Exportar Histórico Anual"
              >
                  <Download size={20} /> Exportar
              </button>
              
              <div className="relative flex items-center bg-[#631660] rounded-xl overflow-hidden shadow-lg hover:bg-[#460045] transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                 <input 
                   type="month"
                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                   max={new Date().toISOString().substring(0, 7)}
                   onChange={(e) => {
                     if (e.target.value) handleMonthSelection(e.target.value);
                   }}
                   title="Ir para qualquer mês"
                 />
                 <button className="px-6 py-3 text-white font-bold whitespace-nowrap pointer-events-none">
                   Ir para o Mês...
                 </button>
              </div>
              
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="cursor-pointer" onClick={handleMonthClick}>
            <StatCard 
              title="Horas Realizadas" 
              value={`${Math.floor(currentMonth.mesRealizado || 0)}h${Math.round(((currentMonth.mesRealizado || 0) % 1) * 60).toString().padStart(2, '0')}`}
              subValue={`Meta: ${currentMonth.mesHorasMeta || 0}h`}
              icon={Clock}
              color="bg-primary"
              loading={loading && !meses.length}
            />
          </div>
          <StatCard 
            title="Valor Realizado" 
            value={`R$ ${Number(currentMonth.mesValorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subValue={`Estimativa Meta: R$ ${Number((currentMonth.mesEstimativa || 0) * (currentMonth.mesValorHora || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={Wallet}
            color="bg-secondary"
            loading={loading && !meses.length}
          />
          <StatCard 
            title="Dias Trabalhados" 
            value={`${currentMonth.mesDiasTrabalhados || 0}/${currentMonth.mesDiasUteis || 0}`}
            subValue="No mês atual"
            icon={CheckCircle}
            color="bg-tertiary"
            loading={loading && !meses.length}
          />
          <div className="cursor-pointer" onClick={onShowClientes}>
            <StatCard 
              title="Clientes Ativos" 
              value={clientes.length.toString()}
              subValue="Com contratos ativos"
              icon={Users}
              color="bg-primary"
              loading={loading && !clientes.length}
            />
          </div>
        </div>

        {/* Charts & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-[#1e1a22] flex items-center gap-3">
                <BarChart className="text-[#631660]" /> Histórico Editorial
              </h3>
              <button onClick={handleMonthClick} className="text-[#631660] font-bold hover:underline text-sm uppercase tracking-widest">
                Ver Detalhes
              </button>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-[#eee5f0] shadow-sm h-80 flex items-end justify-between gap-4">
              {annualHistory.length === 0 ? (
                <div className="w-full text-center py-20 text-[#82737d] font-bold italic">
                  Aguardando primeiros registros para gerar histórico...
                </div>
              ) : (
                annualHistory.map((item, idx) => {
                  const height = Math.min(100, (item.value / (item.meta || 1)) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                      <div className="relative w-full flex flex-col items-center justify-end h-48 bg-[#f4ebf6] rounded-2xl overflow-hidden">
                        <div 
                          style={{ height: `${height}%` }}
                          className="w-full bg-[#631660] rounded-t-xl transition-all duration-1000 ease-out group-hover:bg-[#460045]"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1e1a22] text-white text-[10px] py-1 px-2 rounded font-bold transition-all">
                            {item.value.toFixed(2).replace('.', ',')}h
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-[#82737d] uppercase tracking-widest">{item.label}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
             <h3 className="text-2xl font-black text-[#1e1a22] flex items-center gap-3">
               <PieChart className="text-[#631660]" /> Top Clientes
             </h3>
             <div className="bg-white p-6 rounded-3xl border border-[#eee5f0] shadow-sm space-y-4">
               {topClients.length === 0 ? (
                 <div className="py-10 text-center text-[#82737d] text-sm font-medium">
                   Nenhum faturamento registrado <br/> no mês atual.
                 </div>
               ) : (
                 topClients.map((client, idx) => (
                   <div key={client.id} className="group cursor-pointer" onClick={onShowClientes}>
                      <div className="flex justify-between items-end mb-2">
                        <p className="font-black text-[#1e1a22] text-sm group-hover:text-[#631660] transition-colors">{client.name}</p>
                        <p className="font-bold text-[#631660] text-xs">{client.hours.toFixed(2).replace('.', ',')}h</p>
                      </div>
                      <div className="h-2 w-full bg-[#f4ebf6] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#631660] rounded-full transition-all duration-1000"
                          style={{ width: `${(client.hours / (currentMonth.mesRealizado || 1)) * 100}%` }}
                        />
                      </div>
                   </div>
                 ))
               )}
               <button 
                 onClick={onShowClientes}
                 className="w-full py-3 mt-4 border-2 border-[#f4ebf6] text-[#631660] font-black rounded-xl hover:bg-[#631660] hover:text-white transition-all uppercase tracking-widest text-[10px]"
               >
                 Ver Todos os Clientes
               </button>
             </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
