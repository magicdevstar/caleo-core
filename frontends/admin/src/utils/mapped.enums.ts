import { MemberRole, MemberTier } from 'src/__generated__/resolvers-types';

export const tierNames = {
  [MemberTier.Tier_1]: 'Tier 1',
  [MemberTier.Tier_2]: 'Tier 2',
  [MemberTier.Tier_3]: 'Tier 3',
  [MemberTier.Tier_4]: 'Tier 4',
};

export const roleNames = {
  [MemberRole.Admin]: 'Admin',
  [MemberRole.Member]: 'Member',
};
