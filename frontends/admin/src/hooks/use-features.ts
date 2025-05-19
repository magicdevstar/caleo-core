import { OrganizationFeatures } from 'src/__generated__/resolvers-types';
import { useAuthContext } from 'src/auth/hooks';

export const useFeatures = (): OrganizationFeatures => {
  const { user } = useAuthContext();

  return user.member.org?.features!;
};
