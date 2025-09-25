// Deprecated: useUserMetrics instead. Keeping this wrapper for backward compatibility.
import { useUserMetrics, UserMetrics } from "./useUserMetrics";

export function useUserStats(): UserMetrics {
  return useUserMetrics();
}
