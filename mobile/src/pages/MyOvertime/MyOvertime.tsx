import { useState } from 'react';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonLabel,
  IonMenuButton,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
} from '@ionic/react';
import './MyOvertime.css';
import EmptyView from '../../components/EmptyView/EmptyView';

const segments = [
  {
    value: 'assigned',
    label: 'Assigned',
  },
  {
    value: 'past',
    label: 'Past',
  },
];

const MyOvertime: React.FC<any> = () => {
  const [segment, setSegment] = useState(segments[0].value);

  return (
    <IonPage>
      <IonHeader collapse="fade">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonSegment value={segment} onIonChange={(event) => setSegment(event.detail.value as string)}>
            {segments.map(({ value, label }) => (
              <IonSegmentButton key={value} value={value}>
                <IonLabel>{label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
          <EmptyView title="No Overtime" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MyOvertime;
