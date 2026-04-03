import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';

const AuthDebug = () => {
  const authState = useAuth();
  
  if (!window.location.search.includes('debug=true')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Auth Debug Info</h4>
      <div>isAuthenticated: {String(authState.isAuthenticated)}</div>
      <div>isLoading: {String(authState.isLoading)}</div>
      <div>isInitialized: {String(authState.isInitialized)}</div>
      <div>user: {authState.user?.username || 'null'}</div>
      <div>error: {authState.error || 'null'}</div>
      <div>_rawState: {JSON.stringify(authState._rawState, null, 2)}</div>
    </div>
  );
};

export default AuthDebug;