import React, { createContext, useContext, useState } from "react";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expirationTime: number;
}

interface AuthContextType {
  tokens: Tokens;
  setTokens: (tokens: Tokens) => void;
}

const defaultTokens: Tokens = {
  accessToken: "",
  refreshToken: "",
  expiresIn: 3600,
  expirationTime: 0
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize state with a simple function that returns defaultTokens if no valid stored tokens exist
  const [tokens, setTokens] = useState<Tokens>(() => {
    const storedTokens = localStorage.getItem("tokens");
    
    if (!storedTokens) {
      return defaultTokens;
    }
    
    try {
      const parsed = JSON.parse(storedTokens);
      
      // Basic validation of the parsed data
      if (parsed && 
          typeof parsed === 'object' && 
          typeof parsed.accessToken === 'string' && 
          typeof parsed.refreshToken === 'string') {
        return parsed;
      }
      
      // If validation fails, remove invalid data and return defaults
      localStorage.removeItem("tokens");
      return defaultTokens;
      
    } catch {
      // If parsing fails, remove invalid data and return defaults
      localStorage.removeItem("tokens");
      return defaultTokens;
    }
  });

  // Wrap token updates in a function that handles both state and localStorage
  const updateTokens = (newTokens: Tokens) => {
    try {
      if (newTokens && typeof newTokens === 'object') {
        setTokens(newTokens);
        localStorage.setItem("tokens", JSON.stringify(newTokens));
      }
    } catch (error) {
      console.error("Failed to update tokens:", error);
    }
  };

  const contextValue = {
    tokens,
    setTokens: updateTokens
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};