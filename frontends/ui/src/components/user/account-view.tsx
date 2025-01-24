import { useState, useCallback, useMemo } from 'react';
// @mui
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
// types
import { get } from 'lodash';
import { FrontendUser } from 'src/api/user';
import { MemberStatus } from 'src/__generated__/resolvers-types';
// components
import Iconify from 'src/components/iconify';
import AccountGeneral from './account-general';
import AccountSkills from './account-skills';
import AccountOvertime from './account-overtime';
import AccountChangePassword from './account-change-password';
import AccountNewPassword from './account-new-password';
import AccountLotteryAnalytics from './account-lottery-analytics';
import AccountEquipments from './account-equiptment';

// ----------------------------------------------------------------------

const TABS = [
  {
    value: 'general',
    label: 'General',
    visible: () => true,
    icon: <Iconify icon="solar:user-id-bold" width={24} />,
  },
  {
    value: 'overtime',
    label: 'Overtime Availability',
    visible: () => true,
    icon: <Iconify icon="solar:bell-bing-bold" width={24} />,
  },
  {
    value: 'skills',
    label: 'Skills',
    visible: () => true,
    icon: <Iconify icon="solar:share-bold" width={24} />,
  },
  {
    value: 'equipment',
    label: 'Equipment',
    visible: (canView = true) => canView,
    userKey: 'member.org.features.equipment',
    icon: <Iconify icon="ic:baseline-directions-car" width={24} />,
  },
  {
    value: 'lottoAnalytics',
    label: 'Lottery Analytics',
    visible: (canView = true) => canView,
    icon: <Iconify icon="ic:baseline-area-chart" width={24} />,
  },
  {
    value: 'security',
    label: 'Password',
    visible: () => true,
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

  let securityTab;
  if (currentTab === 'security') {
    securityTab = <AccountChangePassword />;
    if (excludePassword) {
      securityTab = <AccountNewPassword userId={user?.id} />;
    }
  }

  return (
    <>
      <Tabs
        value={currentTab}
        onChange={handleChangeTab}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        {TABS
          .filter(({userKey, visible}) => userKey ? visible(get(user, userKey)) : visible(adminViewer))
          .map((tab) => (
            <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
          ))
        }
      </Tabs>

      {currentTab === 'general' && <AccountGeneral adminViewer={adminViewer} user={user} allDisabled={allDisabled} />}

      {currentTab === 'overtime' && <AccountOvertime user={user} allDisabled={allDisabled} />}

      {currentTab === 'skills' && <AccountSkills adminViewer={adminViewer} user={user} allDisabled={allDisabled} />}

      {currentTab === 'equipment' && <AccountEquipments adminViewer={adminViewer} user={user} allDisabled={allDisabled} />}
      
      {currentTab === 'lottoAnalytics' && <AccountLotteryAnalytics user={user} />}

      {securityTab}
    </>
  );
}
