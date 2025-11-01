import { memo } from 'react';
import { styled } from "@mui/material/styles";
import Map from 'react-map-gl/maplibre';
// components
import { MapMarker, MapControl, MapBoxProps } from 'src/components/map';
import { DEFAULT_MAP_TILES } from 'src/config-global';

// ----------------------------------------------------------------------

type DataProps = {
  name: string;
  latitude: number;
  longitude: number;
};

interface Props extends MapBoxProps {
  data: DataProps[];
}

function MapWithMarkers({ data, ...other }: Props) {
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
            key={`marker-${point.name}`}
            index={index}
            latitude={point.latitude}
            longitude={point.longitude}
          />
        ))}
      </Map>
    </StyledMapContainer>
  );
}

export default memo(MapWithMarkers);

const StyledMapContainer = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  ...(theme.palette.mode === 'dark' ? {
    '& .maplibregl-canvas': {
      filter: 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)',
    },
  } : {}),
}));
