import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Assignment } from "src/__generated__/resolvers-types";
import { GET_ASSIGNMENT_DIVISIONS } from "src/api/assignmentDivision";
import { GET_ASSIGNMENT_GROUPS } from "src/api/assignmentGroup";
import { GET_BRANCHES } from "src/api/branch";
import { RHFEditor, RHFGQLSearchAutocomplete, RHFSwitch, RHFTextField } from "src/components/hook-form";
import RHFAutocompleteGeocode from "src/components/hook-form/rhf-autocomplete-geocode";
import { RHFMapWithBoundingBox } from "src/components/map/map-bounding-box";
import { useFeatures } from "src/hooks/use-features";
import { EditSection } from "../common/section";

interface Props {
  disabled: boolean;
  signingAuthorityAssignment: boolean;
  currentAssignment?: Assignment;
}

export const AssignmentDetailsSection = ({
  currentAssignment,
  disabled,
  signingAuthorityAssignment,
}: Props) => {
  const { watch, setValue } = useFormContext();
  const { callSign, lasdEventFields } = useFeatures();
  const address = watch('assignmentLocationAddress');

  useEffect(() => {
    // Only set when the address is selected from mapbox
    if (address?.geometry?.coordinates) {
      const point = address.geometry.coordinates;
      setValue('assignmentLocationPosition', point);
    }
  }, [address, setValue]);

  return (
    <EditSection title="Details" description="Name, notes, etc.">
      <RHFTextField disabled={disabled} name="name" label="Name" />

      {callSign && (
        <RHFTextField
          disabled={disabled}
          name="callSign"
          label="Call Sign"
        />
      )}

      <Stack direction="row" spacing={2}>
        {
          signingAuthorityAssignment && (
            <RHFSwitch
              helperText={(currentAssignment?.shifts?.length || 0) > 1 ? 'Supervisor assignments are only allowed with a single shift slot' : ''}
              disabled={(currentAssignment?.shifts?.length || 0) > 1}
              name="isSigningAuthority"
              label="Supervisor"
            />
          )
        }
        { lasdEventFields && (<RHFSwitch name="includeDriveTime" label="Include Drive Time" />) }
      </Stack>

      {
        lasdEventFields && (
          <>
            <RHFGQLSearchAutocomplete
              name="branch"
              label="Branch"
              query={GET_BRANCHES}
              responseKey='branches'
            />
            <RHFGQLSearchAutocomplete
              name="assignmentDivision"
              label="Division"
              query={GET_ASSIGNMENT_DIVISIONS}
              responseKey='assignmentDivisions'
            />
            <RHFGQLSearchAutocomplete
              name="assignmentGroup"
              label="Group"
              query={GET_ASSIGNMENT_GROUPS}
              responseKey='assignmentGroups'
            />
            <RHFAutocompleteGeocode disabled={disabled} name="assignmentLocationAddress" label="Assignment Location" />
            <RHFMapWithBoundingBox name="assignmentArea" pinName="assignmentLocationPosition" />
            <RHFTextField disabled={disabled} name="radioFrequency" label="Radio Frequency" />
          </>
        )
      }

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Notes</Typography>
        <RHFEditor readOnly={disabled} simple name="description" />
      </Stack>

      <RHFSwitch disabled={disabled} name="notifyWhenFullyStaffed" label="Notify when fully staffed" />
    </EditSection>
  )
}
