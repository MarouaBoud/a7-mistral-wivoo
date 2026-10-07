import React from 'react';
import Link from 'next/link';

const HomePage: React.FC = () => {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '50px 20px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        Optimisation Carburant Flotte - A7
      </h1>

      <p style={{ 
        fontSize: '18px', 
        lineHeight: 1.6, 
        color: '#666',
        marginBottom: '40px'
      }}>
        Solution pour optimiser le choix des stations-service en tenant compte
du coût réel incluant le détour et le temps du chauffeur.
      </p>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px',
        marginBottom: '40px'
      }}>
        <Link
          href="/comparateur"
          style={{ 
            padding: '15px 30px', 
            backgroundColor: '#0070f3',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '#0061d6';
          }}
          onMouseOut={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '#0070f3';
          }}
        >
          Comparer les stations (coût réel)
        </Link>

        <p style={{ color: '#888', fontSize: '14px' }}>
          Accédez à la démonstration de l\'intégration carte et stations-service
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        textAlign: 'left'
      }}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>
          Fonctionnalités
        </h2>
        <ul style={{ 
          listStyle: 'disc', 
          paddingLeft: '20px',
          color: '#555',
          lineHeight: 1.6
        }}>
          <li>Affichage des stations-service sur carte OpenStreetMap</li>
          <li>Recherche par coordonnées géographiques</li>
          <li>Prix des carburants en temps réel (source: data.gouv.fr)</li>
          <li>Filtrage des stations sans carburant disponible ou en rupture</li>
          <li>Affichage des dates de mise à jour des prix</li>
        </ul>
      </div>

      <footer style={{ 
        marginTop: '40px', 
        padding: '15px', 
        color: '#999',
        fontSize: '14px'
      }}>
        <p>
          Projet A7 - Transport & Flotte | 
          Données: <a href="https://data.economie.gouv.fr" style={{ color: '#0070f3' }}>
            data.economie.gouv.fr
          </a>
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
