import React from 'react';

const Footer = () => {
  return (
    <footer className="px-10 py-6 bg-white border-t border-[#eee5f0] text-center shrink-0">
      <p className="text-[10px] font-black text-[#82737d] uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} Ponto Fácil • Sistema de Gestão de Horas
      </p>
    </footer>
  );
};

export default Footer;
