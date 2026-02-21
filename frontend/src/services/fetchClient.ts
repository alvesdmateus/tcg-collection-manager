/**
 * Shared fetch wrapper with connection status event dispatching.
 * Dispatches CustomEvents on window so NotificationContext can
 * detect connection loss/recovery without circular imports.
 */

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export async function handleResponse<T>(response: Response): Promise<T> {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Request failed with status ${response.status}`);
  }

  return result.data;
}

export async function fetchWithConnectionCheck(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    window.dispatchEvent(new CustomEvent('api:connected'));
    return response;
  } catch (error) {
    if (error instanceof TypeError) {
      window.dispatchEvent(new CustomEvent('api:connection-lost'));
    }
    throw error;
  }
}
