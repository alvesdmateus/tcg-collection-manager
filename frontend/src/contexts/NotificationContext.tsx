import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';

// ─── Types ───────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  actions?: ToastAction[];
  duration?: number;
  createdAt: number;
  exiting?: boolean;
}

interface NotificationContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  isConnected: boolean;
  isRetrying: boolean;
  retryConnection: () => Promise<void>;
  bannerDismissed: boolean;
  dismissBanner: () => void;
}

// ─── Defaults ────────────────────────────────────────────────────────

const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  success: 5000,
  info: 5000,
  warning: 8000,
  error: 0, // stays until dismissed
};

const MAX_TOASTS = 5;

// ─── Reducer ─────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_EXITING'; payload: string }
  | { type: 'CLEAR_ALL' };

function toastReducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case 'ADD_TOAST': {
      const next = [...state, action.payload];
      // Remove oldest if exceeding max
      if (next.length > MAX_TOASTS) {
        return next.slice(next.length - MAX_TOASTS);
      }
      return next;
    }
    case 'REMOVE_TOAST':
      return state.filter((t) => t.id !== action.payload);
    case 'SET_EXITING':
      return state.map((t) =>
        t.id === action.payload ? { ...t, exiting: true } : t,
      );
    case 'CLEAR_ALL':
      return [];
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

let idCounter = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const [isConnected, setIsConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id' | 'createdAt'>): string => {
      const id = `toast-${Date.now()}-${++idCounter}`;
      const duration =
        toast.duration !== undefined
          ? toast.duration
          : DEFAULT_DURATIONS[toast.type];

      dispatch({
        type: 'ADD_TOAST',
        payload: { ...toast, id, createdAt: Date.now(), duration },
      });
      return id;
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'SET_EXITING', payload: id });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, 200);
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const addToastRef = useCallback(
    (type: NotificationType, title: string, message?: string) => {
      addToast({ type, title, message });
    },
    [addToast],
  );

  const { checkNow } = useConnectionMonitor({
    onConnectionLost: () => {
      setIsConnected(false);
      setBannerDismissed(false);
      addToastRef(
        'error',
        t('notifications.connectionLost'),
        t('notifications.connectionLostMessage'),
      );
    },
    onConnectionRestored: () => {
      setIsConnected(true);
      addToastRef(
        'success',
        t('notifications.connectionRestored'),
        t('notifications.connectionRestoredMessage'),
      );
    },
  });

  const retryConnection = useCallback(async () => {
    setIsRetrying(true);
    await checkNow();
    setIsRetrying(false);
  }, [checkNow]);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const value = useMemo<NotificationContextType>(
    () => ({
      toasts,
      addToast,
      removeToast,
      clearAll,
      isConnected,
      isRetrying,
      retryConnection,
      bannerDismissed,
      dismissBanner,
    }),
    [
      toasts,
      addToast,
      removeToast,
      clearAll,
      isConnected,
      isRetrying,
      retryConnection,
      bannerDismissed,
      dismissBanner,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
  }
  return context;
}
