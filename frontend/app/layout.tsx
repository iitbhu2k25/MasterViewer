// app/layout.tsx
import { ReactNode } from 'react';
import './globals.css';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TopHeader from './components/tophead';
import ClientWrapper from './components/ClientWrapper';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <div id="app-top-header">
          <TopHeader />
        </div>
        {/* <Header/> */}
        <div id="app-navbar">
          <Navbar />
        </div>
        <main className="flex-grow bg-inherit">
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </main>
        <div id="app-footer">
          <Footer />
        </div>
      </body>
    </html>
  );
}
