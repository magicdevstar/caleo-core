import { useState, useCallback, useMemo } from 'react';
// @mui
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
// types
import { FrontendUser } from 'src/api/user';
import { MemberStatus } from 'src/__generated__/resolvers-types';
// components
import Iconify from 'src/components/iconify';
import AccountGeneral from './account-general';
import AccountSkills from './account-skills';
import AccountOvertime from './account-overtime';
import AccountChangePassword from './account-change-password';
import AccountNewPassword from './account-new-password';

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

  const allDisabled = useMemo(() => user?.member?.status === MemberStatus.Removed, [user?.member?.status])

  return (
    <>
      <Tabs
        value={currentTab}
        onChange={handleChangeTab}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
        ))}
      </Tabs>

      {currentTab === 'general' && <AccountGeneral adminViewer={adminViewer} user={user} allDisabled={allDisabled} />}

      {currentTab === 'overtime' && <AccountOvertime user={user} allDisabled={allDisabled} />}

      {currentTab === 'skills' && <AccountSkills adminViewer={adminViewer} user={user} allDisabled={allDisabled} />}

      {currentTab === 'security' && !excludePassword ? <AccountChangePassword /> : <AccountNewPassword userId={user?.id} />}
    </>
  );
}
