import { useCallback, useState } from "react";

// @apollo/client
import { useMutation } from "@apollo/client";

// @mui
import Button from '@mui/material/Button';

// Types
import { Skill } from "src/__generated__/resolvers-types";
import { GET_SKILLS, REMOVE_SKILL, UPSERT_SKILL } from "src/api/skill";
import GQLTable from "src/components/table/gql/table"
// Hooks
import { useBoolean } from "src/hooks/use-boolean";
// Components
import { ConfirmDialog } from "src/components/custom-dialog";
import { TableConfig, getBooleanFilters } from "src/components/table/table-config"

import UpsertSkillDialogue from "./upsert-skill-dialogue";

export default function SkillTable() {
  const [updateSkill] = useMutation(UPSERT_SKILL, {
    refetchQueries: [GET_SKILLS],
  });

  const [removeSkill] = useMutation(REMOVE_SKILL, {
    refetchQueries: [GET_SKILLS],
  });

  const [editSkill, setEditSkill] = useState<Skill | null>(null);
  const deleteConfirm = useBoolean();
  const upsertSkill = useBoolean();

  const config: TableConfig<Skill> = {
    header: {
      title: 'Skills',
      button: {
        text: 'Add Skill',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsertSkill.onTrue();
        },
      }
    },
    search: {
      query: GET_SKILLS,
      processResult: (data) => {
        const { skills: { items, total } } = data || { skills: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Skill) => {
          setEditSkill(row);
          upsertSkill.onTrue();
        },
      },
      {
        getName: (row: Skill) => row.active ? 'Deactivate' : 'Activate',
        getIcon: (row: Skill) => row.active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (skill: Skill) => {
          updateSkill({
            variables: {
              input: {
                id: skill.id,
                active: !skill.active,
                name: skill.name,
                requiresCert: skill.requiresCert,
                requiresAdminApproval: skill.requiresAdminApproval,
                rankOnlyIds: skill.rankOnlyIds,
              },
            },
          });
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (skill: Skill) => {
          setEditSkill(skill);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      { id: 'name', label: 'Skill', columnType: 'string' },
      { id: 'ranksOnly', label: 'Ranks', width: 200, noSort: true, columnType: 'array', maxRender: 1 },
      { id: 'requiresCert', label: 'Cert Required', width: 160, columnType: 'boolean' },
      { id: 'requiresAdminApproval', label: 'Admin Approval', width: 160, columnType: 'boolean' },
      { id: 'active', label: 'Active', width: 110, columnType: 'boolean' },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'requiresCert',
        type: 'select',
        label: 'Cert Required',
        defaultValue: [],
        value: [],
        fetchOptions: getBooleanFilters,
        resolveAsBoolean: true,
      },
      {
        id: 'requiresAdminApproval',
        type: 'select',
        label: 'Admin Approval',
        defaultValue: [],
        value: [],
        fetchOptions: getBooleanFilters,
        resolveAsBoolean: true,
      },
      {
        id: 'active',
        type: 'select',
        label: 'Active',
        defaultValue: [],
        value: [],
        fetchOptions: getBooleanFilters,
        resolveAsBoolean: true,
      },
      {
        id: 'query',
        type: 'text',
        label: 'Search',
        defaultValue: '',
        value: '',
      },
    ]
  };

  const handleUpsert = useCallback(
    () => {
      setEditSkill(null);
    },
    []
  );

  const handleDeleteRow = useCallback(
    () => {
      removeSkill({
        variables: {
          id: editSkill?.id,
        },
      }).then(() => {
        setEditSkill(null);
        deleteConfirm.onFalse();
      });
    },
    [removeSkill, editSkill, setEditSkill, deleteConfirm]
  );

  return (
    <>
      <GQLTable config={config} />

      <UpsertSkillDialogue
        upsertSkill={upsertSkill}
        skill={editSkill}
        onUpsertSkill={handleUpsert}
      />
      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  )
};

