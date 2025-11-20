import { useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
//
import { UploadAvatar, Upload, UploadBox, UploadProps } from '../upload';

// ----------------------------------------------------------------------

interface Props extends Omit<UploadProps, 'file'> {
  name: string;
  multiple?: boolean;
  accept?: { [key: string]: string[] };
  label?: string;
  helperText?: string | React.ReactNode;
}

// ----------------------------------------------------------------------

export function RHFUploadAvatar({ name, ...other }: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div>
          <UploadAvatar error={!!error} file={field.value} {...other} />

          {!!error && (
            <FormHelperText error sx={{ px: 2, textAlign: 'center' }}>
              {error.message}
            </FormHelperText>
          )}
        </div>
      )}
    />
  );
}

// ----------------------------------------------------------------------

export function RHFUploadBox({ name, label, helperText, ...other }: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box>
          {label && (
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
          )}
          
          <UploadBox file={field.value} error={!!error} {...other} />
          
          {(!!error || helperText) && (
            <FormHelperText error={!!error} sx={{ mt: 1, px: 0 }}>
              {error ? error?.message : helperText}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
}

// ----------------------------------------------------------------------

export function RHFUpload({ name, multiple, helperText, accept, ...other }: Props) {
  const { control, watch, setValue } = useFormContext();
  const attachments = watch(name);

  const handleRemoveFile = useCallback(
    (inputFile: File | string) => {
      const filtered = attachments && attachments?.filter((file: any) => file !== inputFile);
      setValue(name, filtered);
    },
    [setValue, attachments, name]
  );

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const files: any[] = attachments || [];

      const newFiles: any[] = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue(name, [...files, ...newFiles] as any[], { shouldValidate: true });
    },
    [setValue, attachments, name]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue(name, [] as any[]);
  }, [setValue, name]);

  const uploadAccept = accept ?? { 'image/*': [] };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) =>
        multiple ? (
          <Upload
            multiple
            accept={uploadAccept}
            files={field.value}
            error={!!error}
            helperText={
              (!!error || helperText) && (
                <FormHelperText error={!!error} sx={{ px: 2 }}>
                  {error ? error?.message : helperText}
                </FormHelperText>
              )
            }
            onDrop={handleDrop}
            onRemove={handleRemoveFile}
            onRemoveAll={handleRemoveAllFiles}
            {...other}
          />
        ) : (
          <Upload
            accept={uploadAccept}
            file={field.value}
            error={!!error}
            helperText={
              (!!error || helperText) && (
                <FormHelperText error={!!error} sx={{ px: 2 }}>
                  {error ? error?.message : helperText}
                </FormHelperText>
              )
            }
            {...other}
          />
        )
      }
    />
  );
}
