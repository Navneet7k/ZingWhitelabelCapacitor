import React, { createContext, useContext, useState, useEffect } from 'react';
import { HomeData, fetchHomeData, getCachedHomeData } from '../services/homeApi';
import { getRestaurantId } from '../services/restaurantConfig';

interface CtxValue {
  data:    HomeData | null;
  loading: boolean;
  error:   string  | null;
  refetch: (token?: string) => Promise<void>;
}

const HomeDataContext = createContext<CtxValue>({ data: null, loading: true, error: null, refetch: async () => {} });

export const HomeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const restaurantId = getRestaurantId();

  // Show cached data immediately while fetching fresh in background
  const [data, setData]       = useState<HomeData | null>(() =>
    restaurantId ? getCachedHomeData(restaurantId) : null
  );
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    fetchHomeData(restaurantId)
      .then(fresh => { setData(fresh); setError(null); })
      .catch(e    => { setError(e.message); console.warn('[HomeApi] fetch failed', e); })
      .finally(()  => setLoading(false));
  }, [restaurantId]);

  const refetch = async (token?: string) => {
    if (!restaurantId) return;
    try {
      const fresh = await fetchHomeData(restaurantId, token);
      setData(fresh);
      setError(null);
    } catch (e: any) {
      console.warn('[HomeApi] refetch failed', e);
    }
  };

  return (
    <HomeDataContext.Provider value={{ data, loading, error, refetch }}>
      {children}
    </HomeDataContext.Provider>
  );
};

export const useHomeData = () => useContext(HomeDataContext);
