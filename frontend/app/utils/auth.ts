// utils/auth.ts

// Helper function to set cookies
export function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Helper function to get cookies
export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Helper function to delete cookies
export function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// Clear all authentication data
export function clearAuthData() {
  // Clear localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('isAuthenticated');
  // Clear cookies
  deleteCookie('access_token');
  deleteCookie('isAuthenticated');
}

// Set authentication data
export function setAuthData(token?: string) {
  // Set localStorage
  if (token) {
    localStorage.setItem('access_token', token);
  }
  localStorage.setItem('isAuthenticated', 'true');
  
  // Set cookies (for middleware)
  if (token) {
    setCookie('access_token', token, 7); // 7 days
  }
  setCookie('isAuthenticated', 'true', 7); // 7 days
}

// Check if user is authenticated (client-side)
export function isAuthenticated(): boolean {
  const localAuthStatus = localStorage.getItem('isAuthenticated');
  const cookieAuthStatus = getCookie('isAuthenticated');
  const localToken = localStorage.getItem('access_token');
  const cookieToken = getCookie('access_token');
  
  return (localAuthStatus === 'true' || cookieAuthStatus === 'true') && 
         (localToken !== null || cookieToken !== null);
}

// Get authentication token
export function getAuthToken(): string | null {
  return localStorage.getItem('access_token') || getCookie('access_token');
}

// Logout function
export async function logout(redirectToLogin: boolean = true) {
  try {
    // Call server logout endpoint if available
    const token = getAuthToken();
    if (token) {
      await fetch('http://localhost:9000/api/auth/logout/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(err => {
        console.warn('Server logout failed:', err);
        // Continue with client-side logout even if server logout fails
      });
    }
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    // Always clear client-side data
    clearAuthData();
    
    if (redirectToLogin) {
      // Force redirect to login page
      window.location.replace('/');
    }
  }
}