'use client'
// Session is managed by the API via an httpOnly `accessToken` cookie. The
// browser sends it automatically with `credentials: 'include'`, so there is no
// token to store client-side (storing JWTs in localStorage is XSS-exposed).
const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export async function loginUser(username: string, password: string) {
    const res = await fetch(`${API}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    });

    if (!res.ok) {
        throw new Error("Invalid credentials");
    }
    return res.json();
}

export async function fetchUserInfo() {
    const res = await fetch(`${API}/api/users/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
    });

    if (!res.ok) {
        throw new Error("Failed to fetch user information");
    }

    return res.json();
}

export async function signupUser(username: string, password: string) {
    const res = await fetch(`${API}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    });

    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Signup failed");
    }
    return res.json();
}

export function logoutUser() {
    fetch(`${API}/api/users/logout`, {
        method: "POST",
        credentials: 'include'
    }).catch(err => console.error("Logout error:", err));

    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
}
