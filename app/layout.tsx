import type { Metadata } from "next";
import "./globals.css";

// עדכנו את הכותרת והתיאור והוספנו את ה-WEBP כ-OG Image ואייקון
export const metadata: Metadata = {
  title: "Trivia Time Challenge ⏱️",
  description: "האתגר שיוכיח מי באמת יודע הכל ויכול לנצח את השעון - משחק טריוויה קבוצתי ואישי!",
  // הגדרות אייקון לדפדפן (Favicon) מהלוגו שלך
  icons: {
    icon: "/logo.webp", 
    apple: "/logo.webp", // עבור מכשירי אפל
  },
  openGraph: {
    title: "Trivia Time Challenge ⏱️",
    description: "בואו לגלות מי באמת יודע איך לנתח את השעון - האתגר מתחיל עכשיו!",
    type: "website",
    locale: "he_IL",
    url: "https://trivia-time-challenge.vercel.app", 
    images: [
      {
        url: "/logo.webp", // שימוש בלוגו WEBP כתצוגה לוואטסאפ
        width: 630, // ננסה לשמור על יחס 1:1 אם זה לוגו עגול/מרובע
        height: 630,
        alt: "Trivia Time Challenge Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        userSelect: 'none', 
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        touchAction: 'manipulation',
        overflow: 'hidden',
        backgroundColor: '#05081c'
      }}>
        {children}
      </body>
    </html>
  );
}