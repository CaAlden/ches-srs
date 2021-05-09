import { useEffect, useRef } from 'react';
import {useLocation} from 'react-router';

export const useIsMounted = () => {
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
};

export const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};
