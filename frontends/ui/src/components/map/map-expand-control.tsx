// @mui
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
// map
import { useControl } from "react-map-gl/maplibre";
import { UseBooleanReturnType } from "src/hooks/use-boolean";
import Iconify from "../iconify";

export function ExpandMapControl({ onClick }: { onClick: () => void }) {
  useControl(
    () => {
      const control = {
        onAdd: (map: any): HTMLElement => {
          // Check if our custom control already exists
          const existingControl = document.querySelector(".expand-map-control") as HTMLElement;
          if (existingControl) {
            // Update the click handler for the existing control
            const button = existingControl.querySelector("button");
            if (button) {
              // Remove old event listeners
              const newButton = button.cloneNode(true) as HTMLButtonElement;
              button.parentNode?.replaceChild(newButton, button);
              // Add new event listener
              newButton.addEventListener("click", onClick);
            }
            return existingControl;
          }

          const container = document.createElement("div");
          container.className = "maplibregl-ctrl maplibregl-ctrl-group expand-map-control";

          const button = document.createElement("button");
          button.className = "maplibregl-ctrl-icon";
          button.type = "button";
          button.title = "Expand Map";
          button.setAttribute("aria-label", "Expand Map");

          // Create icon using Material Icons font or SVG
          button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          `;

          button.style.border = "none";
          button.style.background = "none";
          button.style.cursor = "pointer";
          button.style.display = "flex";
          button.style.alignItems = "center";
          button.style.justifyContent = "center";

          button.addEventListener("click", onClick);

          container.appendChild(button);
          return container;
        },
        onRemove: () => {
          // Don't remove the control when component unmounts with reuseMaps
          // It will be reused by the next component instance
        },
      };
      return control;
    },
    {
      position: "top-left",
    },
  );

  return null;
}

interface IMapExpandDialogProps {
  dialogOpen: UseBooleanReturnType<any>;
  children?: React.ReactNode;
}

export function MapExpandDialog({ dialogOpen, children }: IMapExpandDialogProps) {
  return (
    <Dialog
      open={dialogOpen.value}
      onClose={dialogOpen.onFalse}
      maxWidth={false}
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          width: "90vw",
          height: "90vh",
          maxWidth: "none",
          maxHeight: "none",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6">Map View</Typography>
        <IconButton onClick={dialogOpen.onFalse} size="small">
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: "relative" }}>
        {dialogOpen.attribute && (
          {children}
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={dialogOpen.onFalse} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
