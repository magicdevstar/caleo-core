import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
// @mui
import Container from '@mui/material/Container';
// components
import { SplashScreen } from 'src/components/loading-screen';
import { lazyWithRetry } from 'src/utils/lazyRetry';
import { HeaderSimple as Header } from 'src/layouts/_common';

// ----------------------------------------------------------------------

// AMPLIFY
const EventRequest = lazyWithRetry(() => import('src/pages/externalRequest/eventRequest'));

// ----------------------------------------------------------------------

const externalRequests = {
  path: 'request',
  element: (
    <Suspense fallback={<SplashScreen />}>
      <Outlet />
    </Suspense>
  ),
  children: [
    {
      path: 'event',
      element: (
        <>
          <Header />

          <Container component="main">
            <EventRequest />
          </Container>
        </>
      ),
    },
  ],
};

export const externalRequestRoutes = [
  {
    path: 'external',
    children: [externalRequests],
  },
];
