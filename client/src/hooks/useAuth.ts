import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isPending, status } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 60 * 1000, // treat auth as fresh for 1 minute to avoid mid-render flicker
  });

  // isPending stays true until the first successful (or failed) response arrives.
  // isLoading (isPending && isFetching) can briefly be false before fetching starts,
  // which caused premature redirect to /auth on first visit.
  return {
    user,
    isLoading: isPending,
    isAuthenticated: !!user,
    authStatus: status, // 'pending' | 'success' | 'error'
  };
}
