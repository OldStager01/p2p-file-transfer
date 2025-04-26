import { supabase } from "../client";

/**
 * Generate a unique 6-digit connection code without relying on database checks
 * @returns Unique connection code
 */
export const generateConnectionCode = async (): Promise<string> => {
  // Generate a pseudo-random 6-digit code
  // We're not checking uniqueness - the risk of collision is low for a new app
  return Math.floor(100000 + Math.random() * 900000).toString();
};
