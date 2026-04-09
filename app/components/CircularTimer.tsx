"use client";
import React from "react";

interface Props {
  timeLeft: number;
  maxTime: number; // 60 לסולו, 120 לקבוצתי
}

export default function CircularTimer({ timeLeft, maxTime }: Props) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / maxTime) * circumference;
  
  // חישוב זווית המחוג (360 מעלות חלקי 60 שניות)
  const handRotation = (timeLeft % 60) * 6;

  return (
    <div style={s.container}>
      <svg width="160" height="160" style={s.svg}>
        {/* רקע השעון */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        {/* מילוי הזמן שנותר */}
        <circle 
          cx="80" cy="80" r={radius} fill="none" 
          stroke={timeLeft < 10 ? "#ef4444" : "#ffd700"} 
          strokeWidth="8" 
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
          transform="rotate(-90 80 80)"
        />
        {/* מחוג שניות אדום */}
        <line 
          x1="80" y1="80" x2="80" y2="20" 
          stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
          style={{ 
            transform: `rotate(${handRotation}deg)`, 
            transformOrigin: '80px 80px',
            transition: 'transform 1s linear'
          }} 
        />
        {/* מרכז המחוג */}
        <circle cx="80" cy="80" r="4" fill="#ef4444" />
      </svg>
      <div style={s.timeText}>{Math.max(0, Math.floor(timeLeft))}</div>
    </div>
  );
}

const s: any = {
  container: { position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  svg: { transform: 'scaleX(-1)' }, // הופך את הכיוון לשעון ספורטאים תקני
  timeText: { position: 'absolute', fontSize: '2.5rem', fontWeight: '900', color: 'white', fontFamily: 'monospace' }
};