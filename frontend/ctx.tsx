import { useContext, createContext, type PropsWithChildren } from "react";
import { useStorageState } from "./hooks/useStorageState";
import { router } from "expo-router";

const AuthContext = createContext<{
  signIn: (newSession: string) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");

  return (
    <AuthContext.Provider
      value={{
        signIn: (newSession: string) => {
          if (newSession) {
            setSession(newSession);
            router.replace('/');
          } else {
            console.error("A sessão fornecida é inválida.");
          }
        },
        signOut: () => {
          setSession(null);
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
