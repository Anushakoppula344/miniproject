import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

interface LayoutProps {
    children: ReactNode;
}

const Layout = async ({ children }: LayoutProps) => {
    const pathname = typeof window === "undefined" ? "" : window.location.pathname;

    // Only protect "dashboard" routes
    const protectedRoutes = ["/dashboard", "/profile"]; // add other protected routes
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        const isUserAuthenticated = await isAuthenticated();
        if (!isUserAuthenticated) redirect("/auth/sign-in");
    }

    return (
        <div className="root-layout">
            <nav className="p-4 border-b">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="PrepWise Logo" width={38} height={32} />
                    <h2 className="text-primary-100 font-bold">Campus2Career</h2>
                </Link>
            </nav>

            <main>{children}</main>
        </div>
    );
};

export default Layout;
