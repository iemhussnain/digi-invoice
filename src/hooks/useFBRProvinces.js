import { useQuery } from '@tanstack/react-query';
import { getProvinceCodes } from '@/services/fbr-service';

/**
 * Custom hook to fetch FBR provinces
 * @param {string} environment - 'sandbox' or 'production'
 */
export function useFBRProvinces(environment = 'production') {
  return useQuery({
    queryKey: ['fbr-provinces', environment],
    queryFn: async () => {
      const response = await getProvinceCodes(environment);
      console.log('FBR Provinces API Response:', response);

      // Check if response is wrapped in a data property
      const provinces = response?.data || response;

      // Ensure we have an array
      if (!Array.isArray(provinces)) {
        console.error('FBR Provinces response is not an array:', provinces);
        return [];
      }

      console.log('Parsed provinces:', provinces);
      return provinces;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - provinces don't change often
    cacheTime: 24 * 60 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
