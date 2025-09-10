// map
import { useControl } from "react-map-gl/maplibre";

interface PinControlProps {
  onAddPin: () => void;
  onDeletePin: () => void;
  disabled: boolean;
  hasPin: boolean;
}

export function PinControl({ onAddPin, onDeletePin, disabled, hasPin }: PinControlProps) {
  useControl(
    () => {
      const control = {
        onAdd: (map: any): HTMLElement => {
          // Check if our custom control already exists
          const existingControl = document.querySelector(".pin-control") as HTMLElement;
          if (existingControl) {
            // Remove and recreate the control to update handlers
            existingControl.remove();
          }

          const container = document.createElement("div");
          container.className = "maplibregl-ctrl maplibregl-ctrl-group pin-control";
          container.title = "Reporting location";
          container.setAttribute("aria-label", "Reporting location");

          // Add Pin Button
          const addButton = document.createElement("button");
          addButton.className = "maplibregl-ctrl-icon";
          addButton.type = "button";
          addButton.title = disabled ? "Pin disabled" : "Set Reporting Location";
          addButton.setAttribute("aria-label", disabled ? "Pin disabled" : "Set Reporting Location");
          addButton.disabled = disabled;

          // Create pin icon using SVG
          addButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5a2.5 2.5 0 0 1 0-5a2.5 2.5 0 0 1 0 5"/></svg>`;

          addButton.style.border = "none";
          addButton.style.background = "none";
          addButton.style.cursor = disabled ? "not-allowed" : "pointer";
          addButton.style.display = "flex";
          addButton.style.alignItems = "center";
          addButton.style.justifyContent = "center";
          addButton.style.opacity = disabled ? "0.5" : "1";

          if (!disabled) {
            addButton.addEventListener("click", onAddPin);
          }

          container.appendChild(addButton);

          // Delete Pin Button (only show when there's a pin)
          const deleteButton = document.createElement("button");
          deleteButton.className = "maplibregl-ctrl-icon";
          deleteButton.type = "button";
          deleteButton.title = disabled ? "Delete disabled" : "Delete Reporting Location";
          deleteButton.setAttribute("aria-label", disabled ? "Delete disabled" : "Delete Reporting Location");
          deleteButton.disabled = disabled;

          // Create delete icon using SVG
          deleteButton.innerHTML = `<button class="mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_trash" title="Delete"></button>`;

          deleteButton.style.border = "none";
          deleteButton.style.background = "none";
          deleteButton.style.cursor = disabled ? "not-allowed" : "pointer";
          deleteButton.style.display = "flex";
          deleteButton.style.alignItems = "center";
          deleteButton.style.justifyContent = "center";
          deleteButton.style.opacity = disabled ? "0.5" : "1";
          deleteButton.style.borderTop = '1px solid rgba(145, 158, 171, 0.2)';

          if (!disabled) {
            deleteButton.addEventListener("click", onDeletePin);
          }

          container.appendChild(deleteButton);

          return container;
        },
        onRemove: () => {
          // Don't remove the control when component unmounts with reuseMaps
          // It will be reused by the next component instance
        },
      };
      return control;
    },
    () => {
      // No cleanup needed
    },
    {
      position: "top-right",
    },
  );

  return null;
}
