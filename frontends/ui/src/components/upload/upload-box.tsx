import { useDropzone } from 'react-dropzone';
// @mui
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
//
import Iconify from '../iconify';
import Image from '../image';
//
import { UploadProps, CustomFile } from './types';

// ----------------------------------------------------------------------

export default function UploadBox({ placeholder, error, disabled, file, files, sx, ...other }: UploadProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    disabled,
    ...other,
  });

  const hasError = isDragReject || error;
  
  // Check if we have a file to display (either single file or first file from files array)
  const fileToDisplay = file || (files && files.length > 0 ? files[0] : null);
  const hasFile = !!fileToDisplay;
  
  // Get the preview URL
  const previewUrl = typeof fileToDisplay === 'string' 
    ? fileToDisplay 
    : (fileToDisplay as CustomFile)?.preview || (fileToDisplay ? URL.createObjectURL(fileToDisplay as File) : null);

  return (
    <Box
      {...getRootProps()}
      sx={{
        m: 0.5,
        width: 64,
        height: 64,
        flexShrink: 0,
        display: 'flex',
        borderRadius: 1,
        cursor: 'pointer',
        alignItems: 'center',
        color: 'text.disabled',
        justifyContent: 'center',
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
        border: (theme) => `dashed 1px ${alpha(theme.palette.grey[500], 0.16)}`,
        position: 'relative',
        overflow: 'hidden',
        ...(isDragActive && {
          opacity: 0.72,
        }),
        ...(disabled && {
          opacity: 0.48,
          pointerEvents: 'none',
        }),
        ...(hasError && {
          color: 'error.main',
          bgcolor: 'error.lighter',
          borderColor: 'error.light',
        }),
        ...(hasFile && {
          border: 'none',
          bgcolor: 'transparent',
        }),
        '&:hover': {
          opacity: 0.72,
        },
        ...sx,
      }}
    >
      <input {...getInputProps()} />

      {hasFile && previewUrl ? (
        <Image
          alt="uploaded file"
          src={previewUrl}
          objectFit="contain"
          sx={{
            width: 1,
            height: 1,
            borderRadius: 1,
          }}
        />
      ) : (
        placeholder || <Iconify icon="eva:cloud-upload-fill" width={28} />
      )}
    </Box>
  );
}
