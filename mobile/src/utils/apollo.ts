// Apollo
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Amplify
import Auth from './amplify';

// ----------------------------------------------------------------------

// config
import { APOLLO_API } from '../config-global';

// ----------------------------------------------------------------------

const httpLink = createHttpLink({
  uri: APOLLO_API,
});

const authLink = setContext(async (_, { headers }) => {
  // get the authentication token from local storage if it exists
  const session = await Auth.currentSession();
  const token = session.getIdToken().getJwtToken();
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
