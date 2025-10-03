import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";

import "./globals.css";
import { setupVapi } from "@/lib/vapi-setup";

const monaSans = Mona_Sans({
    variable: "--font-mona-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Campus2Career",
    description: "An AI-powered platform for preparing for mock interviews",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    // Initialize Vapi connections
    setupVapi();

    return (
        <html lang="en" className="dark">
        <body className={`${monaSans.className} antialiased pattern`}>
        {children}

        <Toaster />
        </body>
        </html>
    );
}