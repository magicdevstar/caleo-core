import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
// Components
import { RHFUploadBox } from 'src/components/hook-form';
import { fData } from 'src/utils/format-number';
import { maxThumbnailSize } from 'src/utils/event.utils';

// ----------------------------------------------------------------------

interface DefaultEventThumbnailProps {
  name: string;
  thumbnailUrl?: string | null;
  label?: string;
  helperText?: string;
  maxSize?: number;
  sx?: any;
}

export default function DefaultEventThumbnail({
  name,
  thumbnailUrl,
  label = "Default Thumbnail",
  helperText,
  maxSize = maxThumbnailSize,
  sx,
}: DefaultEventThumbnailProps) {
  const { setValue } = useFormContext();
  const [loadingThumbnail, setLoadingThumbnail] = useState(false);

  // Handle converting URL to file object for existing thumbnails
  useEffect(() => {
    if (thumbnailUrl && typeof thumbnailUrl === 'string') {
      setLoadingThumbnail(true);
      fetch(thumbnailUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const fileName = thumbnailUrl.split('/').pop() || 'thumbnail.jpg';
          const file = new File([blob], fileName, { type: blob.type });
          const fileBlob = Object.assign(file, {
            preview: URL.createObjectURL(file),
            existing: true,
          });
          setValue(name, fileBlob);
          setLoadingThumbnail(false);
        })
        .catch((error) => {
          console.error('Error loading thumbnail:', error);
          setLoadingThumbnail(false);
        });
    }
  }, [thumbnailUrl, setValue, name]);

  const defaultHelperText = `Upload a default thumbnail image that will be used for events when no custom thumbnail is provided. Max size of ${fData(maxSize)}`;

  if (loadingThumbnail) {
    return (
      <Box>
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {label}
        </Typography>
        <Skeleton
          variant="rectangular"
          sx={{
            width: 250,
            height: 175,
            borderRadius: 1,
            ...sx,
          }}
        />
      </Box>
    );
  }

  return (
    <RHFUploadBox
      name={name}
      label={label}
      helperText={helperText || defaultHelperText}
      maxSize={maxSize}
      sx={{
        width: 250,
        height: 175,
        borderRadius: 1,
        ...sx,
      }}
      onDrop={(acceptedFiles: File[]) => {
        const file = acceptedFiles[0];

        const newFile = Object.assign(file, {
          preview: URL.createObjectURL(file),
        });

        if (file) {
          setValue(name, newFile, { shouldValidate: true });
        }
      }}
    />
  );
}
