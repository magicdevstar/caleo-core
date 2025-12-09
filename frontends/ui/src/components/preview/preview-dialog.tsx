import { useState, useEffect } from 'react';
// @mui
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
// components
import { Document, Page, pdfjs } from 'react-pdf';
import Iconify from "src/components/iconify";
// hooks
import { UseBooleanReturnType } from "src/hooks/use-boolean";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


export interface IFileDetails {
  fileName?: string;
  format: string;
  url: string;
}

interface IProps {
  controller: UseBooleanReturnType<IFileDetails>;
}

export const PreviewDialog = ({ controller }: IProps) => {
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(false);
  }, [controller.attribute?.url]);

  if (!controller.attribute?.url) {
    return null;
  }

  const handleDownload = () => {
    const url = controller.attribute?.url;
    const providedFileName = controller.attribute?.fileName;
    if (!url) return;

    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;

        const urlFileName = url.split('?')[0].split('/').pop() || 'download';
        let fileName = urlFileName;

        if (providedFileName) {
          fileName = providedFileName;
          const parts = urlFileName.split('.');
          const extension = parts.length > 1 ? parts.pop() : '';
          if (extension && !fileName.endsWith(`.${extension}`)) {
            fileName = `${fileName}.${extension}`;
          }
        }

        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => console.error('Error downloading file:', error));
  };
  
  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={controller.value}
      onClose={() => controller.onFalse()}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={handleDownload}>
          <Iconify icon="eva:download-fill" />
        </IconButton>
        <IconButton onClick={() => controller.onFalse()}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ height: '75vh', overflow: 'hidden' }}>
        {controller.attribute?.format === 'pdf' ? (
          <TransformWrapper
            minScale={0.5}
            key={`${controller.attribute?.url}-${pageLoaded}`}
          >
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
              }}
            >
              <Document file={controller.attribute?.url}>
                <Page
                  pageNumber={1}
                  onLoadSuccess={() => setPageLoaded(true)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <Box
            component="img"
            src={controller.attribute?.url}
            sx={{
              width: 1,
              height: 1,
              objectFit: 'contain',
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
};
