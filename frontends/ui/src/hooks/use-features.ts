import { OrganizationFeatures } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";

export interface IOrganizationFeatures extends OrganizationFeatures {
}

export const useFeatures = (): IOrganizationFeatures => {
  const { user } = useAuthContext();

  return user?.member?.org?.features! || {};
}