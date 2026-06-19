import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wavelength: Person Edition',
  description: 'Get on the same wavelength as your friends',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
