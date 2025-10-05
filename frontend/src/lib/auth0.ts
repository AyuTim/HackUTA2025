// Re-export Auth0 functions
export { 
  handleAuth,
  handleCallback,
  handleLogin,
  handleLogout,
  handleProfile,
  withApiAuthRequired,
  withPageAuthRequired,
  getSession,
  getAccessToken
} from '@auth0/nextjs-auth0';