import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import { ChineseLoading } from './components/ui/ChineseLoading';
import './index.css';

// 路由级代码分割 - 使用React.lazy动态导入页面组件
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const WuxingAnalysisPage = lazy(() => import('./pages/WuxingAnalysisPage'));
const BaziDetailsPage = lazy(() => import('./pages/BaziDetailsPage'));

// 懒加载包装组件 - 提供统一的加载状态
const LazyPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[60vh]">
      <ChineseLoading size="lg" text="页面加载中..." />
    </div>
  }>
    {children}
  </Suspense>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<LazyPage><HomePage /></LazyPage>} />
              <Route path="/login" element={<LazyPage><LoginPage /></LazyPage>} />
              <Route path="/register" element={<LazyPage><RegisterPage /></LazyPage>} />
              <Route path="/profile" element={
                <LazyPage>
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                </LazyPage>
              } />
              <Route path="/analysis" element={
                <LazyPage>
                  <ProtectedRoute>
                    <AnalysisPage />
                  </ProtectedRoute>
                </LazyPage>
              } />
              <Route path="/history" element={
                <LazyPage>
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                </LazyPage>
              } />
              <Route path="/wuxing" element={
                <LazyPage>
                  <ProtectedRoute>
                    <WuxingAnalysisPage />
                  </ProtectedRoute>
                </LazyPage>
              } />
              <Route path="/bazi" element={
                <LazyPage>
                  <ProtectedRoute>
                    <BaziDetailsPage />
                  </ProtectedRoute>
                </LazyPage>
              } />
              {/* /bazi-details 已合并到 /bazi，保留向后兼容的 redirect */}
            </Routes>
          </Layout>
          <Toaster position="top-right" richColors />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;