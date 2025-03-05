import { FrontendUser } from "src/api/user";
import { DocusignEvent } from "src/__generated__/resolvers-types";
import { GET_DOCUSIGN_EVENTS } from "src/api/docusign";
import IconButton from "@mui/material/IconButton";

import GQLTable from "../table/gql/table";
import { TableConfig } from "../table/table-config";
import Iconify from "../iconify";

export default function AccountDocusign({
  user,
}: {
  user: FrontendUser;
}) {
  const config: TableConfig<DocusignEvent> = {
      header: {
        title: 'End of Shift Documents',
      },
      search: {
        query: GET_DOCUSIGN_EVENTS,
        processResult: (data) => {
          const { docusignEvents: { items, total } } = data || { docusignEvents: { items: [], total: 0 } };
          return {
            total,
            items,
          };
        }
      },
      rowActions: [
        {
          getName: () => 'Download document',
          getIcon: () => 'ic:round-download',
          getHidden: (row: DocusignEvent) => !row.documentUrl,
          onClick: (row: DocusignEvent) => {
            window.open(row.documentUrl!, '_blank');
          },
        }
      ],
      columns: [
        { id: 'shift.event.referenceId', label: 'Event Ref#', columnType: 'string' },
        { id: 'shift.event.name', label: 'Event Name', columnType: 'string' },
        { id: 'shift.assignment.name', label: 'Assignment Name', columnType: 'string' },
        { id: 'status', label: 'Status', columnType: 'string', renderValue: (value: string) => value.toUpperCase() },
        {
          id: '',
          width: 88,
          columnType: 'action',
          label: 'Download',
          renderValue: (_value: any, _index: number, row: DocusignEvent) => (
            <IconButton onClick={() => {
              window.open(row.documentUrl!, '_blank');
            }}>
              <Iconify icon="ic:round-download" />
            </IconButton>
          ),
        },
      ],
      filters: [
        {
          id: 'userId',
          type: 'hidden',
          defaultValue: user.id,
          value: user.id,
        },
      ]
    };

  return (
    <GQLTable config={config} />
  );
};
