import { memo, useState } from 'react';
import Map, { Popup } from 'react-map-gl/maplibre';
import { styled } from "@mui/material/styles";
import Card from '@mui/material/Card';
// components
import { MapMarker, MapControl, MapBoxProps } from 'src/components/map';
import { DEFAULT_MAP_TILES } from 'src/config-global';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { IMarkerDetails } from 'src/types/event-dashboard';

// ----------------------------------------------------------------------

interface Props extends MapBoxProps {
  data: IMarkerDetails[];
  showHover?: boolean;
  markerSelected?: (data: IMarkerDetails) => void;
}

function MapMarkersPopups({ data, markerSelected, showHover, ...other }: Props) {
  const [markerItem, setMarkerItem] = useState<IMarkerDetails | null>(null);
  return (
    <StyledMapContainer>
      <Map
        reuseMaps
        initialViewState={{
          zoom: 10,
        }}
        mapStyle={DEFAULT_MAP_TILES}
        {...other}
      >
        <MapControl />

        {data.map((point, index) => (
          <MapMarker
            onMouseOver={() => setMarkerItem(point)}
            onMouseOut={() => setMarkerItem(null)}
            onClick={() => markerSelected?.(point)}
            color={point.color}
            key={`marker-${point.name}`}
            index={index}
            latitude={point.latitude}
            longitude={point.longitude}
          />
        ))}

        {showHover && markerItem && (
          <Popup
            anchor="top"
            offset={[-8, 0]}
            closeButton={false}
            longitude={Number(markerItem?.longitude)}
            latitude={Number(markerItem?.latitude)}
          >
            <StyledCard>
              <CardContent>
                <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                  {markerItem?.callSign}
                </Typography>
                <Typography variant="h5" component="div">
                  {markerItem?.name}
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{markerItem?.status}</Typography>
              </CardContent>
            </StyledCard>
          </Popup>
        )}
      </Map>
    </StyledMapContainer>
  );
}

export default memo(MapMarkersPopups);

const StyledMapContainer = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  '& .maplibregl-popup': {
    maxWidth: 'none',
  },
  '& .maplibregl-popup-content': {
    background: 'transparent !important',
    padding: '0 !important',
    boxShadow: 'none !important',
  },
  '& .maplibregl-popup-tip': {
    display: 'none !important',
  },
  ...(theme.palette.mode === 'dark' ? {
    '& .maplibregl-canvas': {
      filter: 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)',
    },
  } : {}),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderBottom: `8px solid ${theme.palette.background.paper}`,
  },
}));
