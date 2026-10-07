import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Point } from '../lib/cout';
import { Livraison } from '../lib/tournee';

interface Props {
  position: Point | null;
  trace: Point[];
  arrets: Livraison[];
  suivre: boolean;
  onDeplacement: () => void;
}

const camion = L.divIcon({ className: 'pj-camion', html: '<div>🚚</div>', iconSize: [40, 40], iconAnchor: [20, 20] });
const etiquetteStation = (titre: string, sous: string) => L.divIcon({
  className: 'pj-station', iconSize: [0, 0], iconAnchor: [0, 0],
  html: `<div class="pin">⛽</div><div class="lbl"><b>${titre}</b><span>${sous}</span></div>`,
});

function Suivi({ position, suivre, plein, onDeplacement }: Pick<Props, 'position' | 'suivre' | 'onDeplacement'> & { plein?: Livraison }) {
  const map = useMap();
  // Dès qu'une station est choisie : cadrer camion + station pour voir où aller
  useEffect(() => {
    if (!position || !plein) return;
    map.fitBounds(L.latLngBounds([[position.lat, position.lon], [plein.lat, plein.lon]]), { paddingTopLeft: [40, 170], paddingBottomRight: [40, 330], maxZoom: 16 });
  }, [plein?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (suivre && position && !plein) map.setView([position.lat, position.lon], Math.max(map.getZoom(), 14));
  }, [position, suivre, plein, map]);
  useMapEvents({ dragstart: onDeplacement });
  return null;
}

export default function LiveMap({ position, trace, arrets, suivre, onDeplacement }: Props) {
  const plein = arrets.find((a) => a.plein);
  const livraisons = arrets.filter((a) => !a.plein);
  const apresPlein = livraisons[0];
  return (
    <MapContainer center={[48.8566, 2.3522]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="© OpenStreetMap © CARTO" />
      <Suivi position={position} suivre={suivre} plein={plein} onDeplacement={onDeplacement} />
      {trace.length > 1 && <Polyline positions={trace.map((p) => [p.lat, p.lon])} pathOptions={{ color: '#1e1e1e', weight: 4, opacity: 0.5 }} />}

      {/* Tournée restante, discrète */}
      {position && livraisons.length > 0 && (
        <Polyline positions={[position, ...livraisons].map((p) => [p.lat, p.lon])} pathOptions={{ color: '#1e1e1e', weight: 3, opacity: plein ? 0.15 : 0.35, dashArray: '2 8' }} />
      )}
      {livraisons.map((l, i) => (
        <CircleMarker key={l.id} center={[l.lat, l.lon]} radius={i === 0 ? 11 : 8}
          pathOptions={{ color: 'white', weight: 2, fillColor: i === 0 ? '#e10500' : '#6b5f4f', fillOpacity: plein ? 0.6 : 1 }}>
          <Tooltip permanent direction="center" className="num">{i + 1}</Tooltip>
          <Popup><b>{l.client}</b><br />{l.adresse}</Popup>
        </CircleMarker>
      ))}

      {/* Station choisie : trajet camion → station en plein, puis station → livraison suivante */}
      {position && plein && (
        <>
          <Polyline positions={[[position.lat, position.lon], [plein.lat, plein.lon]]} pathOptions={{ color: '#fa500f', weight: 7, opacity: 0.9 }} />
          {apresPlein && <Polyline positions={[[plein.lat, plein.lon], [apresPlein.lat, apresPlein.lon]]} pathOptions={{ color: '#fa500f', weight: 4, dashArray: '8 8', opacity: 0.7 }} />}
          <Marker position={[plein.lat, plein.lon]} zIndexOffset={500}
            icon={etiquetteStation(plein.client.replace('⛽ Plein · ', ''), plein.adresse.split(' · ').slice(0, 2).join(' · '))} />
        </>
      )}

      {position && <Marker position={[position.lat, position.lon]} icon={camion} zIndexOffset={1000} />}
    </MapContainer>
  );
}
