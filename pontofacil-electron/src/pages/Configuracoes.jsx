import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { Settings, Mail, Save, Server, ShieldCheck, MailCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Footer from '../components/Footer';

const Configuracoes = () => {
  const { smtpConfig, fetchSmtpConfig, saveSmtpConfig, loading } = useDataStore();
  
  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    smtpFromEmail: '',
    smtpFromName: '',
    smtpSecure: false
  });

  useEffect(() => {
    fetchSmtpConfig();
  }, []);

  useEffect(() => {
    if (smtpConfig) {
      setFormData({
        smtpHost: smtpConfig.smtpHost || '',
        smtpPort: smtpConfig.smtpPort || '',
        smtpUser: smtpConfig.smtpUser || '',
        smtpPass: smtpConfig.smtpPass || '',
        smtpFromEmail: smtpConfig.smtpFromEmail || '',
        smtpFromName: smtpConfig.smtpFromName || '',
        smtpSecure: smtpConfig.smtpSecure ?? false
      });
    }
  }, [smtpConfig]);

  const handleSave = async (e) => {
    e.preventDefault();
    const success = await saveSmtpConfig(formData);
    if (success) {
      toast.success('Configurações salvas com sucesso!');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fff7ff]">
      <main className="flex-1 p-10 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-black text-[#1e1a22] tracking-tight flex items-center gap-3">
              <Settings className="text-[#631660]" size={40} />
              Configurações
            </h1>
            <p className="text-[#82737d] mt-2 font-medium">Ajuste os parâmetros globais do sistema</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tabs/Menu Sidebar */}
            <div className="col-span-1 space-y-2">
              <button className="w-full flex items-center gap-3 px-6 py-4 bg-white border border-[#eee5f0] text-[#631660] rounded-2xl font-black shadow-sm transition-all text-left">
                <Mail size={20} />
                Servidor SMTP
              </button>
              <p className="text-[10px] text-[#82737d] px-6 font-bold uppercase tracking-widest mt-4">Outras Opções</p>
              <button className="w-full flex items-center gap-3 px-6 py-4 text-[#82737d] hover:bg-white/50 rounded-2xl font-bold transition-all text-left">
                <ShieldCheck size={20} />
                Segurança
              </button>
            </div>

            {/* Content Area */}
            <div className="col-span-1 md:col-span-2">
              <div className="bg-white rounded-[3rem] shadow-xl border border-[#eee5f0] p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-[#fcf8fc] rounded-2xl flex items-center justify-center text-[#631660]">
                    <Server size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#1e1a22]">Servidor de E-mail</h2>
                    <p className="text-sm font-medium text-[#82737d]">Configure os dados para envio de notificações e recuperação de senha</p>
                  </div>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Servidor (Host)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="ex: smtp.gmail.com"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({...formData, smtpHost: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Porta</label>
                    <input 
                      required
                      type="number" 
                      placeholder="465 ou 587"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({...formData, smtpPort: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                  </div>

                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={formData.smtpSecure}
                          onChange={(e) => setFormData({...formData, smtpSecure: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${formData.smtpSecure ? 'bg-[#631660]' : 'bg-[#eee5f0]'}`}></div>
                        <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.smtpSecure ? 'translate-x-6' : ''}`}></div>
                      </div>
                      <span className="text-xs font-black text-[#1e1a22] uppercase tracking-widest group-hover:text-[#631660] transition-colors">Conexão Segura (SSL)</span>
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Usuário / E-mail de Autenticação</label>
                    <input 
                      required
                      type="text" 
                      value={formData.smtpUser}
                      onChange={(e) => setFormData({...formData, smtpUser: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Senha</label>
                    <input 
                      required
                      type="password" 
                      value={formData.smtpPass}
                      onChange={(e) => setFormData({...formData, smtpPass: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">E-mail do Remetente</label>
                    <input 
                      required
                      type="email" 
                      placeholder="noreply@suaempresa.com"
                      value={formData.smtpFromEmail}
                      onChange={(e) => setFormData({...formData, smtpFromEmail: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold text-[#631660]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#82737d] uppercase tracking-widest mb-2 px-1">Nome do Remetente</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ponto Fácil Notificações"
                      value={formData.smtpFromName}
                      onChange={(e) => setFormData({...formData, smtpFromName: e.target.value})}
                      className="w-full bg-[#fcf8fc] border border-[#eee5f0] rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#631660] font-bold"
                    />
                  </div>

                  <div className="col-span-2 mt-6">
                    <button 
                      type="submit"
                      className="w-full bg-[#631660] text-white py-5 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#4a1047] transition-all shadow-xl hover:scale-[1.02] active:scale-95"
                    >
                      <Save size={24} />
                      Salvar Configurações
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-100 rounded-3xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <MailCheck className="text-blue-600 shrink-0" size={24} />
                <div>
                  <h4 className="font-black text-blue-900 text-sm italic">Dica Importante</h4>
                  <p className="text-blue-800 text-xs mt-1 leading-relaxed font-medium">
                    Para utilizar o Gmail, você deve gerar uma "Senha de App" em sua conta Google, 
                    pois o Google bloqueia o uso da senha principal em apps de terceiros por segurança.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Configuracoes;
