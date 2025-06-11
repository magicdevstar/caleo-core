import Container from "@mui/material/Container";
import { useSettingsContext } from "src/components/settings";
import OutsideUserTable from "../outsideUser/outside-user-table";

export default function OutsideUsersView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ pb: { xs: 1, md: 2, lg: 4 } }}>
      <OutsideUserTable />
    </Container>
  );
}
