import Box from "@mui/material/Box";
import { FrontendUser } from "src/api/user";
import LotteryAnalytics from "../analytics/lottery-analytics";

type Props = {
  user: FrontendUser;
};

export default function AccountLotteryAnalytics({ user }: Props) {
  return (
    <Box width="100%">
      <LotteryAnalytics userId={user.id} name={user.name} />
      
    </Box>
  )
}
