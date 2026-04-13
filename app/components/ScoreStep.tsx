"use client";
import React, { useEffect, useState, useRef } from "react";

export default function ScoreStep({ roomData, onNext }: any) {
  const [displayTime, setDisplayTime] = useState<number>(0);
  const [showReveal, setShowReveal] = useState(false);
  
  const hasInitialized = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playerName = roomData.teamNames[0];
  const targetTime = roomData.timeBanks[playerName] || 0;
  const lastCorrect = roomData.lastCorrect;
  
  // חישוב הזמן שהיה לשחקן לפני שענה על השאלה האחרונה
  const diff = lastCorrect ? 5 : -2;
  const startTime = Math.max(0, targetTime - diff);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    setDisplayTime(startTime);

    // הפעלת סאונד תקתוק השעון (בדיוק כמו ב-Multiplayer)
    if (typeof Audio !== "undefined") {
      audioRef.current = new Audio('/Clock-Ticking.m4a');
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    }

    // השהיה קצרה של שנייה לפני תחילת ריצת המספרים
    setTimeout(() => {
      let currentDisplay = startTime;
      const steps = 40; 
      const timeDelta = targetTime - startTime;
      const stepValue = timeDelta / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        currentDisplay += stepValue;
        setDisplayTime(currentDisplay);

        if (currentStep >= steps) {
          clearInterval(interval);
          setDisplayTime(targetTime);
          setShowReveal(true);
          
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          
          // צליל "פופ" ברגע חשיפת התוצאה הסופית
          if (typeof Audio !== "undefined") {
            const pop = new Audio('/Score-Pop.m4a');
            pop.volume = 0.7;
            pop.play().catch(() => {});
          }
        }
      }, 50); // 40 צעדים של 50ms = 2 שניות של אנימציה זורמת
    }, 1000); 

  }, [startTime, targetTime]);

  useEffect(() => {
    if (showReveal) {
      // מעבר אוטומטי לשאלה הבאה לאחר 2.5 שניות מרגע הצגת החיווי הצף
      const timer = setTimeout(() => {
        onNext();
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [showReveal, onNext]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(displayTime / 60, 0), 1);
  const strokeDashoffset = circumference - (progress * circumference);
  
  const isWinner = displayTime >= 60;
  const isDanger = displayTime <= 10;
  const circleColor = isWinner ? "#10b981" : (isDanger ? "#ef4444" : "#00E5FF");

  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={{ 
          ...s.resultBadge, 
          backgroundColor: lastCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
          borderColor: lastCorrect ? '#10b981' : '#ef4444', 
          color: lastCorrect ? '#10b981' : '#ef4444' 
        }}>
          {lastCorrect ? "✓ תשובה נכונה!" : "✕ טעות!"}
        </div>
        
        <h1 style={s.title}>מצב השעון</h1>

        <div style={s.timeContainer}>
          <div style={s.timerWrapper}>
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle 
                cx="75" cy="75" r={radius} 
                fill="none" 
                stroke="rgba(255,255,255,0.05)" 
                strokeWidth="10" 
              />
              <circle 
                cx="75" cy="75" r={radius} 
                fill="none" 
                stroke={circleColor} 
                strokeWidth="10" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" 
                transform="rotate(-90 75 75)" 
                style={{ 
                  transition: 'stroke-dashoffset 0.1s linear', 
                  filter: `drop-shadow(0 0 8px ${circleColor})` 
                }}
              />
            </svg>
            
            <div style={s.timerText}>
              <span style={s.timerNum}>{Math.round(displayTime)}</span>
            </div>

            {showReveal && (
              <div style={{ 
                ...s.timerDiff, 
                color: lastCorrect ? '#10b981' : '#ef4444',
                top: lastCorrect ? '-10px' : '90px' // מעבר למעלה להצלחה ולמטה לכישלון
              }}>
                {lastCorrect ? '+5' : '-2'}
              </div>
            )}
          </div>
          <div style={s.teamName}>{playerName}</div>
        </div>

        <p style={s.subText}>השאלה הבאה מיד...</p>
      </div>
    </div>
  );
}

const s: any = {
  layout: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100dvh', 
    backgroundColor: '#05081c', 
    color: 'white', 
    padding: '20px', 
    direction: 'rtl', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  container: { 
    width: '100%', 
    maxWidth: '450px', 
    backgroundColor: '#1a1d2e', 
    borderRadius: '30px', 
    padding: '40px 30px', 
    textAlign: 'center', 
    border: '1px solid rgba(255,255,255,0.05)', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center' 
  },
  resultBadge: { 
    display: 'inline-block', 
    padding: '12px 25px', 
    borderRadius: '20px', 
    border: '2px solid', 
    fontWeight: 'bold', 
    fontSize: '1.3rem', 
    marginBottom: '30px' 
  },
  title: { 
    color: '#FF9100', 
    fontSize: '2.2rem', 
    fontWeight: '900', 
    margin: '0 0 40px 0' 
  },
  timeContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '20px', 
    marginBottom: '30px' 
  },
  teamName: { 
    fontSize: '1.6rem', 
    fontWeight: 'bold', 
    color: 'white' 
  },
  timerWrapper: { 
    position: 'relative', 
    width: '150px', 
    height: '150px', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  timerText: { 
    position: 'absolute', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  timerNum: { 
    fontSize: '3.5rem', 
    fontWeight: '900', 
    fontFamily: 'monospace' 
  },
  timerDiff: { 
    position: 'absolute', 
    right: '-25px', 
    fontSize: '2rem', 
    fontWeight: '900', 
    textShadow: '0 4px 10px rgba(0,0,0,0.5)',
    animation: 'floatAnimation 0.5s ease-out forwards' // אנימציה פשוטה לחיווי הצף
  },
  subText: { 
    color: 'rgba(255,255,255,0.4)', 
    fontSize: '1.1rem', 
    marginTop: '20px' 
  }
};