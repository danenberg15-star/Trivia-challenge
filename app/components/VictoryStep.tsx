"use client";

import React from "react";

interface VictoryStepProps {
  winnerName: string;
  onRestart: () => void;
}

export default function VictoryStep({ winnerName, onRestart }: VictoryStepProps) {
  return (
    <div style={{
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '100vw', 
      height: '100dvh', 
      backgroundColor: '#f8fafc', // רקע בהיר וחגיגי
      direction: 'rtl', 
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      padding: '20px'
    }}>
      {/* אנימציית קונפטי */}
      <div className="confetti-container">
        <style>{`
          .confetti-container { position: absolute; width: 100%; height: 100%; overflow: hidden; pointer-events: none; top: 0; left: 0; z-index: 1; }
          .confetti { position: absolute; width: 12px; height: 12px; animation: fall 4s linear infinite; opacity: 0.9; }
          @keyframes fall { 
            0% { transform: translateY(-10vh) rotate(0deg); } 
            100% { transform: translateY(110vh) rotate(720deg); } 
          }
        `}</style>
        {[...Array(50)].map((_, i) => {
          // צבעים מגוונים לקונפטי
          const colors = ['#ffd700', '#ff5e5e', '#5eff8a', '#5ebcff', '#b85eff'];
          const color = colors[i % colors.length];
          return (
            <div 
              key={i} 
              className="confetti" 
              style={{ 
                left: `${Math.random() * 100}%`, 
                animationDelay: `${Math.random() * 4}s`, 
                backgroundColor: color,
                borderRadius: i % 3 === 0 ? '50%' : '0' // שילוב של עיגולים וריבועים
              }} 
            />
          );
        })}
      </div>
      
      {/* תוכן מרכזי */}
      <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center', marginTop: '-10vh' }}>
        {/* גביע עם אנימציית קפיצה קלה */}
        <div style={{ fontSize: '120px', filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.1))', animation: 'bounce 2s infinite' }}>
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-15px); }
            }
          `}</style>
          🏆
        </div>
        
        <h1 style={{ color: '#05081c', fontSize: '2.2rem', fontWeight: '900', margin: '0', lineHeight: '1.2' }}>
          כל הכבוד על הניצחון שלכם!
        </h1>
        
        <div style={{ 
          backgroundColor: '#ffd700', 
          padding: '15px 40px', 
          borderRadius: '20px', 
          boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)',
          marginTop: '10px'
        }}>
          <h2 style={{ color: '#05081c', fontSize: '2.5rem', fontWeight: '900', margin: '0' }}>
            {winnerName}
          </h2>
        </div>
      </div>

      {/* כפתור תחתון */}
      <div style={{ zIndex: 10, position: 'absolute', bottom: '30px', width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
         <button onClick={onRestart} style={{
            width: '100%', 
            minHeight: '60px', 
            borderRadius: '18px', 
            backgroundColor: '#05081c', 
            color: '#ffd700', 
            fontWeight: '900', 
            border: 'none', 
            fontSize: '1.4rem', 
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
         }}>
           משחק חדש 🔄
         </button>
      </div>
    </div>
  );
}