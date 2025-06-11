import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// @apollo/client
import { useMutation } from '@apollo/client';

// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';

// components
import ConfirmDialogWithForm from "src/components/custom-dialog/confirm-dialog-with-form";
import { RHFTextField } from 'src/components/hook-form';
import Iconify from 'src/components/iconify';
import { Upload } from 'src/components/upload';
import { CustomFile } from 'src/components/upload/types';

// Types
import { OutsideUser } from 'src/__generated__/resolvers-types';
import { CREATE_OUTSIDE_USERS, GET_OUTSIDE_USERS } from 'src/api/outsideUser';
import { useSnackbar } from 'notistack';

interface InputProps {
  user?: OutsideUser | null;
  controller: ReturnType<any>;
}

type UserFormItem = {
  name: string;
  email: string;
};

// Validation schema using yup
const schema = yup.object().shape({
  users: yup.array().of(
    yup.object().shape({
      name: yup.string().trim().required('Name is required'),
      email: yup.string().trim().email('Invalid email format').required('Email is required'),
    })
  ),
});

export default function UpsertOutsideUserDialogue({
  user,
  controller,
}: InputProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [csvError, setCsvError] = useState<string | null>(null);
  
  const [mutate, { loading }] = useMutation(CREATE_OUTSIDE_USERS, {
    refetchQueries: [GET_OUTSIDE_USERS],
  });

  const action = useMemo(() => (user ? 'Update' : 'Create'), [user]);

  // Initialize react-hook-form with default values and validation schema
  const methods = useForm({
    defaultValues: {
      users: user 
        ? [{ name: user.name || '', email: user.email || '' }] 
        : [{ name: '', email: '' }],
    },
    resolver: yupResolver(schema),
  });

  const { control, handleSubmit, reset, setValue } = methods;
  
  // Setup field array to handle dynamic users
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'users',
  });

  useEffect(() => {
    if (user) {
      setValue('users', [{ name: user.name, email: user.email }]);
    } else {
      reset({ users: [{ name: '', email: '' }] });
    }
  }, [user, reset, setValue]);

  const onSubmit = async (data: { users: UserFormItem[] }) => {
    try {
      await mutate({
        variables: {
          users: user
            ? [{ id: user.id, ...data.users[0] }] // If editing, only use first entry
            : data.users.map(({ name, email }) => ({
                name: name.trim(),
                email: email.trim(),
              })),
        },
      });
      controller.onFalse();
      reset({ users: [{ name: '', email: '' }] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = useCallback(() => {
    reset({ users: [{ name: '', email: '' }] });
    controller.onFalse();
  }, [reset, controller]);

  const addUser = () => {
    append({ name: '', email: '' });
  };

  const handleCsvFileUpload = (file: CustomFile | null) => {
    applyCSVData(file);
    setCsvError(null);
  };

  const handleCsvFileDelete = () => {
    setCsvError(null);
  };

  const parseCSV = (text: string): UserFormItem[] => {
    try {
      // Split by rows
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
      
      // Detect if CSV has headers
      const firstRow = rows[0].split(',');
      const hasHeaders = firstRow.some(cell => 
        cell.toLowerCase().includes('name') || cell.toLowerCase().includes('email')
      );
      
      const startIndex = hasHeaders ? 1 : 0;
      
      return rows.slice(startIndex).map(row => {
        const [name, email] = row.split(',').map(cell => cell.trim());
        
        if (!name || !email) {
          throw new Error('Each row must contain both name and email separated by comma');
        }
        
        return { name, email };
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setCsvError('Error parsing CSV. Please ensure each row has a name and email separated by comma.');
      return [];
    }
  };

  const applyCSVData = async (csvFile: CustomFile | null) => {
    if (!csvFile) return;
    
    try {
      const text = await csvFile.text();
      const users = parseCSV(text);
      
      if (users.length > 0) {
        // If we're editing a user, don't replace the current user
        if (user) {
          enqueueSnackbar('CSV import is not supported when editing a user', { variant: 'warning' });
          return;
        }
        
        replace(users);
        enqueueSnackbar(`Successfully imported ${users.length} users from CSV`, { variant: 'success' });
      }
    } catch (error) {
      console.error('Error processing CSV file:', error);
      setCsvError('Error processing CSV file. Please check the format and try again.');
    }
  };

  return (
    <ConfirmDialogWithForm
      methods={methods}
      maxWidth="md"
      handleSubmit={handleSubmit(onSubmit as any)}
      open={controller.value}
      onClose={handleClose}
      title={`${action} External User${!user ? 's' : ''}`}
      content={
        <Stack spacing={2} mt={1}>
          {!user && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">
                Upload CSV to bulk add users
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CSV should have name and email columns (or values in that order)
              </Typography>
              
              <Upload
                accept={{ 'text/csv': ['.csv'] }}
                maxSize={1000000}
                onDrop={(acceptedFiles: File[]) => {
                  const file = acceptedFiles[0] as CustomFile;
                  if (file) {
                    handleCsvFileUpload(file);
                  }
                }}
                onDelete={handleCsvFileDelete}
              />
              
              {csvError && (
                <Alert severity="error">{csvError}</Alert>
              )}
              
              <Divider>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  OR ADD USERS MANUALLY
                </Typography>
              </Divider>
            </Stack>
          )}

          {fields.map((field, index) => (
            <Box key={field.id}>
              <Box sx={{ mb: 2 }}>
                <Divider>
                  <Typography variant="subtitle2" color="text.secondary">
                    External User {index + 1}
                  </Typography>
                </Divider>
              </Box>
              
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Box flexGrow={1}>
                  <Stack spacing={2}>
                    <RHFTextField 
                      name={`users.${index}.name`} 
                      label="Name" 
                      type="text" 
                      autoFocus={index === 0} 
                    />
                    <RHFTextField 
                      name={`users.${index}.email`} 
                      label="Email" 
                      type="text" 
                    />
                  </Stack>
                </Box>
                
                {fields.length > 1 && (
                  <IconButton 
                    color="error" 
                    onClick={() => remove(index)}
                    sx={{ mt: 1 }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                  </IconButton>
                )}
              </Stack>
            </Box>
          ))}

          {!user && (
            <Button
              startIcon={<Iconify icon="ic:baseline-add" />}
              onClick={addUser}
              variant="outlined"
              fullWidth
            >
              Add Another User
            </Button>
          )}
        </Stack>
      }
      action={
        <LoadingButton
          type="submit"
          variant="contained"
          loading={loading}
        >
          {action} External User{!user ? 's' : ''}
        </LoadingButton>
      }
    />
  );
}
