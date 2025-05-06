import { useCallback } from "react";
import { useAuthContext } from "src/auth/hooks";
import ExcelJS from 'exceljs'
import { getNow } from "./use-datejs";

export const useDownloadExcel = ({
  fileName,
}: {
  fileName?: string;
}) => {
  const { user } = useAuthContext();

  const download = useCallback((excelBuffer: ExcelJS.Buffer, name?: string) => {
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'})
    const downloadUrl = URL.createObjectURL(blob)
    const element = document.createElement('a');
    element.setAttribute('href', downloadUrl);
    const now = getNow({ organization: user?.member?.org! });
    element.setAttribute('download', `${name || fileName}_${now.format('YYYY-MM-DD')}.xlsx`);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }, [fileName, user]);

  return {
    download,
  };
};

