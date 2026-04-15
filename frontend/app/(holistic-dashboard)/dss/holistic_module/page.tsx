'use client';

import dynamic from 'next/dynamic';

const HolisticModule = dynamic(() => import('../../../(holistic-approach)/holistic/HolisticModule'), {
  ssr: false,
});

export default function DssHolisticModulePage() {
  return <HolisticModule />;
}
