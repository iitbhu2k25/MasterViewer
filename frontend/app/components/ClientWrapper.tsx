'use client';

import { usePathname } from 'next/navigation';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Check if it's the home page. In our structure, 'home' is on /home
    // The Dashboard is at /
    const isHomePage = pathname === '/home';

    if (isHomePage) {
        return <>{children}</>;
    }

    return (
        <div className="max-w-[90%] mx-auto w-full bg-inherit">
            {children}
        </div>
    );
}
