import { IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import Menu from './components/Menu';
import Page from './pages/Page';
import Login from './pages/Login';
import { useAuthContext } from './auth/hooks';
import LoadingPage from './pages/Loading';
import MyOvertime from './pages/MyOvertime/MyOvertime';

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
          <Redirect to="/dashboard" />
        </Route>
        <Route
          path="/dashboard"
          exact={true}
          render={(params: any) => authenticated ? (<MyOvertime {...params} />) : (<Redirect to="/login" />)}
        />
        <Route
          path="/dashboard/available/overtime"
          exact={true}
          render={(params: any) => authenticated ? (<Page {...params} />) : (<Redirect to="/login" />)}
        />
        <Route
          path="/dashboard/upcoming/overtime"
          exact={true}
          render={(params: any) => authenticated ? (<Page {...params} />) : (<Redirect to="/login" />)}
        />
        <Route
          path="/dashboard/user"
          exact={true}
          render={(params: any) => authenticated ? (<Page {...params} />) : (<Redirect to="/login" />)}
        />
        <Route path="/login" exact={true}>
          <Login />
        </Route>
        <Redirect to="/dashboard" />
      </IonRouterOutlet>
    </IonSplitPane>
  )
};

export default Routes;
