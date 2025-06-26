import { NextResponse } from 'next/server';

// CoinGecko API endpoint for Xion price
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
const COINGEKO_API_KEY = process.env.coingeckoApiKey;

// Cache for price data to avoid excessive API calls
let priceCache: { price: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET() {
  try {
    // Check if we have a cached price that's still valid
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ price: priceCache.price });
    }

    // Fetch price from CoinGecko
    const response = await fetch(
      `${COINGECKO_API_URL}?ids=xion-2&vs_currencies=usd`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-cg-demo-api-key': COINGEKO_API_KEY || ''
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Xion price: ${response.statusText}`);
    }
    
    const data = await response.json();
    // Extract the price from the response
    const price = data['xion-2'].usd;
    if (!price) {
      throw new Error('Xion price not found in response');
    }
    
    // Update the cache
    priceCache = {
      price,
      timestamp: Date.now()
    };
    
    return NextResponse.json({ price });
  } catch (error) {
    // console.error('Error fetching Xion price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Xion price' },
      { status: 500 }
    );
  }
} 