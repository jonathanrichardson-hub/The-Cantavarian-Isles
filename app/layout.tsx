import type { Metadata } from 'next';
import './globals.css';
import NavBar from './components/NavBar';

export const metadata: Metadata = {
  title: 'The Cantavarian Isles',
  description: 'Private D&D Campaign Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex flex-col min-h-screen">
          {/* Our new smart navigation bar! */}
          <NavBar />

          {/* Main Content Area */}
          <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="bg-[#2c3e2d]/80 border border-[#4b5e40] rounded-lg p-6 shadow-2xl backdrop-blur-sm min-h-[70vh]">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
