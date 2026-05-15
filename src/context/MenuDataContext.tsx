import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuData, fetchMenuData, getCachedMenuData } from '../services/menuApi';
import { getRestaurantId } from '../services/restaurantConfig';

interface CtxValue {
  data:    MenuData | null;
  loading: boolean;
  error:   string | null;
}

const MenuDataContext = createContext<CtxValue>({ data: null, loading: true, error: null });

export const MenuDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const restaurantId = getRestaurantId();

  const [data, setData]       = useState<MenuData | null>(() =>
    restaurantId ? getCachedMenuData(restaurantId) : null
  );
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    fetchMenuData(restaurantId)
      .then(fresh => { setData(fresh); setError(null); })
      .catch(e    => { setError(e.message); console.warn('[MenuApi] fetch failed', e); })
      .finally(()  => setLoading(false));
  }, [restaurantId]);

  return (
    <MenuDataContext.Provider value={{ data, loading, error }}>
      {children}
    </MenuDataContext.Provider>
  );
};

export const useMenuData = () => useContext(MenuDataContext);
