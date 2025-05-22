import { IMemberSkill } from "../../../models/memberSkill";
import { ISkill } from "../../../models/skill";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  Skill: {
    ...commonResolvers,
    org: (skill: ISkill, _, { organizations }: Context) => organizations.loader.load(skill.orgId.toString()),
    ranksOnly: (skill: ISkill, _, { ranks }: Context) => skill.rankOnlyIds && skill.rankOnlyIds.length > 0 ? ranks.loader.loadMany((skill.rankOnlyIds || []).map((id) => id.toString())) : [],
  },
  MemberSkill: {
    ...commonResolvers,
    skill: (memberSkill: IMemberSkill, _, { skills }: Context) => skills.loader.load(memberSkill.skillId.toString()),
    user: (memberSkill: IMemberSkill, _, { users }: Context) => users.loader.load(memberSkill.userId.toString()),
    image: (memberSkill: IMemberSkill, _, { memberSkills }: Context) => memberSkill.imagePath ? memberSkills.getDownloadUrl(memberSkill.imagePath!) : null,
  },
};
