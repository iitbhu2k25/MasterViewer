'use client';

import dynamic from 'next/dynamic';

const HolisticModule = dynamic(() => import('./HolisticModule'), {
  ssr: false,
});

export default function HolisticPage() {
  return <HolisticModule />;
}
