import React, { useEffect, useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import { 
  Users, Plus, Search, Edit2, Trash2,
  X, Check, AlertCircle, Loader2,
  UserPlus, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { convertToCSV, generateFilename } from '../utils/exportUtils';
import Footer from '../components/Footer';

const Clientes = ({ onBack }) => {
  const { 
    clientes, fetchClientes, addCliente, 
    updateCliente, deleteCliente, loading, error 
  } = useDataStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({ cliNome: '', cliAtivo: true });
  const [isDeleting, setIsDeleting] = useState(null); // ID of client being deleted

  const handleExport = async () => {
    const data = filteredClientes.map(c => ({
      ID: c.cliId,
      Nome: c.cliNome,
      Status: c.cliAtivo ? 'Ativo' : 'Inativo'
    }));
    
    const csv = convertToCSV(data);
    const filename = generateFilename('clientes') + '.csv';
    
    const result = await window.electron.files.save(filename, csv);
    if (result.success) {
      toast.success('Relatório exportado!');
    } else if (result.error) {
      toast.error('Erro ao salvar: ' + result.error);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => 
      c.cliNome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientes, searchTerm]);

  const handleOpenModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({ cliNome: cliente.cliNome, cliAtivo: cliente.cliAtivo });
    } else {
      setEditingCliente(null);
      setFormData({ cliNome: '', cliAtivo: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliNome.trim()) {
      toast.error('O nome do cliente é obrigatório');
      return;
    }

    let success;
    if (editingCliente) {
      success = await updateCliente(editingCliente.cliId, formData);
      if (success) toast.success('Cliente atualizado com sucesso!');
    } else {
      success = await addCliente(formData);
      if (success) toast.success('Cliente cadastrado com sucesso!');
    }

    if (success) setIsModalOpen(false);
  };

  const handleToggleStatus = async (cliente) => {
    const success = await updateCliente(cliente.cliId, { 
      cliNome: cliente.cliNome, 
      cliAtivo: !cliente.cliAtivo 
    });
    if (success) {
      toast.success(`Cliente ${!cliente.cliAtivo ? 'ativado' : 'desativado'}!`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita se houverem vínculos.')) {
      setIsDeleting(id);
      const success = await deleteCliente(id);
      setIsDeleting(null);
      if (success) toast.success('Cliente removido!');
    }
  };

  const StatItem = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-black text-[#82737d] uppercase tracking-[0.2em]">{label}</p>
      <div className="flex items-center gap-2">
        <div className="text-[#631660] opacity-50"><Icon size={14} /></div>
        <p className="text-xl font-black text-[#1e1a22]">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fff7ff]">
      {/* Header Editorial */}
      <header className="px-10 py-10 bg-white border-b border-[#eee5f0] shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div className="space-y-4">
            <div className="space-y-2 pt-8">
              <div className="flex items-center gap-2 text-[#631660] font-black uppercase tracking-[0.3em] text-[10px]">
                <Users size={14} /> Gestão Corporativa
              </div>
              <h2 className="text-5xl font-black text-[#1e1a22] tracking-tighter">Carteira de Clientes</h2>
              <p className="text-[#50434d] font-medium max-w-xl">
                Controle seus contratos e status operacionais com precisão editorial.
              </p>
            </div>
          </div>
          <div className="flex gap-4 mb-2">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 border-2 border-[#631660] text-[#631660] rounded-xl font-bold hover:bg-[#f4ebf6] transition-all"
                title="Exportar CSV"
            >
                <Download size={20} /> Exportar
            </button>
            <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-6 py-3 bg-[#631660] text-white rounded-xl font-bold shadow-lg hover:bg-[#460045] transition-all"
            >
                <Plus size={20} /> Novo Cliente
            </button>
          </div>
        </div>
      </header>

      {/* Stats and Filter */}
      <div className="bg-[#f4ebf6] px-10 py-6 border-b border-[#eee5f0] shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex gap-12">
            <StatItem label="Empresas Ativas" value={clientes.filter(c => c.cliAtivo).length.toString()} icon={Users} />
            <StatItem label="Inativos" value={clientes.filter(c => !c.cliAtivo).length.toString()} icon={AlertCircle} />
          </div>
          
          <div className="bg-white p-1 rounded-xl border border-[#d4c1cd] shadow-sm flex items-center w-80">
            <Search size={18} className="ml-3 text-[#82737d]" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 bg-transparent outline-none font-bold text-sm text-[#1e1a22] flex-1 placeholder:text-[#d4c1cd]"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-7xl mx-auto">
          {loading && !clientes.length ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#631660]" size={48} />
              <p className="font-black text-[#50434d] uppercase tracking-widest text-xs">Carregando Carteira...</p>
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-[#eee5f0]">
               <div className="w-20 h-20 bg-[#f4ebf6] rounded-full flex items-center justify-center mb-6">
                  <Users size={40} className="text-[#631660] opacity-30" />
               </div>
               <h3 className="text-2xl font-black text-[#1e1a22]">Nenhum cliente encontrado</h3>
               <p className="text-[#82737d] font-bold mt-2">Que tal expandir seu portfólio agora?</p>
               <button 
                 onClick={() => handleOpenModal()}
                 className="mt-8 flex items-center gap-2 px-6 py-3 bg-[#631660] text-white rounded-xl font-bold transition-all hover:px-8"
               >
                 <UserPlus size={18} /> Cadastrar Primeiro Cliente
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
              {filteredClientes.map((cliente) => (
                <div 
                  key={cliente.cliId}
                  className={`bg-white rounded-[2rem] border-2 p-8 shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between ${
                    cliente.cliAtivo ? 'border-[#eee5f0] hover:border-[#631660]' : 'border-dashed border-[#d4c1cd] opacity-75'
                  }`}
                >
                  {/* Status Indicator */}
                  <div className={`absolute top-0 right-0 w-32 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transform rotate-45 translate-x-10 translate-y-2 ${
                    cliente.cliAtivo ? 'bg-[#631660] text-white' : 'bg-[#82737d] text-white'
                  }`}>
                    {cliente.cliAtivo ? 'Ativo' : 'Inativo'}
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border transition-colors ${
                        cliente.cliAtivo ? 'bg-[#fff7ff] border-[#eee5f0] group-hover:border-[#ffabf2]' : 'bg-[#f4efe4] border-[#d4c1cd]'
                      }`}>
                        <Users size={28} className={cliente.cliAtivo ? 'text-[#631660]' : 'text-[#82737d]'} />
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-[#1e1a22] mb-4 truncate pr-10">
                        {cliente.cliNome}
                    </h3>

                    <div className="px-4 py-2 bg-[#f4ebf6] rounded-lg inline-block text-[10px] font-black text-[#631660] uppercase tracking-widest">
                       Contrato Profissional
                    </div>
                  </div>

                  <div className="mt-10 flex gap-3">
                    <button 
                      onClick={() => handleOpenModal(cliente)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#f4ebf6] text-[#631660] rounded-xl font-bold text-sm hover:bg-[#631660] hover:text-white transition-all shadow-sm"
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(cliente)}
                      title={cliente.cliAtivo ? "Desativar Cliente" : "Ativar Cliente"}
                      className={`px-4 py-3 rounded-xl transition-all border-2 ${
                        cliente.cliAtivo 
                        ? 'border-[#eee5f0] text-[#82737d] hover:bg-[#ffdad6] hover:text-[#ba1a1a] hover:border-transparent' 
                        : 'border-[#631660] text-[#631660] hover:bg-[#631660] hover:text-white'
                      }`}
                    >
                      {cliente.cliAtivo ? <AlertCircle size={18} /> : <Check size={18} />}
                    </button>
                    <button 
                      disabled={isDeleting === cliente.cliId}
                      onClick={() => handleDelete(cliente.cliId)}
                      className="px-4 py-3 border-2 border-transparent text-[#82737d] hover:text-[#ba1a1a] transition-colors"
                    >
                      {isDeleting === cliente.cliId ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Suggestion Card */}
              <button 
                onClick={() => handleOpenModal()}
                className="rounded-[2rem] border-4 border-dashed border-[#eee5f0] p-8 flex flex-col items-center justify-center group hover:border-[#631660] transition-all min-h-[260px] opacity-60 hover:opacity-100"
              >
                 <div className="w-16 h-16 bg-[#f4ebf6] rounded-full flex items-center justify-center mb-4 group-hover:bg-[#631660] transition-all">
                    <Plus size={32} className="text-[#631660] group-hover:text-white" />
                 </div>
                 <p className="font-black text-[#50434d] text-lg group-hover:text-[#631660]">Novo Contrato</p>
              </button>
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
                  {editingCliente ? 'Ajustar Contrato' : 'Novo Alinhamento'}
                </h3>
                <p className="text-xs font-bold text-[#631660] uppercase tracking-widest mt-1">
                  {editingCliente ? 'Edição Estratégica' : 'Expansão de Carteira'}
                </p>
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
                <label className="text-[10px] font-black text-[#631660] uppercase tracking-[0.2em] ml-1">Nome da Empresa / Cliente</label>
                <div className="relative">
                  <input 
                    type="text"
                    autoFocus
                    required
                    value={formData.cliNome}
                    onChange={(e) => setFormData({...formData, cliNome: e.target.value})}
                    placeholder="Ex: Editorial Global Ltda"
                    className="w-full px-5 py-4 bg-[#f4ebf6] border-2 border-transparent focus:border-[#631660] focus:bg-white rounded-2xl outline-none font-bold text-[#1e1a22] transition-all placeholder:text-[#d4c1cd]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#fff7ff] rounded-2xl border border-[#eee5f0]">
                <input 
                  type="checkbox"
                  id="cliAtivo"
                  checked={formData.cliAtivo}
                  onChange={(e) => setFormData({...formData, cliAtivo: e.target.checked})}
                  className="w-5 h-5 accent-[#631660]"
                />
                <label htmlFor="cliAtivo" className="text-sm font-bold text-[#50434d] cursor-pointer select-none">
                  Contrato Ativo (Visível para novos lançamentos)
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-bold text-[#82737d] rounded-2xl hover:bg-[#f4ebf6] transition-colors"
                >
                  Descartar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 bg-[#631660] text-white font-black rounded-2xl shadow-lg hover:bg-[#460045] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                  {editingCliente ? 'Salvar Alterações' : 'Confirmar Cadastro'}
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

export default Clientes;
