import { useState } from "react";
import { Assignment } from "src/__generated__/resolvers-types";
import { GET_EVENT } from "src/api/event";
import GQLTable from "src/components/table/gql/table";
import { TableConfig } from "src/components/table/table-config";
import { useBoolean } from "src/hooks/use-boolean";

interface Props {
  eventId?: string;
  canAddAssignments: boolean;
  assignments: Assignment[];
  addAssignment: VoidFunction;
}

export function AssignmentList({
  eventId,
  canAddAssignments,
  assignments,
  addAssignment,
}: Props) {
  const deleteConfirm = useBoolean();
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);

  const config: TableConfig<Assignment> = {
    header: {
      title: 'Assignments',
      button: {
        text: 'Add Assignment',
        icon: 'ic:baseline-add',
        disabled: !canAddAssignments,
        onClick: () => {
          addAssignment();
        },
      }
    },
    search: {
      data: assignments,
      query: GET_EVENT,
      processResult: (data: any) => ({
        total: assignments.length,
        items: assignments,
      }),
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Assignment) => {
          // navigate(`/dashboard/admin/overtime/venues/${row.id}`);
        },
      },
      {
        getName: () => 'Edit Shifts',
        getIcon: () => 'solar:bill-list-bold',
        onClick: (row: Assignment) => {
          // navigate(`/dashboard/admin/overtime/venues/${row.id}`);
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: Assignment) => {
          setEditAssignment(row);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        getHref: (row) => `/dashboard/admin/overtime/venues/${row.id}`,
      },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: []
  };

  return (
    <GQLTable config={config} />
  )
}