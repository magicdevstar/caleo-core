import { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useQuery, useMutation } from '@apollo/client';
import { RankGroup } from 'src/__generated__/resolvers-types';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { GET_RANK_GROUPS, CREATE_RANK_GROUP } from '../../api/rank';

const filter = createFilterOptions<RankGroup & { inputValue?: string }>();

export const RHFRankGroup = ({
  name,
  label,
}: {
  name: string;
  label: string;
}) => {
  const { control } = useFormContext();
  const [options, setOptions] = useState<(RankGroup & { inputValue?: string })[]>([]);
  const { loading } = useQuery(GET_RANK_GROUPS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        limit: 10000,
      },
    },
    onCompleted: (data) => {
      setOptions(data.rankGroups.items);
    },
  });

  const [createRankGroup] = useMutation(CREATE_RANK_GROUP, {
    onCompleted: (data) => {
      const newGroup = data.rankGroup;
      setOptions((prev) => [...prev, newGroup]);
    },
  });

  const handleCreateNewGroup = async (groupName: string) => {
    try {
      const res = await createRankGroup({
        variables: { input: { name: groupName } },
      });

      return res?.data?.rankGroup;
    } catch (error) {
      console.error('Error creating rank group:', error);
    }
    return null;
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          value={field.value || null}
          options={options}
          loading={loading}
          freeSolo
          filterOptions={(opts: any, params: any) => {
            const filtered = filter(opts, params);
            const { inputValue } = params;
            // Suggest the creation of a new value
            const isExisting = opts.some((option: any) => inputValue === option.name);
            if (inputValue !== '' && !isExisting) {
              filtered.push({
                inputValue: `Add: "${inputValue}"`,
                id: 'new',
                name: inputValue,
              } as any);
            }
    
            return filtered;
          }}
          onChange={async (event: any, newValue: any) => {
            let newVal;
            if (typeof newValue === 'string') {
              // Handle string input
              newVal = await handleCreateNewGroup(newValue);
            } else if (newValue?.inputValue) {
              // Handle dynamically created option
              newVal = await handleCreateNewGroup(newValue.name);
            } else {
              newVal = newValue;
            }

            if (newVal) {
              field.onChange(newVal);
            }
          }}
          getOptionLabel={(option) => {
            // Value selected with enter, right from the input
            if (typeof option === 'string') {
              return option;
            }

            // Add "xxx" option created dynamically
            if (option.inputValue) {
              return option.inputValue;
            }
            // Regular option
            return option.name;
          }}
          isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
          renderInput={(params: any) => (
            <TextField
              label={label}
              placeholder="Select or create a rank group"
              error={!!error}
              onChange={(...args) => {
                if (params.onChange) {
                  params.onChange(...args);
                }
              }}
              helperText={error?.message}
              {...params}
            />
          )}
        />
      )}
    />

  );
};
