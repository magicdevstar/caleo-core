import { IonApp, IonRouterOutlet, IonSplitPane, setupIonicReact } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import Menu from './components/Menu';
import Page from './pages/Page';
import { useAuthContext } from './auth/hooks';

const Routes: React.FC = () => {
  const { authenticated } = useAuthContext();

  return (
    <IonSplitPane contentId="main">
      <Menu />
      <IonRouterOutlet id="main">
        <Route path="/" exact={true}>
          <Redirect to="/folder/Inbox" />
        </Route>
        <Route
          path="/folder/:name"
          exact={true}
          render={(params: any) => authenticated ? (<Page {...params} />) : (<Redirect to="/login" />)}
        />
        <Route path="/login" exact={true}>
          <Page title="Login" />
        </Route>
      </IonRouterOutlet>
    </IonSplitPane>
  )
};

export default Routes;
