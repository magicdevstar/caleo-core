import { useCallback } from "react";
import { useAuthContext } from "src/auth/hooks";
import { getNow } from "./use-datejs";

const escapeStr = (str: string) => {
  // Replace all double quotes with two double quotes
  str = str.replace(/"/g, '""');
  // Replace all newline characters with a backslash and an n
  str = str.replace(/\n/g, '\\n');
  // Replace all carriage return characters with a backslash and an r
  str = str.replace(/\r/g, '\\r');
  // Return the escaped string
  return str;
}

export const useDownloadCsv = ({
  fileName,
  ext = 'csv',
}: {
  fileName?: string;
  ext?: string;
}) => {
  const { user } = useAuthContext();

  const convertToCSV = (data: Record<string, any>[]) => {
    const array = [Object.keys(data[0]).join(",")];
    data.forEach((item) => {
      array.push(Object.values(item).map((it) => `"${escapeStr(it)}"`).join(","));
    });

    return array.join("\n");
  };

  const download = useCallback((data: Record<string, any>[], name?: string) => {
    const text = convertToCSV(data);
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    const now = getNow({ organization: user?.member?.org! });
    element.setAttribute('download', `${name || fileName}_${now.format('YYYY-MM-DD')}.${ext}`);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }, [fileName, ext, user]);

  return {
    download,
  };
};

