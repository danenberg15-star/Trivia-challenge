"use client";
import React from "react";

export default function RulesStep({ onStart }: { onStart: () => void }) {
  return (
    <div style={s.layout}>
      <div style={s.container}>
        <h1 style={{ ...s.title, fontSize: '1.8rem', marginBottom: '20px' }}>Trivia Time Challenge ⏱️</h1>
        
        <div style={s.scrollArea}>
          <section style={s.section}>
            <h2 style={s.subTitle}>1. הזמן הוא המטרה</h2>
            <p style={s.text}>מתחילים עם 20 שניות. המטרה היא למלא את הטיימר או להיות האחרונים ששורדים.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.subTitle}>2. צבירת שניות</h2>
            <p style={s.text}>תשובה נכונה מעניקה 10 שניות. טעות מורידה 7 שניות. מהירות ועקביות הן המפתח!</p>
          </section>

          <section style={s.section}>
            <h2 style={s.subTitle}>3. הסכמה מלאה</h2>
            <p style={s.text}>במצב קבוצתי, כל חברי הקבוצה חייבים לבחור באותה תשובה כדי שניתן יהיה ללחוץ "סופי".</p>
          </section>

          <section style={s.section}>
            <h2 style={s.subTitle}>4. כלי עזר</h2>
            <p style={s.text}>השתמשו בהקפאת זמן, 50:50 והאטת זמן כדי להיחלץ ממצבים קשים.</p>
          </section>
        </div>

        <button onClick={onStart} style={s.button}>
          יאללה, הבנתי!
        </button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '15px', direction: 'rtl', alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '450px', backgroundColor: '#1a1d2e', borderRadius: '30px', padding: '25px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255, 215, 0, 0.2)' },
  title: { color: '#ffd700', textAlign: 'center', fontWeight: '900' },
  scrollArea: { flex: 1, marginBottom: '10px' },
  section: { marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' },
  subTitle: { color: '#ffd700', fontSize: '1.1rem', marginBottom: '5px', fontWeight: 'bold' },
  text: { fontSize: '0.95rem', lineHeight: '1.4', opacity: 0.9 },
  button: { width: '100%', height: '55px', backgroundColor: '#ffd700', color: '#05081c', border: 'none', borderRadius: '18px', fontSize: '1.2rem', fontWeight: '900', cursor: 'pointer', marginTop: '10px' }
};