import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

//!TODO: Add this to environment variables
// const supabaseUrl = "https://oluvobwbhrcyoqdxogrc.supabase.co";
// const supabaseAnonKey =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXZvYndiaHJjeW9xZHhvZ3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODU2MDcsImV4cCI6MjA2MDA2MTYwN30.e2JNxEvGdEtL-l3mcfWztTMlRl_rypbpYyWUuni4G7k";

const supabaseUrl = "https://motymbwgcsgyvqampjlf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdHltYndnY3NneXZxYW1wamxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NTY2NTIsImV4cCI6MjA2MTIzMjY1Mn0.ggWnpIj9Br7T8axbqox4wBcEH58tuuZFVaBe1wrPuFk";
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Debug output for development
if (__DEV__) {
  console.log(`Supabase client initialized - ${new Date().toISOString()}`);
}
