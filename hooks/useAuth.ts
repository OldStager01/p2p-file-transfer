import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const setInitialState = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        setState({
          session: data.session,
          user: data.session?.user || null,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error getting auth session:", error);
        setState({
          session: null,
          user: null,
          loading: false,
          error: error as Error,
        });
      }
    };

    setInitialState();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState({
        session,
        user: session?.user || null,
        loading: false,
        error: null,
      });
    });

    // Clean up the subscription when unmounting
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setState({ ...state, loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      setState({ ...state, loading: false, error: error as Error });
      return { user: null, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    setState({ ...state, loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      setState({ ...state, loading: false, error: error as Error });
      return { user: null, error: error as Error };
    }
  };

  const signOut = async () => {
    setState({ ...state, loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      setState({ ...state, loading: false, error: error as Error });
      return { success: false, error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    setState({ ...state, loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "filetransferapp://reset-password",
      });

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Reset password error:", error);
      setState({ ...state, loading: false, error: error as Error });
      return { success: false, error: error as Error };
    }
  };

  return {
    session: state.session,
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
