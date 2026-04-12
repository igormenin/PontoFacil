import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';
import { 
  Users, UserPlus, Search, Edit2, 
  Trash2, RotateCcw, CheckCircle, XCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Footer from '../components/Footer';

const Usuarios = () => {
  const { usuarios, fetchUsuarios, saveUsuario, deleteUsuario, resetUsuarioPassword, loading, error } = useDataStore();
  const { showConfirm } = useUiStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    usuNome: '',
    usuLogin: '',
    usuSenha: '',
    usuEmail: '',
    usuAvatar: '',
    usuCargo: '',
    usuStatus: true
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        usuNome: user.usuNome || '',
        usuLogin: user.usuLogin || '',
        usuSenha: '', // Never populate password field
        usuEmail: user.usuEmail || '',
        usuAvatar: user.usuAvatar || '',
        usuCargo: user.usuCargo || '',
        usuStatus: user.usuStatus ?? true
      });
    } else {
      setEditingUser(null);
      setFormData({
        usuNome: '',
        usuLogin: '',
        usuSenha: '',
        usuEmail: '',
        usuAvatar: '',
        usuCargo: '',
        usuStatus: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const success = await saveUsuario(editingUser?.usuId, formData);
    if (success) {
      toast.success(editingUser ? 'Usuário atualizado!' : 'Usuário cadastrado!');
      setIsModalOpen(false);
    }
  };

  const handleDelete = (user) => {
    showConfirm(
      'Excluir Usuário',
      `Tem certeza que deseja remover ${user.usuNome || user.usuLogin}? Esta ação não pode ser desfeita.`,
      () => {
        deleteUsuario(user.usuId).then(success => {
          if (success) toast.success('Usuário removido!');
        });
      }
    );
  };

  const handleResetPassword = (user) => {
    showConfirm(
      'Resetar Senha',
      `Deseja resetar a senha de ${user.usuNome} para o padrão 'Ponto@123'?`,
      () => {
        resetUsuarioPassword(user.usuId).then(success => {
          if (success) toast.success('Senha resetada para Ponto@123');
        });
      }
    );
  };

  const filteredUsers = (usuarios || []).filter(u => 
    (u.usuNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.usuLogin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.usuEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fff7ff]">
      <main className="flex-1 p-10 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-black text-[#1e1a22] tracking-tight flex items-center gap-3">
                <Users className="text-[#631660]" size={40} />
                Usuários
              </h1>
              <p className="text-[#82737d] mt-2 font-medium">Gerencie o acesso e perfil dos colaboradores</p>
            </div>
            
            <button 
              onClick={() => handleOpenModal()}
              className="bg-[#631660] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#4a1047] transition-all shadow-lg hover:scale-105"
            >
              <UserPlus size={20} />
              Novo Usuário
            </button>
          </div>

          {/* Search */}
          <div className="mb-8 relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#82737d]" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nome, login ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-[#eee5f0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#631660] shadow-sm font-medium"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-[3rem] shadow-xl border border-[#eee5f0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#fcf8fc] border-b border-[#eee5f0]">
                    <th className="px-8 py-6 text-sm font-black text-[#82737d] uppercase tracking-widest">Usuário</th>
                    <th className="px-6 py-6 text-sm font-black text-[#82737d] uppercase tracking-widest">E-mail</th>
                    <th className="px-6 py-6 text-sm font-black text-[#82737d] uppercase tracking-widest">Cargo</th>
                    <th className="px-6 py-6 text-sm font-black text-[#82737d] uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-6 text-sm font-black text-[#82737d] uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee5f0]">
                  {error ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <XCircle className="text-red-500" size={48} />
                          <p className="text-red-600 font-bold">{error}</p>
                          <button 
                            onClick={() => fetchUsuarios()}
                            className="bg-[#631660] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#4a1047] transition-all"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30 select-none grayscale">
                          <Users size={80} className="text-[#631660]" />
                          <p className="font-black text-[#631660] uppercase tracking-widest text-xs">Nenhum Usuário Encontrado</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.usuId} className="hover:bg-[#fcf8fc] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#f4eff4] border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                            {user.usuAvatar ? (
                              <img src={user.usuAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={20} className="text-[#631660]" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-[#1e1a22]">{user.usuNome || user.usuLogin}</p>
                            <p className="text-xs font-bold text-[#82737d] tracking-wider">@{user.usuLogin}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-bold text-[#631660]">{user.usuEmail}</td>
                      <td className="px-6 py-6 font-medium text-[#1e1a22]">{user.usuCargo || '-'}</td>
                      <td className="px-6 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${user.usuStatus ? 'bg-[#e7f5e9] text-[#2e7d32]' : 'bg-[#ffebee] text-[#c62828]'}`}>
                          {user.usuStatus ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {user.usuStatus ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleResetPassword(user)}
                            title="Resetar Senha"
                            className="p-3 bg-[#f4eff4] text-[#631660] rounded-xl hover:bg-[#631660] hover:text-white transition-all shadow-sm"
                          >
                            <RotateCcw size={18} />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(user)}
                            className="p-3 bg-[#f4eff4] text-[#631660] rounded-xl hover:bg-[#631660] hover:text-white transition-all shadow-sm"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user)}
                            className="p-3 bg-[#ffebee] text-[#c62828] rounded-xl hover:bg-[#c62828] hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#1e1a22]/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10">
                <h2 className="text-3xl font-black text-[#1e1a22] mb-8 flex items-center gap-3">
                  {editingUser ? <Edit2 className="text-[#631660]" /> : <UserPlus className="text-[#631660]" />}
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>

                <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={formData.usuNome}
                      onChange={(e) => setFormData({...formData, usuNome: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Login</label>
                    <input 
                      required
                      type="text" 
                      value={formData.usuLogin}
                      onChange={(e) => setFormData({...formData, usuLogin: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Senha Inicial</label>
                      <input 
                        required
                        type="password" 
                        value={formData.usuSenha}
                        onChange={(e) => setFormData({...formData, usuSenha: e.target.value})}
                        className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                      />
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">E-mail</label>
                    <input 
                      required
                      type="email" 
                      value={formData.usuEmail}
                      onChange={(e) => setFormData({...formData, usuEmail: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Cargo</label>
                    <input 
                      type="text" 
                      value={formData.usuCargo}
                      onChange={(e) => setFormData({...formData, usuCargo: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Status</label>
                    <select 
                      value={formData.usuStatus ? 'ativo' : 'inativo'}
                      onChange={(e) => setFormData({...formData, usuStatus: e.target.value === 'ativo'})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Foto/Avatar (URL)</label>
                    <input 
                      type="text" 
                      placeholder="https://exemplo.com/foto.jpg"
                      value={formData.usuAvatar}
                      onChange={(e) => setFormData({...formData, usuAvatar: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                    <p className="text-[10px] text-[#82737d] mt-1 italic font-bold">* Se informar uma URL, o sistema converterá e salvará a imagem internamente.</p>
                  </div>

                  <div className="col-span-2 flex gap-4 mt-6">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-4 border-2 border-[#eee5f0] text-[#82737d] rounded-2xl font-black uppercase tracking-widest hover:bg-[#fcf8fc] transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-4 bg-[#631660] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#4a1047] transition-all shadow-lg hover:scale-105"
                    >
                      {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Usuarios;
