import { useMemo } from "react";
import { MemberTier } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks"

export const useTiers = () => {
  const { user } = useAuthContext();

  const returnValue = useMemo(() => {
    const allTiers = [
      MemberTier.Tier_1,
      MemberTier.Tier_2,
      MemberTier.Tier_3,
      MemberTier.Tier_4,
    ];

    const enabledTiers = allTiers.filter((tier) => user.member.org?.customizations?.tiers[tier].enabled);

    const tierNames = enabledTiers.reduce((acc, tier) => ({
      ...acc,
      [tier]: user.member.org?.customizations?.tiers[tier].label,
    }), {} as Record<MemberTier, string>);

    const tierFilters = enabledTiers.map((tier) => ({
      label: tierNames[tier],
      value: tier,
    }));

    const getTierFilter = () => Promise.resolve(tierFilters);

    return {
      tierNames,
      enabledTiers,
      tierFilters,
      getTierFilter
    }
  }, [user.member.org?.customizations]);

  return returnValue;
};
