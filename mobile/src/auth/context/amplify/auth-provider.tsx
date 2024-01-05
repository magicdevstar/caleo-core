import { useEffect, useReducer, useCallback, useMemo } from 'react';
// config
import Auth, { customStorage } from '../../../utils/amplify';
import { client } from '../../../utils/apollo';
import { FrontendUser, ME } from '../../../api/user';
import { User } from '../../../__generated__/resolvers-types';
//
import { AuthContext } from './auth-context';
import { ActionMapType, AuthStateType } from '../../types';

// ----------------------------------------------------------------------

// NOTE:
// We only build demo at basic level.
// Customer will need to do some extra handling yourself if you want to extend the logic and other features...

// ----------------------------------------------------------------------

enum Types {
  INITIAL = 'INITIAL',
  LOGOUT = 'LOGOUT',
  UPDATE_PROFILE_PHOTO = 'UPDATE_PROFILE_PHOTO',
}

type Payload = {
  [Types.INITIAL]: {
    user: FrontendUser | null;
  }
  [Types.UPDATE_PROFILE_PHOTO]: {
    photoURL: string;
  };
  [Types.LOGOUT]: undefined;
};

type Action = ActionMapType<Payload>[keyof ActionMapType<Payload>];

const initialState: AuthStateType = {
  user: null,
  loading: true,
};

const reducer = (state: AuthStateType, action: Action) => {
  if (action.type === Types.INITIAL) {
    if(window && (window as any).Beacon) {
      (window as any).Beacon('identify', {
        email: action.payload.user?.email,
        name: action.payload.user?.displayName,
      });
    }

    return {
      loading: false,
      user: action.payload.user,
    };
  }
  if (action.type === Types.UPDATE_PROFILE_PHOTO) {
    return {
      ...state,
      user: {
        ...(state.user || {}),
        profileURL: action.payload.photoURL,
      },
    };
  }
  if (action.type === Types.LOGOUT) {
    if(window && (window as any).Beacon) {
      (window as any).Beacon('logout');
    }
    return {
      ...state,
      user: null,
    };
  }
  return state;
};

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initialize = useCallback(async () => {
    try {
      // Sync preferences with memory storage
      await customStorage.sync();
      const currentUser = await Auth.currentAuthenticatedUser();
      const { data: { me } } = await client.query<{ me: User }>({
        query: ME,
      });
      if (currentUser) {
        dispatch({
          type: Types.INITIAL,
          payload: {
            user: {
              ...currentUser,
              ...me,
              id: me.id,
              displayName: `${me.firstName} ${me.lastName}`,
              email: currentUser.attributes.email,
              photoURL: me.image,
              role: me.member.role?.toLowerCase(),
            },
          },
        });
      } else {
        dispatch({
          type: Types.INITIAL,
          payload: {
            user: null,
          },
        });
      }
    } catch (error) {
      console.error(error);
      dispatch({
        type: Types.INITIAL,
        payload: {
          user: null,
        },
      });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // LOGIN
  const login = useCallback(async (email: string, password: string) => {
    const currentUser = await Auth.signIn(email, password);

    const { data: { me } } = await client.query<{ me: User }>({
      query: ME,
    });

    // TODO: Fetch user from our backend
    dispatch({
      type: Types.INITIAL,
      payload: {
        user: {
          ...currentUser,
          ...me,
          id: me.id,
          displayName: `${me.firstName} ${me.lastName}`,
          email: currentUser.attributes.email,
          photoURL: me.image,
          role: me.member.role?.toLowerCase(),
        },
      },
    });
  }, []);

  // REGISTER
  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string, phoneNumber: string, pNumber: string, orgId: string) => {
      await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          given_name: firstName,
          family_name: lastName,
          'custom:org_id': orgId,
          phone_number: `+${phoneNumber}`,
          'custom:p_number': pNumber,
        },
      });
      // TODO: Fetch user from our backend
    },
    []
  );

  // CONFIRM REGISTER
  const confirmRegister = useCallback(async (email: string, code: string) => {
    await Auth.confirmSignUp(email, code);
  }, []);

  // RESEND CODE REGISTER
  const resendCodeRegister = useCallback(async (email: string) => {
    await Auth.resendSignUp(email);
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    await Auth.signOut();
    dispatch({
      type: Types.LOGOUT,
    });
  }, []);

  // FORGOT PASSWORD
  const forgotPassword = useCallback(async (email: string) => {
    await Auth.forgotPassword(email);
  }, []);

  // NEW PASSWORD
  const newPassword = useCallback(async (email: string, code: string, password: string) => {
    await Auth.forgotPasswordSubmit(email, code, password);
  }, []);

  // Update profile photo
  const updateProfilePhotoUrl = useCallback((photoURL: string) => {
    dispatch({
      type: Types.UPDATE_PROFILE_PHOTO,
      payload: {
        photoURL,
      }
    });
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      method: 'amplify',
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      //
      login,
      logout,
      register,
      newPassword,
      forgotPassword,
      confirmRegister,
      resendCodeRegister,
      updateProfilePhotoUrl,
    }),
    [
      status,
      state.user,
      //
      login,
      logout,
      register,
      newPassword,
      forgotPassword,
      confirmRegister,
      resendCodeRegister,
      updateProfilePhotoUrl,
    ]
  );

  return <AuthContext.Provider value={memoizedValue as any}>{children}</AuthContext.Provider>;
}
