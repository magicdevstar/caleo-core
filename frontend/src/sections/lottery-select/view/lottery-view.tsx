import { useCallback, useMemo } from "react";
import { StringParam, useQueryParam } from "use-query-params";
import { useQuery } from "@apollo/client";
// @mui
import Container from "@mui/material/Container";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import Tab from "@mui/material/Tab";
// Components
import Iconify from "src/components/iconify";
import { GET_LOTTERY_SHIFTS } from "src/api/shifts";
import Label from "src/components/label/label";
import { Shift } from "src/__generated__/resolvers-types";
import SelectShifts from "../lottery/select-shifts";
import RankShifts from "../lottery/rank-shifts";

const TABS = [
  {
    value: 'select',
    label: 'Select',
    icon: <Iconify icon="mdi:cursor-default-click" width={24} />,
  },
  {
    value: 'rank',
    label: 'Rank',
    icon: <Iconify icon="mdi:sort-numeric-descending" width={24} />,
  },
];

export default function LotteryView() {
  const [currentTab, setCurrentTab] = useQueryParam('view', StringParam, {
    updateType: 'replace',
  });

  const { data, loading } = useQuery(GET_LOTTERY_SHIFTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });

  const numberSelectedForRanking = useMemo(() => (data?.lotteryShifts?.items || []).filter((shift: Shift) => shift.lotteryRequest?.id).length, [data]);

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, [setCurrentTab]);

  return (
    <Container
      maxWidth={false}
      sx={{
        height: 1,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        Lottery Select and Rank
      </Typography>

      <Tabs
        value={currentTab || 'select'}
        onChange={handleChangeTab}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        {TABS.map((tab) => {
          if (tab.value === 'rank') {
            return (
              <Tab
                key={tab.value}
                label={tab.label}
                value={tab.value}
                iconPosition="end"
                icon={
                  <Label color="info" >{numberSelectedForRanking}</Label>
                }
              />
            );
          }
          return (
            <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
          );
        })}
      </Tabs>

      {(!currentTab || currentTab === 'select') && (<SelectShifts data={data} loading={loading} />)}
      {currentTab === 'rank' && (<RankShifts />)}

    </Container>
  )

}
