import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RegisterData, LoginData, User } from "@shared/schema";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  googleAuthMutation: UseMutationResult<any, Error, void>;
};

export function useAuth() {
  const { toast } = useToast();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const response = await fetch("/api/auth/user", {
          credentials: "include",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result.user;
      } catch (error) {
        console.error("Auth error:", error);
        localStorage.removeItem('token');
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao TrainManager Pro!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      toast({
        title: "Conta criada com sucesso",
        description: `Bem-vindo, ${data.user.firstName}! Sua chave de acesso: ${data.accessKey}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const googleAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/google", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error('Google auth not available');
      }

      const data = await response.json();
      window.location.href = data.authUrl;
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na autenticação Google",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      localStorage.removeItem('token');
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    },
  });

  return {
    user: user ?? null,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logoutMutation,
    googleAuthMutation,
  };
}