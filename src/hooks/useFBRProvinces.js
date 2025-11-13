import { useQuery } from '@tanstack/react-query';
import { getProvinceCodes } from '@/services/fbr-service';

/**
 * Custom hook to fetch FBR provinces
 * @param {string} environment - 'sandbox' or 'production'
 */
export function useFBRProvinces(environment = 'production') {
  return useQuery({
    queryKey: ['fbr-provinces', environment],
    queryFn: () => getProvinceCodes(environment),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - provinces don't change often
    cacheTime: 24 * 60 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
