import type { NextApiRequest, NextApiResponse } from 'next';
import { StationRecord, ApiResponse, SearchParams } from '../../types/station';

const DATA_GOUV_API_URL = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lat, lon, rayon, carburant, limit } = req.query;
    
    // Validate required parameters
    if (!lat || !lon || !rayon) {
      return res.status(400).json({ 
        error: 'Missing required parameters: lat, lon, rayon are required' 
      });
    }

    const params: SearchParams & { limit: number } = {
      lat: parseFloat(lat as string),
      lon: parseFloat(lon as string),
      rayon: parseFloat(rayon as string),
      carburant: carburant as string | undefined,
      limit: limit ? parseInt(limit as string) : DEFAULT_LIMIT,
    };
    
    const normalizedLimit = Number.isFinite(params.limit) ? params.limit : DEFAULT_LIMIT;

    // Validate parameters
    if (isNaN(params.lat) || isNaN(params.lon) || isNaN(params.rayon)) {
      return res.status(400).json({ 
        error: 'Invalid parameters: lat, lon and rayon must be numbers' 
      });
    }

    if (params.rayon <= 0 || params.rayon > 100) {
      return res.status(400).json({ 
        error: 'Invalid rayon: must be between 0 and 100 km' 
      });
    }

    if (normalizedLimit <= 0 || normalizedLimit > MAX_LIMIT) {
      return res.status(400).json({ 
        error: `Invalid limit: must be between 0 and ${MAX_LIMIT}` 
      });
    }

    // Validate latitude and longitude ranges
    if (params.lat < -90 || params.lat > 90) {
      return res.status(400).json({ 
        error: 'Invalid latitude: must be between -90 and 90' 
      });
    }

    if (params.lon < -180 || params.lon > 180) {
      return res.status(400).json({ 
        error: 'Invalid longitude: must be between -180 and 180' 
      });
    }

    // Build the geofilter using the API syntax
    // The API uses a geofilter with distance parameter in meters
    const radiusMeters = params.rayon * 1000;
    const geoFilter = `geofilter(distance,${params.lon},${params.lat},${radiusMeters})`;

    // Build the fuel filter condition
    let fuelCondition = '';
    if (params.carburant) {
      const fuelPrixField = `${params.carburant}_prix`;
      const fuelMajField = `${params.carburant}_maj`;
      fuelCondition = `${fuelPrixField} is not null and ${fuelMajField} is not null`;
    } else {
      // If no specific fuel, ensure at least one fuel has a valid price
      fuelCondition = 'gazole_prix is not null or sp95_prix is not null or sp98_prix is not null or e10_prix is not null or e85_prix is not null or gplc_prix is not null';
    }

    // Combine all conditions into a single where clause
    const whereClause = `${geoFilter} and (${fuelCondition})`;

    // Build the query URL
    const url = new URL(DATA_GOUV_API_URL);
    url.searchParams.append('where', whereClause);
    url.searchParams.append('limit', normalizedLimit.toString());

    // Add sorting by price (ascending) for the default fuel
    const sortField = params.carburant ? `${params.carburant}_prix` : 'gazole_prix';
    url.searchParams.append('order_by', `${sortField} asc`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        return res.status(500).json({ 
          error: 'Invalid API response format' 
        });
      }

      // Filter out stations with no valid prices or with fuel shortages
      const validStations = data.results.filter((record: StationRecord) => {
        // Check if the station has at least one valid fuel price that's not in shortage
        const fuels = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'] as const;
        
        for (const fuel of fuels) {
          const prix = record[`${fuel}_prix`];
          const rupture = record[`${fuel}_rupture`];
          
          if (prix !== null && prix > 0 && !rupture) {
            return true; // At least one valid fuel
          }
        }
        
        return false; // No valid fuels
      });

      // Limit results to the requested limit
      const limitedResults = validStations.slice(0, normalizedLimit);

      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
      res.setHeader('X-Data-Source', 'data.economie.gouv.fr');
      res.setHeader('X-Results-Total', (data.results?.length || 0).toString());
      
      return res.status(200).json({
        results: limitedResults,
        total: validStations.length,
      });

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Request to external API timed out' 
        });
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Error in stations API:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
