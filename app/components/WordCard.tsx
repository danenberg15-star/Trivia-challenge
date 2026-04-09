import { CSSProperties, RefObject } from "react";

interface WordCardProps {
  word: string;
  en?: string;
  img?: string;
  wordRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent) => void;
  isTextOnly?: boolean;
}

export default function WordCard({ word, en, img, wordRef, onPointerDown, isTextOnly }: WordCardProps) {
  return (
    <div ref={wordRef} onPointerDown={onPointerDown} style={cardWrapperStyle}>
      <div style={{...innerCardStyle, minHeight: isTextOnly ? '180px' : 'auto', justifyContent: isTextOnly ? 'center' : 'flex-start'}}>
        {!isTextOnly && img && (
          <img 
            src={img.startsWith('/') ? img : `/${img}`} 
            alt={word} 
            style={imageStyle} 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div style={{...textContainerStyle, padding: isTextOnly ? '20px 10px' : '2px 0 4px 0'}}>
          <h1 style={{...wordTextStyle, fontSize: isTextOnly ? '38px' : '24px'}}>{word}</h1>
          {en && <p style={{...enTextStyle, fontSize: isTextOnly ? '38px' : '14px', marginTop: isTextOnly ? '15px' : '0'}}>{en}</p>}
        </div>
      </div>
    </div>
  );
}

const cardWrapperStyle: CSSProperties = { cursor: 'pointer', touchAction: 'none', userSelect: 'none', textAlign: 'center', zIndex: 10, width: '100%', display: 'flex', justifyContent: 'center' };

const innerCardStyle: CSSProperties = { 
  backgroundColor: 'rgba(25, 30, 60, 0.9)', 
  padding: '4px', 
  borderRadius: '15px', 
  border: '2px solid rgba(255,255,255,0.2)', 
  display: 'inline-flex', 
  flexDirection: 'column', 
  alignItems: 'center',
  gap: '0px', 
  boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
  overflow: 'hidden',
  // === שינוי כאן: הרוחב עכשיו 100% כדי להתאים לכפתורים ===
  width: '100%', 
  maxWidth: '100%', 
  userSelect: 'none'
};

const imageStyle: CSSProperties = { width: '180px', height: '180px', objectFit: 'cover', borderRadius: '12px 12px 4px 4px', display: 'block' };
const textContainerStyle: CSSProperties = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const wordTextStyle: CSSProperties = { color: 'white', margin: '0', lineHeight: '1.2', fontWeight: 'bold' };
const enTextStyle: CSSProperties = { color: '#ffd700', margin: '0', fontWeight: 'bold', opacity: 0.9 };