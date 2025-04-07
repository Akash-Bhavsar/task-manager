'use client'
// Manage Use session to the entire application
export async function loginUser(username: string, password: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    });

    if (!res.ok) {
        throw new Error("Invalid credentials");
    }
    const data = await res.json();

    localStorage.setItem("token", data.token);

    // Set token expiration in localStorage
    const expirationTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour from now
    localStorage.setItem("tokenExpiration", expirationTime.toString());
    return data;
}

export async function fetchUserInfo() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: 'include'
    });

    if (!res.ok) {
        throw new Error("Failed to fetch user information");
    }

    return res.json();
}

export function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiration");

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`, {
        method: "POST",
        credentials: 'include'
    }).catch(err => console.error("Logout error:", err));

    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
}

export async function signupUser(username: string, password: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    });

    if (!res.ok) {
        throw new Error("Signup failed");
    }
    return res.json();
}
