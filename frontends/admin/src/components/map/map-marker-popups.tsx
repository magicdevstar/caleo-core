import { memo } from 'react';
import Map from 'react-map-gl';
// components
import { MapMarker, MapControl, MapBoxProps } from 'src/components/map';

// ----------------------------------------------------------------------

type DataProps = {
  name: string;
  latitude: number;
  longitude: number;
};

interface Props extends MapBoxProps {
  data: DataProps[];
}

function MapMarkersPopups({ data, ...other }: Props) {
  return (
    <Map
      initialViewState={{
        zoom: 10,
      }}
      {...other}
    >
      <MapControl />

      {data.map((point, index) => (
        <MapMarker
          key={`marker-${point.name}`}
          latitude={point.latitude}
          longitude={point.longitude}
        />
      ))}
    </Map>
  );
}

export default memo(MapMarkersPopups);
