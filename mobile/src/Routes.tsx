import { IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import Menu from './components/Menu';
import Page from './pages/Page';
import Login from './pages/Login';
import { useAuthContext } from './auth/hooks';
import LoadingPage from './pages/Loading';

const Routes: React.FC = () => {
  const { authenticated, loading } = useAuthContext();

  if (loading) {
    return <LoadingPage />
  }

  return (
    <IonSplitPane contentId="main">
      {authenticated && <Menu />}
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
          <Login />
        </Route>
      </IonRouterOutlet>
    </IonSplitPane>
  )
};

export default Routes;
