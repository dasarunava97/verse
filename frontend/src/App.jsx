/**
 * VERSE Mystical Application Root
 * Main application component with routing, context providers, and global state
 */

import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Context Providers
import { ThemeProvider } from './hooks/useTheme.js';
import { AuthProvider } from './hooks/useAuth.js';
import { NotificationProvider } from './hooks/useNotifications.js';

// Layout Components
import MysticalLayout from './components/layout/Layout.jsx';
import { useAuth } from './hooks/useAuth.js';
// Utils and Constants
import { ROUTES } from './utils/constants.js';
import AuthDebug from './components/debug/AuthDebug.jsx';
import './App.css';

// Page Components (Lazy loaded for better performance)
const Login = React.lazy(() => import('./pages/Login.jsx'));
const Register = React.lazy(() => import('./pages/Register.jsx'));

// Future Components (Will be implemented in later phases)
// const Home = React.lazy(() => import('./pages/Home.jsx'));
const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'));
const StoryCreate = React.lazy(() => import('./pages/StoryCreate.jsx'));
// const StoryPlay = React.lazy(() => import('./pages/StoryPlay.jsx'));



// =============================================================================
// ERROR BOUNDARY COMPONENTS
// =============================================================================

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="verse-error-boundary">
    <div className="verse-error-content">
      <div className="verse-error-icon">⚠️</div>
      <h2 className="verse-error-title">Something went wrong in the mystical realm</h2>
      <p className="verse-error-message">{error.message}</p>
      <button 
        className="verse-error-button"
        onClick={resetErrorBoundary}
      >
        Return to safety
      </button>
    </div>
  </div>
);

const GlobalErrorBoundary = ({ children }) => (
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, errorInfo) => {
      console.error('VERSE Error:', error, errorInfo);
      // In production, this would send to error reporting service
    }}
    onReset={() => {
      window.location.reload();
    }}
  >
    {children}
  </ErrorBoundary>
);

// =============================================================================
// LOADING COMPONENTS
// =============================================================================

const AppLoadingFallback = () => (
  <div className="verse-app-loading">
    <div className="verse-app-loading-content">
      <div className="verse-loading-mystical">
        <div className="verse-loading-orb"></div>
        <div className="verse-loading-ring"></div>
        <div className="verse-loading-particles">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <h2 className="verse-app-loading-title">✨ VERSE</h2>
      <p className="verse-app-loading-subtitle">Loading mystical experiences...</p>
    </div>
  </div>
);

const PageLoadingFallback = () => (
  <div className="verse-page-loading">
    <div className="verse-page-loading-spinner">
      <div className="verse-loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
);

// =============================================================================
// ROUTE PROTECTION COMPONENT
// =============================================================================

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const location = useLocation();
  
  // This will use the actual auth context when available
  // For now, we'll create a placeholder
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check - replace with actual auth logic
    const checkAuth = async () => {
      try {
        // Placeholder for actual auth check
        const token = localStorage.getItem('verse_token');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <AppLoadingFallback />;
  }

  // if (requireAuth && !isAuthenticated) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <ProtectedRoute requireAuth={false}>
            <MysticalLayout showSidebar={false} variant="compact">
              <Suspense fallback={<PageLoadingFallback />}>
                <Login />
              </Suspense>
            </MysticalLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <ProtectedRoute requireAuth={false}>
            <MysticalLayout showSidebar={false} variant="compact">
              <Suspense fallback={<PageLoadingFallback />}>
                <Register />
              </Suspense>
            </MysticalLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/" 
        element={
          <MysticalLayout showSidebar={false} variant="wide">
            <div className="verse-welcome-page">
              <div className="verse-welcome-content">
                <div className="verse-welcome-header">
                  <h1 className="verse-welcome-title">
                    ✨ VERSE
                  </h1>
                  <p className="verse-welcome-subtitle">
                    Where stories come alive through mystical choices and infinite possibilities
                  </p>
                  <p className="verse-welcome-tagline">
                    Virtual Experience Reactive Story Engine
                  </p>
                </div>
                
                <div className="verse-welcome-actions">
                  <button 
                    className="verse-welcome-button primary"
                    onClick={() => window.location.href = '/login'}
                  >
                    Enter the Mystical Realm
                  </button>
                  <button 
                    className="verse-welcome-button secondary"
                    onClick={() => window.location.href = '/register'}
                  >
                    Begin Your Epic Journey
                  </button>
                </div>

                <div className="verse-welcome-features">
                  <div className="verse-welcome-feature">
                    <div className="verse-welcome-feature-icon">📚</div>
                    <h3>Interactive Storytelling</h3>
                    <p>Experience immersive tales that respond and evolve based on your choices, creating unique narrative paths every time you explore.</p>
                  </div>
                  <div className="verse-welcome-feature">
                    <div className="verse-welcome-feature-icon">✍️</div>
                    <h3>AI-Powered Creation</h3>
                    <p>Craft your own mystical narratives with intelligent assistance, bringing your imagination to life through advanced storytelling tools.</p>
                  </div>
                  <div className="verse-welcome-feature">
                    <div className="verse-welcome-feature-icon">🌟</div>
                    <h3>Community & Discovery</h3>
                    <p>Connect with fellow storytellers, share your creations, and discover new worlds of wonder in our vibrant creative community.</p>
                  </div>
                </div>
              </div>
            </div>
          </MysticalLayout>
        } 
      />
      {/* Protected Routes - Will be uncommented as components are implemented */}
      
      <Route 
      path="/dashboard" 
      element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
      } 
    />
    
      <Route 
        path="/stories" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <StoryCreate />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      {/*
      <Route 
        path="/write" 
        element={
          <ProtectedRoute>
            <MysticalLayout>
              <Suspense fallback={<PageLoadingFallback />}>
                <StoryCreate />
              </Suspense>
            </MysticalLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/story/:id" 
        element={
          <ProtectedRoute>
            <MysticalLayout showSidebar={false} variant="wide">
              <Suspense fallback={<PageLoadingFallback />}>
                <StoryPlay />
              </Suspense>
            </MysticalLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <MysticalLayout>
              <Suspense fallback={<PageLoadingFallback />}>
                <Profile />
              </Suspense>
            </MysticalLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <MysticalLayout>
              <Suspense fallback={<PageLoadingFallback />}>
                <Settings />
              </Suspense>
            </MysticalLayout>
          </ProtectedRoute>
        } 
      />
      */}

      {/* Catch-all route for 404 */}
      <Route 
        path="*" 
        element={
          <MysticalLayout showSidebar={false} variant="compact">
            <div className="verse-404-page">
              <div className="verse-404-content">
                <div className="verse-404-icon">🌌</div>
                <h1 className="verse-404-title">Lost in the Void</h1>
                <p className="verse-404-message">
                  The page you seek has vanished into the mystical ether...
                </p>
                <button 
                  className="verse-404-button"
                  onClick={() => window.location.href = '/'}
                >
                  Return to the Realm
                </button>
              </div>
            </div>
          </MysticalLayout>
        } 
      />
    </Routes>
  );
};

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Initialize any global services here
        console.log('VERSE application initialized');
        
        setIsAppReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsAppReady(true); // Still show app even if init fails
      }
    };

    initializeApp();
  }, []);

  if (!isAppReady) {
    return <AppLoadingFallback />;
  }

  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <div className="verse-app">
                <AppRoutes />
                <AuthDebug />
              </div>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
};

export default App;