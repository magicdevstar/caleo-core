// @mui
import Container from '@mui/material/Container/Container';
import { useSettingsContext } from 'src/components/settings';
import IncidentForm from '../incident-form/incident-form';


export default function IncidentFormView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ maxWidth: '100vw' }}>
      <IncidentForm />
    </Container>
  );
}
