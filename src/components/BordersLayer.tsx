import { TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';

/** Confini paesi/regioni sopra le mappe temperature e vento */
export default function BordersLayer({ showLabels = true }: { showLabels?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane('bordersPane')) {
      const pane = map.createPane('bordersPane');
      pane.style.zIndex = '460';
      pane.style.pointerEvents = 'none';
    }
    if (showLabels && !map.getPane('placeLabelsPane')) {
      const labelPane = map.createPane('placeLabelsPane');
      labelPane.style.zIndex = '470';
      labelPane.style.pointerEvents = 'none';
    }
  }, [map, showLabels]);

  return (
    <>
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        pane="bordersPane"
        opacity={0.92}
        maxZoom={22}
        maxNativeZoom={19}
        zIndex={460}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}"
        pane="bordersPane"
        opacity={0.5}
        maxZoom={22}
        maxNativeZoom={19}
        zIndex={461}
      />
      {showLabels && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}"
          pane="placeLabelsPane"
          opacity={0.8}
          maxZoom={22}
          maxNativeZoom={19}
          zIndex={470}
        />
      )}
    </>
  );
}
