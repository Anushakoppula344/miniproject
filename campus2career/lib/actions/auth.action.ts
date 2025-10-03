"use server";

import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();

    // Set cookie in the browser
    cookieStore.set("session", token, {
        maxAge: SESSION_DURATION,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
    });
}

export async function signUp(params: SignUpParams): Promise<{ success: boolean, message: string }> {
    const { name, email, password } = params;

    try {
        const response = await fetch('http://localhost:5000/auth/sign-up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const result = await response.json();
        return result;
    } catch (error: any) {
        console.error("Error creating user:", error);
        return {
            success: false,
            message: error.message || "Failed to create account. Please try again.",
        };
    }
}
/******  0058dad8-47fd-4018-8b34-7df225a4baab  *******/
export async function signIn(params: SignInParams): Promise<{ success: boolean, message: string, token?: string }> {
    const { email, password } = params;

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://miniproject-backend.vercel.app'}/auth/sign-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        if (result.success) {
            await setSessionCookie(result.token);
        }
        return result;
    } catch (error: any) {
        console.error("Error signing in:", error);
        return {
            success: false,
            message: error.message || "Failed to log into account. Please try again.",
        };
    }
}

// Sign out user by clearing the session cookie
export async function signOut(): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.delete("session");
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) return null;

    try {
        const response = await fetch('http://localhost:5000/auth/me', {
            headers: { 'Authorization': `Bearer ${sessionCookie}` },
        });

        if (!response.ok) {
            console.error(`Failed to get current user: ${response.status} ${response.statusText}`);
            return null;
        }

        const user = await response.json();
        return user;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return !!user;
}
