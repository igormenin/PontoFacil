import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogIn, Lock, User, Clock, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  
  // Forgot Password States
  const [view, setView] = useState('login'); // login, forgot, reset
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { 
    login: performLogin, 
    forgotPassword: performForgot,
    resetPassword: performReset,
    loading 
  } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login || !senha) {
      toast.error('Preencha todos os campos');
      return;
    }

    const success = await performLogin(login, senha);
    if (success) {
      toast.success('Bem-vindo ao Ponto Fácil!');
    } else {
      toast.error('Credenciais inválidas.');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Informe seu e-mail');
    const success = await performForgot(email);
    if (success) {
      toast.success('E-mail enviado! Verifique sua caixa de entrada.');
      setView('reset');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token || !newPassword) return toast.error('Preencha os campos');
    const success = await performReset(email, token, newPassword);
    if (success) {
      toast.success('Senha alterada com sucesso!');
      setView('login');
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7ff] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-[#eee5f0]">
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#631660] rounded-2xl flex items-center justify-center mb-4 shadow-xl rotate-3">
              <Clock className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-[#1e1a22] tracking-tight">Ponto Fácil</h1>
            <p className="text-[#82737d] font-bold mt-1 text-sm uppercase tracking-widest italic">Vibe Premium</p>
          </div>

          {view === 'login' && (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#82737d] uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Usuário
                  </label>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    autoFocus
                    className="w-full px-5 py-4 bg-[#fcf8fc] border border-[#eee5f0] focus:ring-2 focus:ring-[#631660] transition-all outline-none rounded-2xl font-bold"
                    placeholder="Seu login"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#82737d] uppercase tracking-widest flex items-center gap-2">
                    <Lock size={14} /> Senha
                  </label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full px-5 py-4 bg-[#fcf8fc] border border-[#eee5f0] focus:ring-2 focus:ring-[#631660] transition-all outline-none rounded-2xl font-bold"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-[#631660] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-[#4a1047] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={20} /> Acessar Sistema
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center pt-6 border-t border-[#eee5f0]">
                <button 
                  onClick={() => setView('forgot')}
                  className="text-xs font-black text-[#631660] uppercase tracking-widest hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </>
          )}

          {view === 'forgot' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setView('login')}
                className="mb-8 flex items-center gap-2 text-[#82737d] font-bold text-sm hover:text-[#631660] transition-colors"
              >
                <ArrowLeft size={16} /> Voltar ao Login
              </button>
              
              <h2 className="text-xl font-black text-[#1e1a22] mb-2 font-black italic">Recuperar Senha</h2>
              <p className="text-sm text-[#82737d] mb-8 font-medium italic leading-relaxed">Informe o e-mail cadastrado em sua conta para receber o código de recuperação.</p>
              
              <form onSubmit={handleForgot} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#82737d] uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} /> E-mail secundário
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="w-full px-5 py-4 bg-[#fcf8fc] border border-[#eee5f0] focus:ring-2 focus:ring-[#631660] transition-all outline-none rounded-2xl font-bold"
                    placeholder="seu@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-[#631660] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-[#4a1047] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Enviar Código'
                  )}
                </button>
              </form>
            </div>
          )}

          {view === 'reset' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-[#1e1a22] mb-2">Redefinir Senha</h2>
              <p className="text-xs text-[#82737d] mb-8">Digite o código enviado para {email}</p>
              
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#82737d] uppercase tracking-widest flex items-center gap-2">
                    <KeyRound size={14} /> Código de Recuperação
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    autoFocus
                    className="w-full px-5 py-4 bg-[#fcf8fc] border border-[#eee5f0] focus:ring-2 focus:ring-[#631660] transition-all outline-none rounded-2xl font-bold text-center tracking-widest text-xl"
                    placeholder="CÓDIGO"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#82737d] uppercase tracking-widest flex items-center gap-2">
                    <Lock size={14} /> Nova Senha
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-[#fcf8fc] border border-[#eee5f0] focus:ring-2 focus:ring-[#631660] transition-all outline-none rounded-2xl font-bold"
                    placeholder="Min. 6 caracteres"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-[#631660] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-[#4a1047] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
