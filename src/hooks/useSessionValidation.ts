import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getSessionToken,
  clearSessionToken,
  setSessionToken,
} from "@/lib/cookies";
import { User } from "@supabase/supabase-js";

export function useSessionValidation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function validateSession() {
      try {
        // First check if we have a session token in cookie
        const cookieToken = getSessionToken();

        // Get current session from Supabase
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session validation error:", error);
          clearSessionToken();
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          // Valid session exists
          if (mounted) {
            setUser(session.user);
            setIsAuthenticated(true);

            // Update cookie with fresh token if different
            if (session.access_token !== cookieToken) {
              setSessionToken(session.access_token);
            }
          }
        } else if (cookieToken) {
          // We have a cookie token but no active session
          // Try to refresh the session
          const {
            data: { session: refreshedSession },
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (refreshedSession?.user && !refreshError) {
            if (mounted) {
              setUser(refreshedSession.user);
              setIsAuthenticated(true);
              setSessionToken(refreshedSession.access_token);
            }
          } else {
            // Refresh failed, clear cookie
            clearSessionToken();
            if (mounted) {
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          // No session and no cookie
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Session validation error:", error);
        clearSessionToken();
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    validateSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        setIsAuthenticated(true);
        setSessionToken(session.access_token);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAuthenticated(false);
        clearSessionToken();
      } else if (event === "TOKEN_REFRESHED" && session) {
        setUser(session.user);
        setIsAuthenticated(true);
        setSessionToken(session.access_token);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearSessionToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    signOut,
  };
}
