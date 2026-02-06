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
        <TopHeader />
        {/* <Header/> */}
        <Navbar />
        <main className="flex-grow bg-inherit">
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </main>
        <Footer />
      </body>
    </html>
  );
}