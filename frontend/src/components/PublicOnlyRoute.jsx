import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Redirects away from public-only pages (e.g., login) when a token already exists.
 */
const PublicOnlyRoute = ({ children, redirectTo, tokenKey }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;

  if (token) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicOnlyRoute;
