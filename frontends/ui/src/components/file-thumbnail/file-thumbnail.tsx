import { useState, useEffect } from 'react';
import { Theme, SxProps } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
//
import { useBoolean } from 'src/hooks/use-boolean';
import { fileData, fileFormat, fileThumb, fileNameByUrl } from './utils';
import DownloadButton from './download-button';
import { IFileDetails, PreviewDialog } from '../preview/preview-dialog';

// ----------------------------------------------------------------------

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
  const dialog = useBoolean<IFileDetails>();
  const { name = '', path = '', preview = '', type } = fileData(file);
  const [realFormat, setRealFormat] = useState<string | null>(null);
  const fileName = fileNameByUrl(name);

  useEffect(() => {
    setRealFormat(null);
    if (typeof file === 'string' || (typeof file !== 'string' && file?.type === '')) {
      const url = typeof file === 'string' ? file : file.name;
      const fetchType = (retries: number, delay: number) => {
        fetch(url)
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
            onClick={() => dialog.onTrue({ format, fileName, url: preview })}
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
            onClick={() => dialog.onTrue({ format, fileName, url: preview })}
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
      <PreviewDialog controller={dialog} />
    </>
  );

  if (tooltip) {
    return (
      <Tooltip title={fileName}>
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
      <Typography
        variant="caption"
        sx={{
          marginTop: 'auto',
          background: (theme) => theme.palette.background.paper,
          pb: 1,
          pt: 1,
          zIndex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {fileName}
      </Typography>
    </>
  );
}
