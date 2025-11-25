import { useState, useEffect } from 'react';
import { Theme, SxProps } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { Document, Page, pdfjs } from 'react-pdf';
//
import { useBoolean } from 'src/hooks/use-boolean';
import { fileData, fileFormat, fileThumb } from './utils';
import DownloadButton from './download-button';

// ----------------------------------------------------------------------

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FileIconProps = {
  file: File | string;
  tooltip?: boolean;
  imageView?: boolean;
  onDownload?: VoidFunction;
  sx?: SxProps<Theme>;
  imgSx?: SxProps<Theme>;
};

export default function FileThumbnail({
  file,
  tooltip,
  imageView,
  onDownload,
  sx,
  imgSx,
}: FileIconProps) {
  const dialog = useBoolean();
  const { name = '', path = '', preview = '', type } = fileData(file);
  const [realFormat, setRealFormat] = useState<string | null>(null);

  useEffect(() => {
    setRealFormat(null);
    if (typeof file !== 'string' && file?.type === '') {
      const fetchType = (retries: number, delay: number) => {
        fetch(file.name)
          .then((response) => {
            const contentType = response.headers.get('Content-Type');
            if (contentType?.includes('application/pdf')) {
              setRealFormat('pdf');
            } else if (contentType?.includes('image')) {
              setRealFormat('image');
            }
          })
          .catch((error) => {
            if (retries > 0) {
              setTimeout(() => fetchType(retries - 1, delay * 2), delay);
            } else {
              console.error('Error fetching file type:', error);
            }
          });
      };

      fetchType(3, 500);
    }
  }, [file]);

  const format = realFormat || (type === 'application/pdf' ? 'pdf' : fileFormat(path || preview));

  const renderContent = (
    <>
      {
        (format === 'image' && imageView || (preview.includes('.s3.us-west-2.amazonaws.com') && format !== 'pdf')) ? (
          <Box
            onClick={() => dialog.onTrue()}
            component="img"
            src={preview}
            sx={{
              width: 1,
              height: 1,
              flexShrink: 0,
              objectFit: 'cover',
              ...imgSx,
            }}
          />
        ) : (
          <Box
            onClick={() => dialog.onTrue()}
            component="img"
            src={fileThumb(format)}
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              ...sx,
            }}
          />
        )
      }
      <Dialog
        fullWidth
        maxWidth="md"
        open={dialog.value}
        onClose={() => dialog.onFalse()}
      >
        <DialogContent>
          {format === 'pdf' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Document file={preview}>
                <Page pageNumber={1} />
              </Document>
            </Box>
          ) : (
            <Box
              component="img"
              src={preview}
              sx={{
                width: 1,
                height: 1,
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  if (tooltip) {
    return (
      <Tooltip title={name}>
        <Stack
          flexShrink={0}
          component="span"
          alignItems="center"
          justifyContent="center"
          sx={{
            width: 'fit-content',
            height: 'inherit',
          }}
        >
          {renderContent}
          {onDownload && <DownloadButton onDownload={onDownload} />}
        </Stack>
      </Tooltip>
    );
  }

  return (
    <>
      {renderContent}
      {onDownload && <DownloadButton onDownload={onDownload} />}
    </>
  );
}
