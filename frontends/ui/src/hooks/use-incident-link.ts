import { useCallback } from "react";
import copy from "copy-to-clipboard";
import { useSnackbar } from "notistack";
import { useRouter } from "src/routes/hooks";

export const useIncidentLinks = (eventId?: string) => {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const copyLink = useCallback(() => {
    copy(`${window.location.origin}/dashboard/incident/${eventId}/form`);
    enqueueSnackbar('Invite link copied to clipboard', { variant: 'success', autoHideDuration: 3000 });
  }, [eventId, enqueueSnackbar]);

  const copyLinkById = useCallback((eId: string) => {
    copy(`${window.location.origin}/dashboard/incident/${eId}/form`);
    enqueueSnackbar('Invite link copied to clipboard', { variant: 'success', autoHideDuration: 3000 });
  }, [enqueueSnackbar]);

  const getHref = useCallback((eId: string) =>
    `/dashboard/incident/${eId}/form`, []);

  const goToForm = useCallback((eId: string) => {
    router.push(getHref(eId));
  }, [router, getHref]);

  const go = useCallback(() => {
    if (eventId) {
      router.push(getHref(eventId));
    }
  }, [eventId, router, getHref]);


  return {
    copyLinkById,
    copyLink,
    href: `/dashboard/incident/${eventId}/form`,
    getHref,
    goToForm,
    go,
  };
};