import { useCallback, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonMenuButton,
  IonPage,
  IonSpinner,
  IonToolbar
} from '@ionic/react';
import './Login.css';
import { useAuthContext } from '../../auth/hooks';
import { useHistory } from 'react-router-dom';

const Login: React.FC = () => {
  const history = useHistory();
  const { login } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    data: {
      email: '',
      password: '',
    },
    touched: {
      email: false,
      password: false,
    },
    errors: {
      email: false,
      password: false,
    },
  });

  const validForm = !form.errors.email;

  const submit = useCallback(async () => {
    if (!form.errors.email) {
      setLoading(true);
      try {
        await login(form.data.email, form.data.password);
        history.push('/');
      } catch(error) {
        setForm((f) => ({
          ...f,
          errors: {
            ...f.errors,
            password: true,
          },
        }))
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  }, [form, setForm, history]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="loginBox">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Login</IonCardTitle>
              <IonCardSubtitle>Enter your email and password</IonCardSubtitle>
            </IonCardHeader>

            <IonCardContent>
              <IonList lines="none">
                <IonItem>
                  <IonInput
                    className={`${!form.errors.email && 'ion-valid'} ${form.errors.email && 'ion-invalid'} ${form.touched.email && 'ion-touched'}`}
                    label="Email"
                    labelPlacement="floating"
                    placeholder="Email"
                    errorText="Invalid email"
                    onIonBlur={() => {
                      setForm((f) => ({
                        ...f,
                        touched: {
                          ...f.touched,
                          email: true,
                        }
                      }));
                    }}
                    onIonInput={(e) => {
                      const emailCheck = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
                      const validEmail = emailCheck.test(e.detail.value || '');
                      setForm((f) => ({
                        ...f,
                        data: {
                          ...f.data,
                          email: e.detail.value || '',
                        },
                        errors: {
                          ...f.errors,
                          email: !validEmail,
                        }
                      }))
                    }}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    className={`${!form.errors.password && 'ion-valid'} ${form.errors.password && 'ion-invalid'} ${form.touched.password && 'ion-touched'}`}
                    label="Password"
                    type="password"
                    labelPlacement="floating"
                    placeholder="Password"
                    errorText="Invalid email or password. Please try again."
                    onIonBlur={() => {
                      setForm((f) => ({
                        ...f,
                        touched: {
                          ...f.touched,
                          password: true,
                        },
                        errors: {
                          ...f.errors,
                          password: false,
                        },
                      }));
                    }}
                    onIonChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        data: {
                          ...f.data,
                          password: e.detail.value || '',
                        },
                      }))
                    }}
                  />
                </IonItem>
                <IonItem>
                  <IonButton
                    disabled={!validForm}
                    color="primary"
                    expand="block"
                    className='submitButton'
                    onClick={submit}
                  >
                    {loading && <IonSpinner slot='start' name="circular" />}
                    Login
                  </IonButton>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
