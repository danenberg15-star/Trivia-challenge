"use client";
import React from "react";

export default function RulesStep({ onStart }: { onStart: () => void }) {
  const rules = [
    { icon: "⏱️", title: "הזמן הוא הכל", text: "המטרה היא לצבור זמן בשעון. תשובה נכונה מוסיפה זמן, טעות מורידה." },
    { icon: "🤝", title: "עבודת צוות (בקבוצתי)", text: "עליכם להסכים פה אחד על התשובה לפני שתוכלו להגיש אותה." },
    { icon: "🎁", title: "צ'ק פוינטס", text: "כל 5 שאלות תקבלו כוח עזר אקראי: הקפאה, האטה או 50:50." },
    { icon: "🏆", title: "יעד הניצחון", text: "הגיעו ל-60 שניות (סולו) או 120 שניות (קבוצתי) כדי לנצח!" }
  ];

  return (
    <div style={s.layout}>
      <div style={s.container}>
        <h1 style={s.title}>איך משחקים?</h1>
        
        <div style={s.grid}>
          {rules.map((rule, i) => (
            <div key={i} style={s.ruleCard}>
              <div style={s.ruleIcon}>{rule.icon}</div>
              <h2 style={s.ruleTitle}>{rule.title}</h2>
              <p style={s.ruleText}>{rule.text}</p>
            </div>
          ))}
        </div>

        {/* כפתור התחלה בטורקיז */}
        <button onClick={onStart} style={s.button}>הבנתי, בואו נתחיל! 🚀</button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' },
  container: { width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', padding: '20px 0' },
  title: { color: '#FF9100', fontSize: '2.5rem', fontWeight: '900', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' },
  ruleCard: { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,229,255,0.1)', borderRadius: '20px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  ruleIcon: { fontSize: '3rem', marginBottom: '10px' },
  ruleTitle: { fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginBottom: '8px' },
  ruleText: { fontSize: '0.9rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' },
  button: { width: '100%', height: '65px', backgroundColor: '#00E5FF', color: '#05081c', border: 'none', borderRadius: '15px', fontSize: '1.4rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,229,255,0.3)', transition: 'transform 0.2s', marginTop: '10px' }
};