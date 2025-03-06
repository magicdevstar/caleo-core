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
      table: {
        sx: {
          minWidth: '100%'
        },
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
        {
          id: 'shift.event.referenceId',
          label: 'Event Ref#',
          columnType: 'string',
          width: '10%',
          noSort: true,
        },
        {
          id: 'shift.event.name',
          label: 'Event Name',
          columnType: 'string',
          width: '40%',
          noSort: true,
        },
        {
          id: 'shift.assignment.name',
          label: 'Assignment Name',
          columnType: 'string',
          width: '30%',
          noSort: true,
        },
        {
          id: 'status',
          label: 'Status',
          columnType: 'string',
          getLabelColor: (event: any) => {
            switch (event.status.toUpperCase()) {
              case 'COMPLETED':
                return 'success';
              case 'SENT':
                return 'warning';
              case 'VOIDED':
                return 'error';
              default:
                return 'default';
            }
          },
          renderValue: (value: string) => value.toUpperCase(),
          width: '10%',
          noSort: true,
        },
        {
          id: '',
          width: '10%',
          columnType: 'action',
          label: 'Download',
          renderValue: (_value: any, _index: number, row: DocusignEvent) => (
            <IconButton onClick={() => {
              window.open(row.documentUrl!, '_blank');
            }}>
              <Iconify icon="ic:round-download" />
            </IconButton>
          ),
          noSort: true,
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
