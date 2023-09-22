import { useState, useCallback } from 'react';
// @mui
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
// components
import Iconify from 'src/components/iconify';
// types
import { FrontendUser } from 'src/api/user';
//
import AccountGeneral from './account-general';
import AccountSkills from './account-skills';
import AccountOvertime from './account-overtime';
import AccountChangePassword from './account-change-password';

// ----------------------------------------------------------------------

const TABS = [
  {
    value: 'general',
    label: 'General',
    icon: <Iconify icon="solar:user-id-bold" width={24} />,
  },
  {
    value: 'overtime',
    label: 'Overtime Availability',
    icon: <Iconify icon="solar:bell-bing-bold" width={24} />,
  },
  {
    value: 'skills',
    label: 'Skills',
    icon: <Iconify icon="solar:share-bold" width={24} />,
  },
  {
    value: 'security',
    label: 'Password',
    icon: <Iconify icon="ic:round-vpn-key" width={24} />,
  },
];

// ----------------------------------------------------------------------

export default function MainAccountView({
  excludePassword,
  adminViewer,
  user,
} : {
  user: FrontendUser;
  adminViewer: boolean;
  excludePassword?: boolean;
}) {
  
  const [currentTab, setCurrentTab] = useState('general');

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  return (
    <>
      <Tabs
        value={currentTab}
        onChange={handleChangeTab}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        {TABS.filter(({ value }) => excludePassword ? value !== 'security' : true).map((tab) => (
          <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
        ))}
      </Tabs>

      {currentTab === 'general' && <AccountGeneral adminViewer={adminViewer} user={user} />}

      {currentTab === 'overtime' && <AccountOvertime user={user} />}

      {currentTab === 'skills' && <AccountSkills user={user} />}

      {currentTab === 'security' && <AccountChangePassword />}
    </>
  );
}
