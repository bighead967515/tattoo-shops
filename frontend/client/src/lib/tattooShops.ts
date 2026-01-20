export interface TattooShop {
  name: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  email: string;
  specialties: string;
  rating: string;
  lat?: number;
  lng?: number;
}

export async function loadTattooShops(): Promise<TattooShop[]> {
  try {
    const response = await fetch('/tattoo-shops.csv');
    const text = await response.text();
    const lines = text.split('\n').slice(1); // Skip header
    
    const shops: TattooShop[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Parse CSV line (handling quoted fields with commas)
      const fields: string[] = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField.trim()); // Add last field
      
      const shop: TattooShop = {
        name: fields[0] || '',
        city: fields[1] || '',
        address: fields[2] || '',
        phone: fields[3] || '',
        website: fields[4] || '',
        facebook: fields[5] || '',
        instagram: fields[6] || '',
        email: fields[7] || '',
        specialties: fields[8] || '',
        rating: fields[9] || '',
      };
      
      if (shop.name) {
        shops.push(shop);
      }
    }
    
    return shops;
  } catch (error) {
    console.error('Error loading tattoo shops:', error);
    return [];
  }
}

export async function geocodeAddress(
  address: string,
  geocoder: google.maps.Geocoder
): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!address) {
      resolve(null);
      return;
    }
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
        });
      } else {
        resolve(null);
      }
    });
  });
}

export function parseRating(ratingString: string): { rating: number; count: number } {
  const match = ratingString.match(/([\d.]+)\/5\s*\((\d+)\s*ratings?\)/);
  if (match) {
    return {
      rating: parseFloat(match[1]),
      count: parseInt(match[2], 10),
    };
  }
  return { rating: 0, count: 0 };
}

export function getInitials(name: string): string {
  const words = name.split(' ').filter(w => w.length > 0);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
