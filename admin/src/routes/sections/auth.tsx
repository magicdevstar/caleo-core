import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
// auth
import { GuestGuard } from 'src/auth/guard';
// layouts
import CompactLayout from 'src/layouts/compact';
import AuthModernLayout from 'src/layouts/auth/modern';
// components
import { SplashScreen } from 'src/components/loading-screen';
import { lazyWithRetry } from 'src/utils/lazyRetry';

// ----------------------------------------------------------------------

// AMPLIFY
const AmplifyLoginPage = lazyWithRetry(() => import('src/pages/auth/amplify/login'));
const AmplifyRegisterPage = lazyWithRetry(() => import('src/pages/auth/amplify/register'));
const AmplifyVerifyPage = lazyWithRetry(() => import('src/pages/auth/amplify/verify'));
const AmplifyNewPasswordPage = lazyWithRetry(() => import('src/pages/auth/amplify/new-password'));
const AmplifyForgotPasswordPage = lazyWithRetry(
  () => import('src/pages/auth/amplify/forgot-password')
);

// ----------------------------------------------------------------------

const authAmplify = {
  path: '',
  element: (
    <GuestGuard>
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    </GuestGuard>
  ),
  children: [
    {
      path: 'login',
      element: (
        <AuthModernLayout>
          <AmplifyLoginPage />
        </AuthModernLayout>
      ),
    },
    {
      path: 'register',
      element: (
        <AuthModernLayout>
          <AmplifyRegisterPage />
        </AuthModernLayout>
      ),
    },
    {
      element: (
        <CompactLayout>
          <Outlet />
        </CompactLayout>
      ),
      children: [
        { path: 'verify', element: <AmplifyVerifyPage /> },
        { path: 'new-password', element: <AmplifyNewPasswordPage /> },
        { path: 'forgot-password', element: <AmplifyForgotPasswordPage /> },
      ],
    },
  ],
};

export const authRoutes = [
  {
    path: 'auth',
    children: [authAmplify],
  },
];
