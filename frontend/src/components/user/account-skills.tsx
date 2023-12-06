import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
import { capitalize } from "lodash";
// @mui
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import red from "@mui/material/colors/red";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// Types
import { FrontendUser, GET_USER, REMOVE_MEMBER_SKILL, UPSERT_MEMBER_SKILL } from 'src/api/user';
import { GET_SKILLS } from 'src/api/skill';
import { MemberSkill, SkillStatus } from 'src/__generated__/resolvers-types';
import GQLTable from 'src/components/table/gql/table';
import { TableConfig } from 'src/components/table/table-config';
import UpsertMemberSkill from 'src/components/user/skills/upsert-skill-dialoge';
import { ConfirmDialog } from 'src/components/custom-dialog';
//

// ----------------------------------------------------------------------

type Props = {
  user: FrontendUser;
  adminViewer: boolean;
};

export default function AccountSkills({ user, adminViewer }: Props) {
  const [removeSkill, { loading: removeLoading }] = useMutation(REMOVE_MEMBER_SKILL, {
    refetchQueries: [GET_USER],
  })
  const [updateSkill, { loading: updateSkillLoading }] = useMutation(UPSERT_MEMBER_SKILL, {
    refetchQueries: [GET_USER],
  });

  const [editSkill, setEditSkill] = useState<{ memberSkill: MemberSkill; status?: SkillStatus, reason?: string } | null>(null);
  const deleteConfirm = useBoolean();
  const upsertMemberSkill = useBoolean();
  const upsertApprovalSkill = useBoolean();

  const handleUpsert = useCallback(() => {
    setEditSkill(null);
  }, [setEditSkill]);

  const handleApprovalUpsert = useCallback(
    async () => {
      try {
        await updateSkill({
          variables: {
            input: {
              id: editSkill?.memberSkill.id,
              status: editSkill?.status,
              skillId: editSkill?.memberSkill?.skill?.id,
              userId: user?.id,
              ...(editSkill?.status === SkillStatus.Denied ? { statusReason: editSkill.reason } : {}),
            },
          },
        });
        setEditSkill(null);
        upsertApprovalSkill.onFalse();
      } catch(error) {
        console.error(error);
      }
    },
    [user, updateSkill, upsertApprovalSkill, editSkill, setEditSkill]
  );

  const handleDeleteRow = useCallback(() => {
    removeSkill({
      variables: {
        id: editSkill!.memberSkill.id,
      },
    }).then(() => {
      setEditSkill(null);
      deleteConfirm.onFalse();
    });
  }, [removeSkill, editSkill, deleteConfirm, setEditSkill]);

  const config: TableConfig<MemberSkill> = {
    header: {
      title: 'Skills',
      button: {
        text: 'Add Skill',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsertMemberSkill.onTrue();
        },
      },
    },
    search: {
      data: (user.member.memberSkills || []) as MemberSkill[],
      // This wont be used because data is set :)
      query: GET_SKILLS,
      processResult: (data) => ({
        total: data.length,
        items: data,
      }),
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        getHidden: (skill: MemberSkill) => skill.status !== SkillStatus.Pending,
        onClick: (row: MemberSkill) => {
          setEditSkill({ memberSkill: row });
          upsertMemberSkill.onTrue();
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (skill: MemberSkill) => {
          setEditSkill({ memberSkill: skill });
          deleteConfirm.onTrue();
        },
      },
      {
        includeDivider: true,
        getName: () => 'Approve',
        getIcon: () => 'solar:check-circle-bold',
        getHidden: (skill: MemberSkill) => !adminViewer || skill.status !== SkillStatus.Pending,
        onClick: (skill: MemberSkill) => {
          setEditSkill({
            memberSkill: skill,
            status: SkillStatus.Approved,
          });
          upsertApprovalSkill.onTrue();
        },
      },
      {
        getName: () => 'Deny',
        getIcon: () => 'solar:close-circle-bold',
        getColor: (row: MemberSkill) => red[500],
        getHidden: (skill: MemberSkill) => !adminViewer || skill.status !== SkillStatus.Pending,
        onClick: (skill: MemberSkill) => {
          setEditSkill({
            memberSkill: skill,
            status: SkillStatus.Denied,
          });
          upsertApprovalSkill.onTrue();
        },
      },
    ],
    columns: [
      { id: 'skill.name', label: 'Name', columnType: 'string' },
      {
        id: 'status',
        label: 'Status',
        width: 110,
        columnType: 'string',
        renderValue: (status) => capitalize(status),
        getLabelColor: (row) => {
          switch (row.status) {
            case SkillStatus.Approved:
              return 'success';
            case SkillStatus.Denied:
              return 'error';
            case SkillStatus.Pending:
              return 'warning';
            default:
              return 'default';
          }
        },
      },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [],
  };

  return (
    <Box width="100%">
      <GQLTable config={config} />

      <UpsertMemberSkill
        memberSkill={editSkill?.memberSkill || null}
        userId={user.id}
        rankId={user.member.rank!.id}
        upsertMemberSkill={upsertMemberSkill}
        onUpsertMemberSkill={handleUpsert}
        existingSkills={(user.member.memberSkills || []) as MemberSkill[]}
      />

      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <LoadingButton loading={removeLoading} variant="contained" color="error" onClick={handleDeleteRow}>
            Delete
          </LoadingButton>
        }
      />

      <ConfirmDialog
        open={upsertApprovalSkill.value}
        onClose={upsertApprovalSkill.onFalse}
        title={editSkill?.status === SkillStatus.Approved ? 'Approve Skill' : 'Deny Skill'}
        content={(
          <>
            <Typography variant="body1">{`Are you sure want to ${editSkill?.status?.toLowerCase()} this skill?`}</Typography>
            {editSkill?.status === SkillStatus.Denied && (
              <TextField
                label="Denied Reason"
                multiline
                fullWidth
                sx={{ mt: 1 }}
                rows={4}
                onChange={(event) => {
                  setEditSkill((c) => ({
                    ...c,
                    reason: event.target.value,
                  } as any))
                }}
              />
            )}
          </>)}
        action={
          <LoadingButton disabled={(editSkill?.status === SkillStatus.Denied && (editSkill?.reason?.trim() === '' || !editSkill?.reason))} loading={updateSkillLoading} variant="contained" color={editSkill?.status === SkillStatus.Approved ? "primary" : "error"} onClick={handleApprovalUpsert}>
            {editSkill?.status === SkillStatus.Approved ? 'Approve' : 'Deny'}
          </LoadingButton>
        }
      />
    </Box>
  );
}
