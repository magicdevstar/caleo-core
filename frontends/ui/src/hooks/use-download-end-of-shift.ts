import { useLazyQuery } from "@apollo/client";
import { GET_SHIFT_TABS } from "src/api/shifts";
import { generateFilledPDF } from "src/utils/generate-files/end-of-shift";

export const useEndOfShiftDownload = () => {
  const [getTabs] = useLazyQuery(GET_SHIFT_TABS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });

  const downloadEndOfShiftPDF = async (shiftId: string) => {
    try {
      const { data: { shiftTabs } } = await getTabs({
        variables: { id: shiftId },
      });
      const tabData: Record<string, any> = JSON.parse(shiftTabs.data);

      await generateFilledPDF({
        data: tabData,
        openTab: true,
        pdfPath: `${shiftTabs.orgId}/${shiftTabs.templateName || 'shift-close'}`,
      });
    } catch(error) {
      console.error("Error downloading end of shift report:", error);
    }
  };

  return {
    downloadEndOfShiftPDF,
  }
};
