declare module "@/lib/supabase" {
  import { SupabaseClient, AuthChangeEvent, Session } from "@supabase/supabase-js";
  
  export const supabase: SupabaseClient;
  export function signIn(email: string, password: string): Promise<any>;
  export function signUp(email: string, password: string): Promise<any>;
  export function signOut(): Promise<void>;
  export function getCurrentUser(): Promise<any>;
  export function getUserProfile(userId: string): Promise<any>;
  
  export interface AuthStateChangeCallback {
    (event: AuthChangeEvent, session: Session | null): void;
  }
  export interface AuthListener {
    data: {
      subscription: {
        unsubscribe: () => void;
      };
    };
  }
  export function onAuthStateChange(callback: AuthStateChangeCallback): AuthListener;
}
