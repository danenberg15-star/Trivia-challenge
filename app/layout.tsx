import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trivia Time Challenge ⏱️",
  description: "האתגר שיוכיח מי באמת יודע הכל ויכול לנצח את השעון - משחק טריוויה קבוצתי ואישי!",
  manifest: "/manifest.json", // הקישור לקובץ המניפסט של האפליקציה
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trivia Time",
  },
  icons: {
    icon: "/logo.webp", 
    apple: "/logo.webp", 
  },
  openGraph: {
    title: "Trivia Time Challenge ⏱️",
    description: "בואו לגלות מי באמת יודע איך לנצח את השעון - האתגר מתחיל עכשיו!",
    type: "website",
    locale: "he_IL",
    url: "https://trivia-time-challenge.vercel.app", 
    images: [
      {
        url: "/logo.webp",
        width: 630,
        height: 630,
        alt: "Trivia Time Challenge Logo",
      },
    ],
  },
};

// הגדרות Viewport בנפרד (תקני לגרסאות Next.js החדשות)
export const viewport: Viewport = {
  themeColor: "#05081c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
        backgroundColor: '#05081c',
        height: '100dvh',
        width: '100vw'
      }}>
        {children}
      </body>
    </html>
  );
}