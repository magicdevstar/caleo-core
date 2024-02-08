import LoadingButton from "@mui/lab/LoadingButton";
import { ConfirmDialog } from "src/components/custom-dialog";
import { useBrowserNotification } from "src/hooks/use-browser-notification";

export default function NotificationRequestModal() {
  const { canRequest, requesting, requestPermission } = useBrowserNotification();

  if (!canRequest) return null;

  return (
    <ConfirmDialog
      open={canRequest}
      onClose={() => {
        requestPermission();
      }}
      hasCancel={false}
      title="Turn on Notifications"
      content="Know right away when you have been assigned a shift or when new shifts are available."
      action={
        <LoadingButton loading={requesting} variant="contained" color="info" onClick={requestPermission}>
          Turn on
        </LoadingButton>
      }
    />
  );
}
