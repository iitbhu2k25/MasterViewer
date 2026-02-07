'use client';

import { usePathname } from 'next/navigation';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Check if it's the home page. In our structure, 'home' is on /
    // The Dashboard is at /dashboard
    const isHomePage = pathname === '/';

    if (isHomePage) {
        return <>{children}</>;
    }

    return (
        <div className="max-w-[90%] mx-auto w-full bg-inherit">
            {children}
        </div>
    );
}
