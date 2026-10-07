'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { StationData } from '../../types/station';
import { transformStationRecord, formatPrice, formatDate } from '../../lib/stations';

// Leaflet touches window on import, so the map must only load in the browser
const FuelMap = dynamic(() => import('../../components/FuelMap'), { ssr: false });

const FuelTestPage: React.FC = () => {
  const [stations, setStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [searchParams, setSearchParams] = useState({
    lat: 48.8566,
    lon: 2.3522,
    rayon: 10,
  });
  
  const [submitCount, setSubmitCount] = useState(0);

  // Default test location: Paris
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        lat: searchParams.lat.toString(),
        lon: searchParams.lon.toString(),
        rayon: searchParams.rayon.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/stations?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des stations');
      }

      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        const transformedStations = data.results
          .map(transformStationRecord)
          .filter((station: StationData) => Object.keys(station.carburants).length > 0);
        
        setStations(transformedStations);
        
        // Update map center if we have results
        if (transformedStations.length > 0) {
          setMapCenter([searchParams.lat, searchParams.lon]);
        }
      } else {
        setStations([]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    // Load stations on initial page load
    fetchStations();
  }, [fetchStations, submitCount]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmitCount(prev => prev + 1);
  }, []);

  const handleParamChange = useCallback((param: keyof typeof searchParams, value: string) => {
    setSearchParams(prev => ({
      ...prev,
      [param]: param === 'lat' || param === 'lon' || param === 'rayon' 
        ? parseFloat(value) 
        : value,
    }));
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSearchParams(prev => ({
            ...prev,
            lat: latitude,
            lon: longitude,
          }));
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          setError(`Impossible d'obtenir la position: ${error.message}`);
        }
      );
    } else {
      setError('La géolocalisation nest pas supportée par votre navigateur');
    }
  }, []);

  // Test locations presets
  const testLocations = [
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Lyon', lat: 45.7640, lon: 4.8357 },
    { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
    { name: 'Bordeaux', lat: 44.8378, lon: -0.5792 },
    { name: 'Toulouse', lat: 43.6047, lon: 1.4442 },
  ];

  const setTestLocation = useCallback((location: { lat: number; lon: number; name: string }) => {
    setSearchParams(prev => ({
      ...prev,
      lat: location.lat,
      lon: location.lon,
    }));
    setMapCenter([location.lat, location.lon]);
    setSubmitCount(prev => prev + 1);
  }, []);

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        Test d'affichage des stations-service
      </h1>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h2 style={{ marginTop: 0, color: '#555' }}>Paramètres de recherche</h2>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Latitude:
              </label>
              <input
                type="number"
                step="0.0001"
                value={searchParams.lat}
                onChange={(e) => handleParamChange('lat', e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Longitude:
              </label>
              <input
                type="number"
                step="0.0001"
                value={searchParams.lon}
                onChange={(e) => handleParamChange('lon', e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Rayon (km):
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={searchParams.rayon}
                onChange={(e) => handleParamChange('rayon', e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: loading ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
            
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Position actuelle
            </button>
          </div>

          <div style={{ marginTop: '15px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
              Localisations tests rapides :
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {testLocations.map((location) => (
                <button
                  key={location.name}
                  type="button"
                  onClick={() => setTestLocation(location)}
                  style={{ 
                    padding: '5px 10px', 
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Error display */}
      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '20px'
        }}>
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {/* Results summary */}
      {stations.length > 0 && (
        <div style={{ 
          backgroundColor: '#e7f3ff', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #b3d9ff',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0, color: '#004085' }}>
            {stations.length} stations trouvées
          </h2>
        </div>
      )}

      {/* Split screen: map and list */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        flexDirection: 'column' 
      }}>
        {/* Map */}
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <FuelMap
            stations={stations}
            center={mapCenter}
            zoom={13}
            height="500px"
          />
        </div>

        {/* Stations list */}
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: 'white',
          maxHeight: '500px',
          overflowY: 'auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Liste des stations</h3>
          
          {stations.length === 0 && !loading && !error && (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              Aucune station trouvée avec les critères actuels.
            </p>
          )}

          {stations.map((station) => {
            const cheapest = Object.entries(station.carburants)
              .filter(([_, data]) => !data.enRupture)
              .sort((a, b) => a[1].prix - b[1].prix)[0];

            if (!cheapest) return null;

            const [fuelType, fuelData] = cheapest;

            return (
              <div
                key={station.id}
                style={{ 
                  padding: '15px', 
                  marginBottom: '10px', 
                  border: '1px solid #eee', 
                  borderRadius: '6px',
                  backgroundColor: '#fff'
                }}
              >
                <h4 style={{ margin: 0, color: '#0070f3' }}>
                  {station.nom}
                </h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>
                  {station.adresse}, {station.codePostal} {station.ville}
                </p>
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                  Coordonnées: {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                </p>
                
                <div style={{ marginTop: '10px' }}>
                  <strong>Meilleur prix: </strong>
                  <span style={{ fontSize: '16px', color: '#28a745', fontWeight: 'bold' }}>
                    {fuelType.toUpperCase()}: {formatPrice(fuelData.prix)} €/L
                  </span>
                  <br />
                  <small style={{ color: '#888' }}>
                    Mis à jour: {formatDate(fuelData.dateMaj)}
                  </small>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <strong>Autres carburants:</strong>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {Object.entries(station.carburants)
                      .filter(([type, _]) => type !== fuelType)
                      .map(([type, data]) => (
                        <span
                          key={type}
                          style={{ 
                            fontSize: '13px',
                            padding: '2px 6px',
                            backgroundColor: data.enRupture ? '#fee' : '#f0f0f0',
                            borderRadius: '3px',
                            border: '1px solid #ddd'
                          }}
                        >
                          {type.toUpperCase()}: {formatPrice(data.prix)} €/L
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer style={{ 
        marginTop: '30px', 
        padding: '15px', 
        textAlign: 'center', 
        color: '#666',
        fontSize: '12px'
      }}>
        <p>
          Données fournies par l'API officielle du gouvernement français: 
          <a href="https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records"
             style={{ color: '#0070f3' }}>
            Prix des carburants en France
          </a>
        </p>
        <p>
          Carte: © <a href="https://www.openstreetmap.org/copyright" style={{ color: '#0070f3' }}>OpenStreetMap</a> contributors
        </p>
      </footer>
    </div>
  );
};

export default FuelTestPage;
