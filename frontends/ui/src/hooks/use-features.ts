import { useMemo } from "react";
import { OrganizationFeatures } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";

export interface IOrganizationFeatures extends OrganizationFeatures {
  enabledEventThumbnail: boolean;
}

export const useFeatures = (): IOrganizationFeatures => {
  const { user } = useAuthContext();
  const features: IOrganizationFeatures = useMemo(() => {
    if (!user?.member?.org?.flatFeatures) {
      return {};
    }
    try {
      const parsed = JSON.parse(user.member.org.flatFeatures);
      return parsed;
    } catch (error) {
      return {};
    }
  }, [user?.member?.org?.flatFeatures]);

  return {
    ...features,
    enabledEventThumbnail: ('allowThumbnail' in (user?.member?.org?.settings?.eventSettings || {})) ?
      user?.member?.org?.settings?.eventSettings?.allowThumbnail! : false,
  };
}