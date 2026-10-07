import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Point, CoutStationTournee, eur } from '../lib/cout';
import { Livraison } from '../lib/tournee';
import { StationData } from '../types/station';

interface Props {
  position: Point | null;
  trace: Point[];
  arrets: Livraison[];
  classement: CoutStationTournee[];
  suivre: boolean;
  proche?: StationData | null;
  onDeplacement: () => void;
}

function Suivi({ position, suivre, onDeplacement }: Pick<Props, 'position' | 'suivre' | 'onDeplacement'>) {
  const map = useMap();
  useEffect(() => {
    if (suivre && position) map.setView([position.lat, position.lon], Math.max(map.getZoom(), 14));
  }, [position, suivre, map]);
  useMapEvents({ dragstart: onDeplacement });
  return null;
}

export default function LiveMap({ position, trace, arrets, classement, suivre, proche, onDeplacement }: Props) {
  const best = classement[0];
  return (
    <MapContainer center={[48.8566, 2.3522]} zoom={13} style={{ height: '100%', width: '100%', background: 'var(--surface)' }} zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
      <Suivi position={position} suivre={suivre} onDeplacement={onDeplacement} />
      {trace.length > 1 && <Polyline positions={trace.map((p) => [p.lat, p.lon])} pathOptions={{ color: 'var(--route)', weight: 5 }} />}
      {classement.slice(0, 10).map((c) => (
        <CircleMarker key={c.station.id} center={[c.station.latitude, c.station.longitude]} radius={c === best ? 11 : 7}
          pathOptions={{ color: 'white', weight: 2, fillColor: c === best ? '#fa500f' : c.prix === Math.min(...classement.map((x) => x.prix)) ? '#ffaf00' : '#1e1e1e', fillOpacity: 1 }}>
          <Popup>
            <b>{c.station.adresse}</b><br />
            {c.prix.toFixed(3).replace('.', ',')} €/L · détour {c.detourKm.toFixed(1)} km<br />
            Coût réel : <b>{eur(c.coutReel)}</b>
          </Popup>
        </CircleMarker>
      ))}
      {position && arrets.length > 0 && (
        <Polyline positions={[position, ...arrets].map((p) => [p.lat, p.lon])} pathOptions={{ color: 'var(--route)', weight: 3, opacity: 0.35 }} />
      )}
      {position && best && !arrets.some((a) => a.plein) && (() => {
        const pts = [position, ...arrets];
        const a = pts[best.troncon], b = pts[best.troncon + 1];
        return <Polyline positions={[[a.lat, a.lon], [best.station.latitude, best.station.longitude], [b.lat, b.lon]]}
          pathOptions={{ color: '#fa500f', dashArray: '7 5', weight: 3 }} />;
      })()}
      {arrets.map((l, i) => (
        <CircleMarker key={l.id} center={[l.lat, l.lon]} radius={l.plein ? 14 : i === 0 ? 12 : 9}
          pathOptions={{ color: l.plein ? '#fa500f' : 'white', weight: l.plein ? 3 : 2,
            fillColor: l.plein ? '#ffd800' : i === 0 ? '#e10500' : '#6b5f4f', fillOpacity: 1 }}>
          <Tooltip permanent direction="center" className="num">{l.plein ? '⛽' : i + 1}</Tooltip>
          <Popup><b>{l.client}</b><br />{l.adresse}</Popup>
        </CircleMarker>
      ))}
      {position && <CircleMarker center={[position.lat, position.lon]} radius={9} pathOptions={{ color: 'white', weight: 3, fillColor: '#1e1e1e', fillOpacity: 1 }} />}
    </MapContainer>
  );
}
