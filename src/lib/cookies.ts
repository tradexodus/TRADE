// Cookie utility functions for enhanced UX

/**
 * Set a cookie with optional expiration and path
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 30,
  path: string = "/",
): void {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    const cookieString = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=${path};SameSite=Lax`;
    document.cookie = cookieString;

    console.log("Cookie set:", { name, value, cookieString });
  } catch (error) {
    console.error("Error setting cookie:", error);
  }
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  try {
    if (typeof document === "undefined") {
      return null;
    }

    const nameEQ = name + "=";
    const ca = document.cookie.split(";");

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
        console.log("Cookie retrieved:", { name, value });
        return value;
      }
    }
    console.log("Cookie not found:", name);
    return null;
  } catch (error) {
    console.error("Error getting cookie:", error);
    return null;
  }
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, path: string = "/"): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path};`;
}

/**
 * Check if cookies are enabled in the browser
 */
export function areCookiesEnabled(): boolean {
  try {
    setCookie("test_cookie", "test", 1);
    const enabled = getCookie("test_cookie") === "test";
    deleteCookie("test_cookie");
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Store form progress in cookies
 */
export function saveFormProgress(
  formId: string,
  data: Record<string, any>,
): void {
  const progressKey = `form_progress_${formId}`;
  setCookie(progressKey, JSON.stringify(data), 7); // Save for 7 days
}

/**
 * Retrieve form progress from cookies
 */
export function getFormProgress(formId: string): Record<string, any> | null {
  const progressKey = `form_progress_${formId}`;
  const data = getCookie(progressKey);

  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear form progress from cookies
 */
export function clearFormProgress(formId: string): void {
  const progressKey = `form_progress_${formId}`;
  deleteCookie(progressKey);
}

/**
 * Store session token in secure cookie
 */
export function setSessionToken(token: string): void {
  setCookie("session_token", token, 30); // 30 days
}

/**
 * Get session token from cookie
 */
export function getSessionToken(): string | null {
  return getCookie("session_token");
}

/**
 * Clear session token
 */
export function clearSessionToken(): void {
  deleteCookie("session_token");
}

/**
 * Store theme preference in cookie
 */
export function setThemePreference(theme: "light" | "dark"): void {
  setCookie("theme_preference", theme, 365); // 1 year
}

/**
 * Get theme preference from cookie
 */
export function getThemePreference(): "light" | "dark" | null {
  const theme = getCookie("theme_preference");
  return theme === "light" || theme === "dark" ? theme : null;
}
