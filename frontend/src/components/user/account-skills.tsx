import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
// @mui
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// Types
import { FrontendUser, GET_USER, REMOVE_MEMBER_SKILL } from 'src/api/user';
import { GET_SKILLS } from 'src/api/skill';
import { MemberSkill } from 'src/__generated__/resolvers-types';
import GQLTable from 'src/components/table/gql/table';
import { TableConfig } from 'src/components/table/table-config';
import UpsertMemberSkill from 'src/components/user/skills/upsert-skill-dialoge';
import { ConfirmDialog } from 'src/components/custom-dialog';
//

// ----------------------------------------------------------------------

type Props = {
  user: FrontendUser;
};

export default function AccountSkills({ user }: Props) {
  const [removeSkill, { loading: removeLoading }] = useMutation(REMOVE_MEMBER_SKILL, {
    refetchQueries: [GET_USER],
  })

  const [editSkill, setEditSkill] = useState<MemberSkill | null>(null);
  const deleteConfirm = useBoolean();
  const upsertMemberSkill = useBoolean();

  const handleUpsert = useCallback(() => {
    setEditSkill(null);
  }, [setEditSkill]);

  const handleDeleteRow = useCallback(() => {
    removeSkill({
      variables: {
        id: editSkill!.id,
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
      }
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
        onClick: (row: MemberSkill) => {
          setEditSkill(row);
          upsertMemberSkill.onTrue();
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (skill: MemberSkill) => {
          setEditSkill(skill);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      { id: 'skill.name', label: 'Name', columnType: 'string' },
      { id: 'status', label: 'Status', width: 110, columnType: 'string' },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: []
  };

  return (
    <Box width="100%">
      <GQLTable config={config} />

      <UpsertMemberSkill
        memberSkill={editSkill}
        userId={user.id}
        rankId={user.member.rank!.id}
        upsertMemberSkill={upsertMemberSkill}
        onUpsertMemberSkill={handleUpsert}
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
    </Box>
  );
}
