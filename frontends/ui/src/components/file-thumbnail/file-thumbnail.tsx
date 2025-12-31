import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Theme, SxProps, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
//
import { useBoolean } from 'src/hooks/use-boolean';
import Iconify from 'src/components/iconify';
import { fileData, fileFormat, fileThumb, fileNameByUrl } from './utils';
import DownloadButton from './download-button';
import { IFileDetails, PreviewDialog } from '../preview/preview-dialog';
import { CustomFile } from '../upload/types';
import { varFade } from '../animate';

// ----------------------------------------------------------------------

type FileIconProps = {
  file: File | string;
  imageView?: boolean;
  onDownload?: VoidFunction;
  onRemove?: (file: CustomFile | string) => void;
  sx?: SxProps<Theme>;
  imgSx?: SxProps<Theme>;
};

export default function FileThumbnail({
  file,
  imageView,
  onDownload,
  onRemove,
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
            component="img"
            src={fileThumb(format)}
            sx={{
              width: 1,
              height: 1,
              flexShrink: 0,
              objectFit: 'cover',
              ...imgSx,
            }}
          />
        )
      }
      <PreviewDialog controller={dialog} />
    </>
  );

  return (
    <Stack
      component={m.div}
      {...varFade().inUp}
      onClick={() => dialog.onTrue({ format, fileName, url: preview })}
      alignItems="center"
      display="inline-grid"
      justifyContent="center"
      sx={{
        m: 0.5,
        width: 80,
        height: 80,
        borderRadius: 1.25,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.16)}`,
        ...sx,
      }}
    >
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
          position: 'absolute',
          bottom: 0,
        }}
      >
        {fileName}
      </Typography>

      {onRemove && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file)
          }}
          sx={{
            p: 0.5,
            top: 4,
            right: 4,
            position: 'absolute',
            color: 'common.white',
            bgcolor: (theme) => alpha(theme.palette.grey[900], 0.48),
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.grey[900], 0.72),
            },
          }}
        >
          <Iconify icon="mingcute:close-line" width={14} />
        </IconButton>
      )}
    </Stack>
  );
}
