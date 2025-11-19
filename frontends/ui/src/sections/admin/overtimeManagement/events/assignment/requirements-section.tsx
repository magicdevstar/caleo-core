import { useQuery } from "@apollo/client";
import { useFormContext } from "react-hook-form";
import Checkbox from '@mui/material/Checkbox';
import Chip from "@mui/material/Chip";
import RHFRankAutocomplete from "src/components/ranks/rhf-rank";
import { useFeatures } from "src/hooks/use-features";
import { RHFAutocomplete, RHFSkillAutocomplete } from "src/components/hook-form";
import { GET_EQUIPMENT_SLIM } from "src/api/equipment";
import { EditSection } from "../common/section";

interface Props {
  disabled?: boolean;
  isComplete?: boolean;
}

export const AssignmentRequirementsSection = ({
  disabled,
  isComplete
}: Props) => {
  const { equipment: equipmentFeature } = useFeatures();
  const { setValue } = useFormContext();

  const { data: equipmentData } = useQuery(GET_EQUIPMENT_SLIM, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
      }
    },
    skip: !equipmentFeature,
  });
  const equipment = equipmentData?.equipments?.items || [];

  return (
    <EditSection title="Requirements" description="Personnel requirements.">
      <RHFRankAutocomplete
        name="ranks"
        setValue={setValue}
        disabled={disabled}
        isComplete={isComplete}
      />

      <RHFSkillAutocomplete
        name="requiredSkills"
        label="Required Skills"
        disabled={disabled || isComplete}
        helperText="Leave empty to not require any skills"
      />

      {
        equipmentFeature && (
          <RHFAutocomplete
            name="requiredEquipment"
            placeholder="Required Equipment"
            disabled={disabled || isComplete}
            multiple
            disableCloseOnSelect
            helperText="Leave empty to not require any equipment"
            options={(equipment || [])}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(e: any) => e?.name}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option?.id}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                {option?.name}
              </li>
            )}
            renderTags={(selected, getTagProps) =>
              selected.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option?.id}
                  label={option?.name}
                  size="small"
                  color="info"
                  variant="soft"
                />
              ))
            }
          />
        )
      }
    </EditSection>
  );
}
