import React from 'react';
import Sidebar from './Sidebar';

const AppShell = ({ children, currentView, onNavigate }) => {
  return (
    <div className="flex min-h-screen bg-[#fff7ff]">
      <Sidebar currentView={currentView} onNavigate={onNavigate} />
      <main className="flex-1 overflow-auto flex flex-col h-screen relative">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
