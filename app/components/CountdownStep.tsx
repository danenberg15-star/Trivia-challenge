"use client";
import React, { useState, useEffect } from "react";

export default function CountdownStep({ timer = 3, onComplete }: any) {
  const [count, setCount] = useState(timer);

  useEffect(() => {
    if (count > 0) {
      const t = setTimeout(() => setCount((c: number) => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      // ברגע שהספירה מגיעה ל-0 מפעילים את פונקציית המעבר
      if (onComplete) onComplete();
    }
  }, [count, onComplete]);

  return (
    <div style={s.layout}>
      <div style={s.circle}>
        <span style={s.text}>{count > 0 ? count : "GO!"}</span>
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
    alignItems: 'center', 
    justifyContent: 'center',
    direction: 'rtl'
  },
  circle: { 
    width: '200px', 
    height: '200px', 
    borderRadius: '50%', 
    backgroundColor: 'rgba(255,215,0,0.1)', 
    border: '5px solid #ffd700', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)'
  },
  text: { 
    fontSize: '6rem', 
    fontWeight: '900', 
    color: '#ffd700' 
  }
};