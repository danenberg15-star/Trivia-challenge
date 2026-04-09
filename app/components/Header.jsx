import React from 'react';
import Logo from './Logo';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50">
      {/* צד שמאל - מקום לכפתור תפריט או חזרה */}
      <div className="w-10 flex justify-start">
        <button className="text-xl">☰</button>
      </div>

      {/* מרכז - הלוגו */}
      <div className="flex-grow flex justify-center">
        <Logo />
      </div>

      {/* צד ימין - מטבעות או ניקוד */}
      <div className="w-10 flex justify-end">
        <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/50">
          <span className="text-yellow-400 text-sm font-bold">0</span>
          <span className="text-xs">🪙</span>
        </div>
      </div>
    </header>
  );
};

export default Header;