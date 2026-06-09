import { TOKEN_KEY } from "./Constants";

export const setLocalStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
}
export const getLocalStorage = (key) => {
    const value = localStorage.getItem(key);
    if (value) {
        return JSON.parse(value);
    }
}


export const saveToken = (token) => setLocalStorage(TOKEN_KEY, token);
export const getToken = () => getLocalStorage(TOKEN_KEY);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};