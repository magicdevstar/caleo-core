import { useCallback, useMemo, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { client } from 'src/utils/apollo';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
// types
import { Shift } from "src/__generated__/resolvers-types";
import { UseBooleanReturnType } from "src/hooks/use-boolean";
// components
import ConfirmDialogWithForm from "src/components/custom-dialog/confirm-dialog-with-form";
import { RHFTextField, RHFUpload } from 'src/components/hook-form';
import { CREATE_EVENT_NOTIFICATION, GET_EVENT_NOTIFICATIONS } from 'src/api/eventNotifications';
import { GET_USER_SHIFT_ACTIVITY } from 'src/api/user';

interface Props {
  controller: UseBooleanReturnType<Shift>;
  // notificationKey: 'assignmentId' | 'shiftId' | 'eventId';
}

const EventNotificationForm = Yup.object().shape({
  assignmentId: Yup.string(),
  shiftId: Yup.string(),
  eventId: Yup.string(),
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  attachments: Yup.array(),
});

export const EventNotificationDialog = ({ controller }: Props) => {
  const [saving, setSaving] = useState(false);
  const [create] = useMutation(CREATE_EVENT_NOTIFICATION);

  const defaultValues: any = useMemo(() => ({
    assignmentId: controller.attribute?.assignment?.id,
    title: '',
    description: '',
    attachments: [],
  }), [controller]);


  const methods = useForm({
    resolver: yupResolver(EventNotificationForm),
    defaultValues,
  });

  const { reset } = methods;

  const onSubmit = methods.handleSubmit(async (formData) => {
    try {
      setSaving(true);
      let imageUploadUrls = [];
      const existingAttachments = formData.attachments
        .filter(({ existing }: any) => existing)
        .map(({ attachmentPath }: any) => {
          const url = new URL(attachmentPath);
          return {
            attachmentPath: url.pathname.replace(/^\//, "")
          };
        });
      const getUploadUrls = formData.attachments.filter(({ existing }: any) => !existing);
      if (getUploadUrls.length > 0) {
        let mutation: any = 'mutation {';
        getUploadUrls.forEach((file: any, index: number) => {
          mutation += `
            attachments${index}: eventNotificationAttachmentUploadUrl {
              attachmentPath
              uploadUrl
            }
          `;
        });
        mutation += '}';
        mutation = gql(mutation);
        const { data } = await client.mutate({
          mutation,
        });
        imageUploadUrls = Object.keys(data).map((key, index) => ({
          ...data[key],
          attachmentData: getUploadUrls[index],
        }));
      }

      if (imageUploadUrls.length > 0) {
        await Promise.allSettled(
          imageUploadUrls.map(({
            uploadUrl,
            attachmentData,
          }: any) => fetch(uploadUrl, {
            method: 'PUT',
            body: attachmentData,
            headers: {
              'Content-Type': attachmentData.type,
            },
          }))
        );
      }

      await create({
        variables: {
          input: {
            title: formData.title,
            description: formData.description,
            assignmentId: controller.attribute?.assignment?.id,
            attachmentPaths: [
              ...existingAttachments,
              ...imageUploadUrls,
            ].map(({ attachmentPath }) => attachmentPath),
          },
        },
        refetchQueries: [GET_EVENT_NOTIFICATIONS, GET_USER_SHIFT_ACTIVITY],
      })

      handleClose();
    } catch(error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  });

  const handleClose = useCallback(() => {
    controller.onFalse();
    reset();
  }, [reset, controller]);

  return (
    <ConfirmDialogWithForm
      methods={methods}
      handleSubmit={onSubmit}
      action={
        <LoadingButton
          type="submit"
          loading={saving}
          variant="contained"
          color="primary"
        >
          Notify Assignment
        </LoadingButton>
      }
      TransitionProps={{
        // wait for animation to end on closing
        onExited: handleClose,
      }}
      open={controller.value}
      onClose={handleClose}
      title="Notify Assignment"
      maxWidth='md'
      content={(
        <Stack spacing={3} sx={{ mt: 2 }}>
          <RHFTextField name="title" label="Title" />
          <RHFTextField
            name="description"
            label="Description"
            multiline
            minRows={4}
          />

          <RHFUpload
            multiple
            thumbnail
            accept={{'application/pdf': [], 'image/*': []}}
            name="attachments"
            maxSize={1e+9} // 1 GB
          />
        </Stack>
      )}
    />
  )
};
