import {
  IonContent,
  IonLoading,
  IonPage,
} from '@ionic/react';
import './Loading.css';

const LoadingPage: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="loginBox">
        <IonLoading isOpen message="Loading..." />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoadingPage;
