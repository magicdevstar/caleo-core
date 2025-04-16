import { useCallback, useState } from "react";
import { useMutation } from "@apollo/client";
import { useSnackbar } from "notistack";
// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
// types
import { MemberTier, ShiftInterestRequest, ShiftInterestRequestStatus, ShiftStatus } from "src/__generated__/resolvers-types";
import { GET_GROUPED_SHIFTS, SHIFT_INTEREST_REQUESTS, UPSERT_SHIFT_INTEREST_REQUEST } from "src/api/shifts";
import { TableConfig } from "src/components/table/table-config";
import { UseBooleanReturnType } from "src/hooks/use-boolean";
// components
import { useDownloadCsv } from "src/hooks/use-download-csv";
import GQLTable from "src/components/table/gql/table";
import { ConfirmDialog } from "src/components/custom-dialog";
import { client } from "src/utils/apollo";
import { convertDate, dateTimeFormat } from "src/hooks/use-datejs";
import { useAuthContext } from "src/auth/hooks";
import { get } from "lodash";
import { useFeatures } from "src/hooks/use-features";
import { useTiers } from "src/hooks/use-tiers";

interface Props {
  open: UseBooleanReturnType;
  interestList: ShiftInterestRequest[];
}

const formatStatus = (eventStatus: any, assignedShiftStatus?: string) => {
  if (assignedShiftStatus === ShiftStatus.Relinquished) {
    return 'Scratched';
  }
  switch (eventStatus) {
    case ShiftInterestRequestStatus.Pending:
      return 'Pending';
    case ShiftInterestRequestStatus.Approved:
      return 'Approved';
    case ShiftInterestRequestStatus.Rejected:
      return 'Rejected';
    default:
      return 'N/A';
  }
};

export function InterestList({
  open,
  interestList
}: Props) {
  const { monthlyMaxHours, lasdUserFields } = useFeatures();
  const { user } = useAuthContext();
  const { tierNames } = useTiers();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'shift-slot-interest',
    ext: 'csv',
  });
  const [downloadingSummary, setDownloadingSummary] = useState(false);
  const [loading, setLoading] = useState<boolean | string>(false);
  const [updateRequest] = useMutation(UPSERT_SHIFT_INTEREST_REQUEST);

  const downloadInterestSummary = useCallback(async () => {
    try {
      setDownloadingSummary(true);
      const csvData = interestList.map((interest) => {
        const createdAtTime = convertDate({date: interest.createdAt, user});
        return {
          'Name': interest.user?.name,
          'Status': formatStatus(interest.status, interest.assignedShift?.status),
          ...(lasdUserFields && {
            'Tier': interest.user?.member?.tier ? tierNames[interest.user.member.tier] || 'N/A' : 'N/A',
            'Hire Date': interest.user?.member?.tenor ? convertDate({date: interest.user?.member?.tenor, user}).format(dateTimeFormat) : 'N/A',
          }),
          ...(monthlyMaxHours && { 'Hours/month': interest.user?.numberOfHoursThisMonth }),
          'Created Date': createdAtTime.format(dateTimeFormat),
        };
      });
      download(csvData);
      enqueueSnackbar('Downloaded summary', { variant: 'success', autoHideDuration: 5000 });
    } catch(error) {
      enqueueSnackbar('Error downloading summary', { variant: 'error', autoHideDuration: 5000 });
    } finally {
      setDownloadingSummary(false);
    }
  }, [
    monthlyMaxHours,
    user,
    interestList,
    lasdUserFields,
    tierNames,
    enqueueSnackbar,
    setDownloadingSummary,
    download
  ])

  const config: TableConfig<ShiftInterestRequest> = {
    header: {
      title: 'Interest List',
      buttons: [
        {
          key: 'summary',
          text: 'Download Summary',
          icon: 'mdi:file-download',
          variant: 'contained',
          loading: downloadingSummary,
          onClick: () => downloadInterestSummary(),
        },
      ],
    },
    table: {
      sx: {
        minWidth: 'inherit',
      },
    },
    search: {
      data: interestList || [],
      query: SHIFT_INTEREST_REQUESTS,
      processResult: (data: any, filters) => {
        // eslint-disable-next-line no-restricted-syntax
        let filteredData = data;
        // eslint-disable-next-line no-restricted-syntax
        for(const filter of filters) {
          if (filter.type === 'text') {
            filteredData = filteredData.filter(
              (item: any) => get(item, filter.id).toLowerCase().includes(filter.value.toLowerCase())
            );
          }
        }
        return {
          total: filteredData.length,
          items: filteredData,
        }
      },
    },
    rowActions: [
    ].filter(Boolean) as any,
    columns: [
      {
        id: 'user.name',
        label: 'Name',
        columnType: 'string',
        width: '40%',
      },
      ...(lasdUserFields ? [
        {
          id: 'user.member.tier',
          label: 'Tier',
          columnType: 'string',
          width: '10%',
          renderValue: (tier: MemberTier) => tierNames[tier] || 'N/A',
        },
        {
          id: 'user.member.tenor',
          label: 'Hire Date',
          columnType: 'date',
          width: '10%',
        }
      ] : []),
      ...(monthlyMaxHours ? [{
        id: 'user.numberOfHoursThisMonth',
        label: 'Hours/month',
        columnType: 'string',
        width: '20%',
      }]: []) as any,
      {
        id: 'status',
        label: 'Status',
        width: '20%',
        columnType: 'string',
        renderValue: (eventStatus: any, _, row) => formatStatus(eventStatus, row.assignedShift?.status),
        getLabelColor: (event: any) => {
          if (event.assignedShift?.status === ShiftStatus.Relinquished) {
            return 'error';
          }
          switch (event.status) {
            case ShiftInterestRequestStatus.Pending:
              return 'info';
            case ShiftInterestRequestStatus.Approved:
              return 'success';
            case ShiftInterestRequestStatus.Rejected:
              return 'error';
            default:
              return 'default';
          }
        }
      },
      {
        id: '',
        width: '20%',
        columnType: 'action',
        label: '',
        renderValue: (_value: any, index: number, row: ShiftInterestRequest) => {
          let disableBoth = false;
          let canApprove = true;
          if (row.status === ShiftInterestRequestStatus.Approved) {
            canApprove = false;
          }

          if (row.assignedShift?.status === ShiftStatus.Relinquished) {
            disableBoth = true;
          }

          const clicked = async () => {
            try {
              setLoading(row.id);
              await updateRequest({
                variables: {
                  shiftInterestRequest: {
                    id: row.id,
                    shiftGroupId: row.shiftGroupId,
                    userId: row.user?.id,
                    status: !canApprove ? ShiftInterestRequestStatus.Rejected : ShiftInterestRequestStatus.Approved,
                  },
                }
              });
              await client.refetchQueries({
                include: [
                  GET_GROUPED_SHIFTS,
                  SHIFT_INTEREST_REQUESTS,
                ]
              });
              enqueueSnackbar('Successfully updated request', { variant: 'success', autoHideDuration: 5000 });
            } catch(error) {
              console.error(error);
              enqueueSnackbar('Error updating request', { variant: 'error', autoHideDuration: 5000 });
            } finally {
              setLoading(false);
            }
          }

          return (
            <Stack direction="row" spacing={2}>
              <LoadingButton
                disabled={!canApprove || disableBoth}
                loading={loading === row.id && canApprove}
                variant="contained"
                color="primary"
                onClick={clicked}
              >Approve</LoadingButton>
              <LoadingButton
                disabled={canApprove || disableBoth}
                loading={loading === row.id && !canApprove}
                variant="contained"
                color="error"
                onClick={clicked}
              >Reject</LoadingButton>
            </Stack>
          )
        }
      },
    ],
    filters: [
      {
        id: 'user.name',
        type: 'text',
        label: 'Name',
        defaultValue: '',
        value: '',
        sizing: {
          xs: 12,
          sm: 12,
          md: 12,
          lg: 12,
        },
      }
    ]
  };

  return (
    <ConfirmDialog
      open={open.value}
      onClose={open.onFalse}
      maxWidth="md"
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }
      }}
      content={(
        <Box sx={{ pt: 2 }}>
          <GQLTable config={config} />
        </Box>
      )}
      hasCancel={false}
      action={<span />}
    />
  )
}
