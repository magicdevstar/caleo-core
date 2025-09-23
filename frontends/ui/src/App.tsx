// @apollo/client
import { ApolloProvider } from '@apollo/client';

// scrollbar
import 'simplebar-react/dist/simplebar.min.css';

// map
import 'maplibre-gl/dist/maplibre-gl.css';

// image
import 'react-lazy-load-image-component/src/effects/blur.css';

// editor
import 'react-quill/dist/quill.snow.css';

// carousel
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// ----------------------------------------------------------------------

// @mui
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { LicenseInfo } from '@mui/x-license-pro';

// routes
import Router from 'src/routes/sections';
// theme
import ThemeProvider from 'src/theme';
// hooks
import { useScrollToTop } from 'src/hooks/use-scroll-to-top';
import { useIosScrollFix } from 'src/hooks/use-ios-scroll-fix';
// components
import ProgressBar from 'src/components/progress-bar';
import MotionLazy from 'src/components/animate/motion-lazy';
import { SettingsProvider, SettingsDrawer } from 'src/components/settings';
// auth
import { AuthProvider, AuthConsumer } from 'src/auth/context/amplify';
import { client } from './utils/apollo';
import { SnackbarProvider } from './components/snackbar';
import ErrorComponent from "./components/error/Error";
import { initG4 } from './utils/ga4';

// ----------------------------------------------------------------------

// MUI X License Key
LicenseInfo.setLicenseKey('0b119d6cb6188113472796c7ab220bf7Tz03OTI0MSxFPTE3MzIyOTU1NzQwMDAsUz1wcm8sTE09cGVycGV0dWFsLEtWPTI=');

// GA
initG4();

export default function App() {
  const charAt = `

  ░░░    ░░░
  ▒▒▒▒  ▒▒▒▒
  ▒▒ ▒▒▒▒ ▒▒
  ▓▓  ▓▓  ▓▓
  ██      ██

  `;

  console.info(`%c${charAt}`, 'color: #5BE49B');

  useScrollToTop();
  useIosScrollFix();


  return (
    <AuthProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SettingsProvider
          defaultSettings={{
            themeMode: 'dark', // 'light' | 'dark'
            themeDirection: 'ltr', //  'rtl' | 'ltr'
            themeContrast: 'default', // 'default' | 'bold'
            themeLayout: 'vertical', // 'vertical' | 'horizontal' | 'mini'
            themeColorPresets: 'blue', // 'default' | 'cyan' | 'purple' | 'blue' | 'orange' | 'red'
            themeStretch: true,
          }}
        >
          <ThemeProvider>
            <ApolloProvider client={client}>
              <MotionLazy>
                <SnackbarProvider>
                  <SettingsDrawer />
                  <ProgressBar />
                  <AuthConsumer>
                    <ErrorComponent>
                      <Router />
                    </ErrorComponent>
                  </AuthConsumer>
                </SnackbarProvider>
              </MotionLazy>
            </ApolloProvider>
          </ThemeProvider>
        </SettingsProvider>
      </LocalizationProvider>
    </AuthProvider>
  );
}
