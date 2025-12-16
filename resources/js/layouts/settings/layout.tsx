import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const navItems: NavItem[] = [
    { title: 'Profile', href: '/settings/profile', icon: null },
    { title: 'Password', href: '/settings/password', icon: null },
    { title: 'Appearance', href: '/settings/appearance', icon: null },
    { title: 'User List', href: '/settings/user', icon: null },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') return null;

    const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-6">
            <Heading title="Settings" description="Manage your profile and account settings" />

            {/* Top Tabs */}
            <div className="mt-6">
                <div className="border-b">
                    <nav className="flex w-full gap-2 overflow-x-auto pb-2">
                        {navItems.map((item, index) => {
                            const isActive = currentPath === item.href;

                            return (
                                <Button
                                    key={`${item.href}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'shrink-0 justify-start rounded-none border-b-2 border-transparent px-3',
                                        isActive
                                            ? 'border-primary text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.title}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content (full width for datatable) */}
            <div className="mt-6">
                <section className="w-full space-y-6">{children}</section>
            </div>
        </div>
    );
}
