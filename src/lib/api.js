const BASE_URL = "http://localhost:8000/api/v1";

export async function fetchWithAuth(endpoint, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      // Session expired or invalid token
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_username");
      localStorage.removeItem("active_repo_id");
      localStorage.removeItem("active_repo_name");
      window.location.href = "/";
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
