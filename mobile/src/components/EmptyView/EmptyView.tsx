import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonIcon } from '@ionic/react';
import './EmptyView.css';
import { sad } from 'ionicons/icons';

interface ContainerProps {
  title: string;
  subtitle?: string;
}

const EmptyView: React.FC<ContainerProps> = ({ title, subtitle }) => {
  return (
    <IonCard id="empty-container">
      <IonCardHeader>
        <IonCardTitle>{title}</IonCardTitle>
        {subtitle && <IonCardSubtitle>{subtitle}</IonCardSubtitle>}
      </IonCardHeader>
      <IonCardContent>
        <IonIcon id="empty-view-icon" icon={sad} size="large"></IonIcon>
      </IonCardContent>
    </IonCard>
  );
};

export default EmptyView;
