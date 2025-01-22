import { MemberRole, MemberTier } from "src/__generated__/resolvers-types";

export const tierNames = {
  [MemberTier.Tier_1]: 'Tier 1',
  [MemberTier.Tier_2]: 'Tier 2',
};

export const roleNames = {
  [MemberRole.Admin]: 'Admin',
  [MemberRole.Member]: 'Member',
}
