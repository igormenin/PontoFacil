import React from 'react';
import { 
  LayoutDashboard, Users, CreditCard, Calendar, BookOpen, 
  LogOut, Clock, Settings 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NavItem = ({ icon: Icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-[#631660] text-white shadow-md' : 'text-[#50434d] hover:bg-[#f4ebf6]'
    }`}
  >
    <Icon size={20} />
    <span className="font-semibold">{label}</span>
  </button>
);

const Sidebar = ({ currentView, onNavigate }) => {
  const { logout, user } = useAuthStore();

  return (
    <aside className="w-64 bg-white border-r border-[#eee5f0] p-6 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-[#631660] rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
          <Clock className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-[#1e1a22] tracking-tighter">Ponto Fácil</h1>
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem 
          icon={LayoutDashboard} 
          label="Home" 
          active={currentView === 'DASHBOARD'} 
          onClick={() => onNavigate({ type: 'DASHBOARD' })} 
        />
        <NavItem 
          icon={Users} 
          label="Clientes" 
          active={currentView === 'CLIENTES'} 
          onClick={() => onNavigate({ type: 'CLIENTES' })} 
        />
        <NavItem 
          icon={CreditCard} 
          label="Valor/Hora" 
          active={currentView === 'VALOR_HORA'} 
          onClick={() => onNavigate({ type: 'VALOR_HORA' })} 
        />
        <NavItem 
          icon={BookOpen} 
          label="Feriados" 
          active={currentView === 'FERIADOS'} 
          onClick={() => onNavigate({ type: 'FERIADOS' })} 
        />
        <NavItem 
          icon={Calendar} 
          label="Meses" 
          active={currentView === 'MES'} 
          onClick={() => onNavigate({ type: 'MES' })} 
        />
        <NavItem 
          icon={Users} 
          label="Usuários" 
          active={currentView === 'USUARIOS'} 
          onClick={() => onNavigate({ type: 'USUARIOS' })} 
        />
        <NavItem 
          icon={Settings} 
          label="Configurações" 
          active={currentView === 'CONFIG'} 
          onClick={() => onNavigate({ type: 'CONFIG' })} 
        />
      </nav>

      <div className="pt-6 border-t border-[#eee5f0] space-y-4">
        <div className="px-4 py-3 bg-[#f4ebf6] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#631660] flex items-center justify-center text-white text-[10px] font-black shrink-0 overflow-hidden">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.nome?.[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-[#631660] uppercase tracking-widest mb-0.5">Usuário</p>
            <p className="text-sm font-black text-[#1e1a22] truncate">{user?.nome || user?.login || 'Usuário'}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-xl transition-all font-semibold"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
