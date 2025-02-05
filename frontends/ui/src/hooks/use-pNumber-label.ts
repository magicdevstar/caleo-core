import { useState } from "react";
import { useAuthContext } from "src/auth/hooks"

export const usePNumberLabel = () => {
  const { user } = useAuthContext();
  const [label] = useState<string>(user.member.org?.customizations?.pNumber!);
  return {
    pNumberLabel: label,
  };
};
