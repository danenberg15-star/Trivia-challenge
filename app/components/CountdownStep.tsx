"use client";
import React from "react";

export default function CountdownStep({ timer }: { timer: number }) {
  return (
    <div style={s.layout}>
      <div style={s.label}>השאלה הבאה מתחילה בעוד...</div>
      <div style={s.number}>{timer}</div>
      <div style={s.footer}>התכוננו! ⏱️</div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', direction: 'rtl' },
  label: { fontSize: '1.5rem', opacity: 0.6, marginBottom: '20px' },
  number: { fontSize: '10rem', fontWeight: '900', color: '#ffd700', lineHeight: 1 },
  footer: { marginTop: '40px', fontSize: '1.2rem', fontWeight: 'bold' }
};