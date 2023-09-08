import { useCallback, useState } from "react";
import { capitalize } from "lodash";
// @apollo/client
import { useMutation } from "@apollo/client";

// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import red from "@mui/material/colors/red";

// Types
import { MemberSkill, SkillStatus } from "src/__generated__/resolvers-types";
import { GET_MEMBER_SKILLS } from "src/api/skill";
import { UPSERT_MEMBER_SKILL } from "src/api/user";
import GQLTable from "src/components/table/gql/table"
// Hooks
import { useBoolean } from "src/hooks/use-boolean";
// Components
import { ConfirmDialog } from "src/components/custom-dialog";
import { TableConfig } from "src/components/table/table-config"

export default function SkillTable() {
  const [updateSkill, { loading: updateSkillLoading }] = useMutation(UPSERT_MEMBER_SKILL, {
    refetchQueries: [GET_MEMBER_SKILLS],
  });

  const [editSkill, setEditSkill] = useState<{ memberSkill: MemberSkill; status: SkillStatus, reason?: string } | null>(null);
  const upsertSkill = useBoolean();

  const config: TableConfig<MemberSkill> = {
    header: {
      title: 'Skill Requests',
    },
    search: {
      query: GET_MEMBER_SKILLS,
      processResult: (data) => {
        const { memberSkills: { items, total } } = data || { memberSkills: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    rowActions: [
      {
        getName: () => 'Approve',
        getIcon: () => 'solar:check-circle-bold',
        onClick: (row: MemberSkill) => {
          setEditSkill({
            memberSkill: row,
            status: SkillStatus.Approved,
          });
          upsertSkill.onTrue();
        },
      },
      {
        getName: () => 'Deny',
        getIcon: () => 'solar:close-circle-bold',
        getColor: (row: MemberSkill) => red[500],
        onClick: (row: MemberSkill) => {
          setEditSkill({
            memberSkill: row,
            status: SkillStatus.Denied,
          });
          upsertSkill.onTrue();
        },
      }
    ],
    columns: [
      { id: 'user.name', label: 'Name', columnType: 'string' },
      { id: 'skill.name', label: 'Skill', columnType: 'string' },
      {
        id: 'image',
        label: 'Attachment',
        columnType: 'string',
        clickable: (row: MemberSkill) => !!row?.image,
        renderValue: (image: string) => image ? 'View Attachment' : '-',
        getLabelColor: (row: MemberSkill) => row?.image ? 'info' : 'default',
        onClick: (row: MemberSkill) => {
          if (row.image) {
            window.open(row.image, '_blank');
          }
        }
      },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'status',
        type: 'hidden',
        label: 'Cert Required',
        defaultValue: SkillStatus.Pending,
        value: SkillStatus.Pending,
      }
    ]
  };

  const handleUpsert = useCallback(
    async () => {
      try {
        await updateSkill({
          variables: {
            input: {
              id: editSkill?.memberSkill.id,
              status: editSkill?.status,
              skillId: editSkill?.memberSkill?.skill?.id,
              userId: editSkill?.memberSkill?.user?.id,
              ...(editSkill?.status === SkillStatus.Denied ? { statusReason: editSkill.reason } : {}),
            },
          },
        });
        setEditSkill(null);
        upsertSkill.onFalse();
      } catch(error) {
        console.error(error);
      }
    },
    [updateSkill, upsertSkill, editSkill, setEditSkill]
  );

  return (
    <>
      <GQLTable config={config} />

      <ConfirmDialog
        open={upsertSkill.value}
        onClose={upsertSkill.onFalse}
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
          <LoadingButton disabled={(editSkill?.status === SkillStatus.Denied && (editSkill?.reason?.trim() === '' || !editSkill?.reason))} loading={updateSkillLoading} variant="contained" color={editSkill?.status === SkillStatus.Approved ? "primary" : "error"} onClick={handleUpsert}>
            {capitalize(editSkill?.status)}
          </LoadingButton>
        }
      />
    </>
  )
};

