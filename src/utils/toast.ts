// Lightweight event-driven toast dispatcher adhering to iFrame zero-alert guidelines
export interface ToastPayload {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

export const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent<ToastPayload>('asted-toast', {
    detail: {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      message,
      type,
    },
  });
  window.dispatchEvent(event);
};
