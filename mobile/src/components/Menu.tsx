import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
} from '@ionic/react';

import { useLocation } from 'react-router-dom';
import {
  briefcase,
  calendar,
  time,
  personCircle,
} from 'ionicons/icons';
import './Menu.css';
import { useAuthContext } from '../auth/hooks';

interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  title: string;
}

const appPages: AppPage[] = [
  {
    title: 'My Overtime',
    url: '/dashboard',
    iosIcon: briefcase,
    mdIcon: briefcase
  },
  {
    title: 'Available Overtime',
    url: '/dashboard/available/overtime',
    iosIcon: calendar,
    mdIcon: calendar
  },
  {
    title: 'Upcoming Overtime',
    url: '/dashboard/upcoming/overtime',
    iosIcon: time,
    mdIcon: time
  },
  {
    title: 'Profile',
    url: '/dashboard/user',
    iosIcon: personCircle,
    mdIcon: personCircle
  },
];

const Menu: React.FC = () => {
  const { user } = useAuthContext();
  const location = useLocation();

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList id="inbox-list">
          <IonListHeader>{user?.name}</IonListHeader>
          <IonNote>{user?.member?.contactInfo?.primaryEmail?.address || '-'}</IonNote>
          {appPages.map((appPage, index) => {
            return (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem className={location.pathname === appPage.url ? 'selected' : ''} routerLink={appPage.url} routerDirection="none" lines="none" detail={false}>
                  <IonIcon aria-hidden="true" slot="start" ios={appPage.iosIcon} md={appPage.mdIcon} />
                  <IonLabel>{appPage.title}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
