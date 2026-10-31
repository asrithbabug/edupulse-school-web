// Self-hosted font (bundled at build time; no request to Google Fonts).
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';

export const metadata = {
  title: 'EduPulse School',
  description: 'EduPulse school management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
