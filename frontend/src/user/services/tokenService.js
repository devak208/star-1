// Token management functions
export const getAccessToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.accessToken || null;
};

export const getRefreshToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.refreshToken || null;
};

export const setAuthTokens = (accessToken, refreshToken) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  user.accessToken = accessToken;
  user.refreshToken = refreshToken;
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem('user');
}; 