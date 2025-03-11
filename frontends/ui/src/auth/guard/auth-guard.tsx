import { useEffect, useCallback, useState } from 'react';
import { isEmpty } from 'lodash';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// hooks
import { useFeatures } from 'src/hooks/use-features';
//
import { MemberStatus } from 'src/__generated__/resolvers-types';
import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

const loginPaths: Record<string, string> = {
  amplify: paths.auth.amplify.login,
};

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const router = useRouter();

  const { user, authenticated, method } = useAuthContext();
  const { lasdUserFields } = useFeatures();

  const [checked, setChecked] = useState(false);

  const check = useCallback(() => {
    if (!authenticated) {
      const searchParams = new URLSearchParams({
        returnTo: window.location.pathname,
      }).toString();
      
      const loginPath = loginPaths[method];

      const href = `${loginPath}?${searchParams}`;

      router.replace(href);
    } else if ([MemberStatus.Pending, MemberStatus.Inactive, MemberStatus.Removed].includes(user.member.status || MemberStatus.Inactive)) {
      router.replace(paths.notApproved);
    } else if (
      lasdUserFields &&
      (
        isEmpty(user.member.rank) ||
        isEmpty(user.member.unit) ||
        isEmpty(user.member.division) ||
        isEmpty(user.member.contactInfo?.primaryPhone?.number)
      )
    ) {
      router.replace(paths.lasdCompleteProfile);
    } else {
      setChecked(true);
    }
  }, [authenticated, lasdUserFields, method, router, user]);

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) {
    return null;
  }

  return <>{children}</>;
}
