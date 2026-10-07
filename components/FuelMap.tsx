'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StationData } from '../types/station';
import { formatPrice, formatDate } from '../lib/stations';

// Fix for default marker icons in Next.js
// This is necessary because Leaflet's default icon paths don't work in Next.js
const fixLeafletIcons = () => {
  const defaultIcon = L.Icon.Default.prototype as L.Icon.Default & { options: Record<string, unknown> };

  defaultIcon.options = {
    iconUrl: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41"><path fill="%230070f3" d="M12 2C8.1 2 5 5.2 5 9c0 4.1 5.7 11.8 5.7 11.8S19 13.1 19 9c0-3.8-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/></svg>',
    iconRetinaUrl: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41"><path fill="%230070f3" d="M12 2C8.1 2 5 5.2 5 9c0 4.1 5.7 11.8 5.7 11.8S19 13.1 19 9c0-3.8-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/></svg>',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: null,
  };
};

// Custom SVG icon for fuel stations
const createFuelIcon = (fuelType?: string) => {
  const color = fuelType === 'gazole'
    ? '%2328a745'
    : fuelType === 'sp95'
      ? '%23ffc107'
      : fuelType === 'sp98'
        ? '%23fd7e14'
        : fuelType === 'e10'
          ? '%2317a2b8'
          : fuelType === 'e85'
            ? '%236f42c1'
            : '%230070f3';

  return L.icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${color}"/><text x="16" y="18" text-anchor="middle" fill="white" font-size="8" font-weight="bold">F</text></svg>`,
    iconSize: [25, 25],
    iconAnchor: [12.5, 25],
    popupAnchor: [0, -25],
    className: 'fuel-marker-icon',
  });
};

// Component to handle map view changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

interface FuelMapProps {
  stations: StationData[];
  center: [number, number];
  zoom?: number;
  height?: string;
}

const FuelMap: React.FC<FuelMapProps> = ({
  stations,
  center,
  zoom = 13,
  height = '400px',
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fixLeafletIcons();
  }, []);

  if (!isClient) {
    return (
      <div
        style={{
          width: '100%',
          height: height,
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ccc',
        }}
      >
        <p>Chargement de la carte...</p>
      </div>
    );
  }

  // Filter and prepare fuel data for each station
  const stationsWithValidFuel = stations.filter(station => {
    return Object.values(station.carburants).some(fuel => fuel && !fuel.enRupture);
  });

  return (
    <div style={{ width: '100%', height: height, position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
      >
        <ChangeView center={center} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {stationsWithValidFuel.map((station) => {
          const carburants = station.carburants;
          const validFuels = Object.entries(carburants)
            .filter(([, data]) => data && !data.enRupture)
            .sort((a, b) => a[1].prix - b[1].prix);
          
          if (validFuels.length === 0) return null;
          
          const [fuelType, fuelData] = validFuels[0];

          return (
            <Marker
              key={station.id}
              position={[station.latitude, station.longitude]}
              title={station.nom}
              icon={createFuelIcon(fuelType)}
            >
              <Popup>
                <div className="station-popup">
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                    {station.nom}
                  </h3>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    {station.adresse}, {station.codePostal} {station.ville}
                  </p>
                  <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ccc' }} />

                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
                    Meilleur prix :
                  </h4>

                  <div style={{ marginBottom: '4px' }}>
                    <strong>{fuelType.toUpperCase()}:</strong> {formatPrice(fuelData.prix)} €/L
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Mis à jour: {formatDate(fuelData.dateMaj)}
                  </div>

                  <h4 style={{ margin: '8px 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
                    Autres carburants :
                  </h4>

                  <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                    {Object.entries(carburants)
                      .filter(([type]) => type !== fuelType)
                      .map(([type, data]) => {
                        if (!data) return null;
                        
                        return (
                          <div
                            key={type}
                            style={{
                              margin: '2px 0',
                              fontSize: '12px',
                              padding: '2px 4px',
                              backgroundColor: data.enRupture ? '#fee' : 'transparent',
                            }}
                          >
                            <strong>{type.toUpperCase()}:</strong> {formatPrice(data.prix)} €/L
                            {data.enRupture && ' (Rupture)'}
                            <br />
                            <small>Mis à jour: {formatDate(data.dateMaj)}</small>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default FuelMap;
