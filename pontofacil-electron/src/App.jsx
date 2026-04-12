import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Mes from './pages/Mes';
import Dia from './pages/Dia';
import ValorHora from './pages/ValorHora';
import Feriados from './pages/Feriados';
import Usuarios from './pages/Usuarios';
import Configuracoes from './pages/Configuracoes';
import AppShell from './components/AppShell';
import GlobalLoadingModal from './components/GlobalLoadingModal';
import ConfirmModal from './components/ConfirmModal';

function App() {
  const { isAuthenticated, isInitializing, initialize } = useAuthStore();
  const [view, setView] = React.useState({ type: 'DASHBOARD', data: null });

  // Initialize auth from Electron-Store on startup
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Global Loading State (Pre-authentication Handshake)
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#fff7ff] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#631660]/30 border-t-[#631660] rounded-full animate-spin" />
        <p className="font-bold text-[#631660] uppercase tracking-widest text-xs">Ponto Fácil</p>
      </div>
    );
  }

  // Navigation Logic
  const renderView = () => {
    switch (view.type) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            onSelectMes={(anoMes) => setView({ type: 'MES', data: anoMes })} 
            onShowClientes={() => setView({ type: 'CLIENTES' })}
          />
        );
      
      case 'CLIENTES':
        return (
          <Clientes 
            onBack={() => setView({ type: 'DASHBOARD' })} 
          />
        );
      
      case 'MES':
        return (
          <Mes 
            anoMes={view.data} 
            onBack={() => setView({ type: 'DASHBOARD', data: null })} 
            onSelectDia={(dia) => setView({ type: 'DIA', data: dia })}
          />
        );
      
      case 'DIA':
        return (
          <Dia 
            dia={view.data} 
            onBack={() => {
              // Extract anoMes from diaData (YYYY-MM-DD)
              const anoMes = view.data?.diaData?.substring(0, 7);
              setView({ type: 'MES', data: anoMes });
            }} 
          />
        );
      
      case 'VALOR_HORA':
        return (
          <ValorHora 
            onBack={() => setView({ type: 'DASHBOARD' })} 
          />
        );
      
      case 'FERIADOS':
        return (
          <Feriados 
            onBack={() => setView({ type: 'DASHBOARD' })} 
          />
        );

      case 'USUARIOS':
        return <Usuarios />;

      case 'CONFIG':
        return <Configuracoes />;
      
      default:
        return <Dashboard 
          onSelectMes={(anoMes) => setView({ type: 'MES', data: anoMes })} 
          onShowClientes={() => setView({ type: 'CLIENTES' })}
        />;
    }
  };

  if (!isAuthenticated) return <Login />;

  return (
    <AppShell currentView={view.type} onNavigate={setView}>
      <div className="font-sans antialiased text-[#1e1a22] flex-1 flex flex-col min-h-screen">
        {renderView()}
        
        {/* Global Notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1e1a22',
              borderRadius: '12px',
              border: '1px solid #eee5f0',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            },
            success: {
              iconTheme: {
                primary: '#631660',
                secondary: '#ffffff',
              },
            },
          }}
        />
        <GlobalLoadingModal />
        <ConfirmModal />
      </div>
    </AppShell>
  );
}

export default App;

