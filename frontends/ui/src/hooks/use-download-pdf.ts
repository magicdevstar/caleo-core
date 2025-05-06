import { useCallback } from "react";
import { useAuthContext } from "src/auth/hooks";
import { getNow } from "./use-datejs";

export const useDownloadPdf = ({
  fileName,
}: {
  fileName?: string;
}) => {
  const { user } = useAuthContext();

  const download = useCallback((pdfBuffer: Uint8Array, name?: string) => {
    const blob = new Blob([pdfBuffer], { type: 'application/pdf'})
    const downloadUrl = URL.createObjectURL(blob)
    const element = document.createElement('a');
    element.setAttribute('href', downloadUrl);
    const now = getNow({ organization: user?.member?.org! });
    element.setAttribute('download', `${name || fileName}_${now.format('YYYY-MM-DD')}.pdf`);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }, [fileName, user]);

  return {
    download,
  };
};

