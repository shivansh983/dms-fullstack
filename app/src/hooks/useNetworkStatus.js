import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useUiStore } from '../store/uiStore';

export default function useNetworkStatus() {
  const setOffline = useUiStore((s) => s.setOffline);
  const isOffline  = useUiStore((s) => s.isOffline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, [setOffline]);

  return isOffline;
}