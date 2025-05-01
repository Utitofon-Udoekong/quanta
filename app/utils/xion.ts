import { toast } from '@/app/components/helpers/toast';
import { Token } from '@/app/types';
// Xion token configuration
export const TOKEN_DENOM = process.env.tokenDenom;
export const DECIMALS = 6;
export const DENOM_DISPLAY_NAME = 'XION'
export const RPC_URL = process.env.rpcUrl;
export const REST_URL = process.env.restUrl;
// Cache for price data to avoid excessive API calls
let priceCache: { price: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches the current Xion price in USD from our server endpoint
 * @returns Promise with the Xion price in USD
 */
export async function getXionPrice(): Promise<number> {
  // Check if we have a cached price that's still valid
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
    return priceCache.price;
  }

  try {
    // Fetch price from our server endpoint
    const response = await fetch('/api/xion-price');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Xion price: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Extract the price from the response
    const price = data.price;
    
    if (!price) {
      throw new Error('Xion price not found in response');
    }
    
    // Update the cache
    priceCache = {
      price,
      timestamp: Date.now()
    };
    
    return price;
  } catch (error) {
    console.error('Error fetching Xion price:', error);
    toast.error('Failed to fetch Xion price. Using fallback value.');
    
    // Return a fallback price if the API call fails
    return 1.0; // Fallback to 1 USD = 1 Xion
  }
}

/**
 * Converts USD amount to Xion tokens
 * @param usdAmount Amount in USD
 * @returns Promise with the equivalent amount in Xion tokens
 */
export async function usdToXion(usdAmount: number): Promise<number> {
  const xionPrice = await getXionPrice();
  return usdAmount / xionPrice;
}

/**
 * Converts Xion tokens to USD
 * @param xionAmount Amount in Xion tokens
 * @returns Promise with the equivalent amount in USD
 */
export async function xionToUsd(xionAmount: number): Promise<number> {
  const xionPrice = await getXionPrice();
  return xionAmount * xionPrice;
}

/**
 * Formats a Xion amount with the appropriate number of decimals
 * @param amount Amount in Xion tokens
 * @param decimals Number of decimal places to display
 * @returns Formatted string
 */
export function formatXionAmount(amount: number, decimals: number = 2): string {
  return amount.toFixed(decimals);
}

/**
 * Formats a USD amount with the appropriate number of decimals
 * @param amount Amount in USD
 * @param decimals Number of decimal places to display
 * @returns Formatted string
 */
export function formatUsdAmount(amount: number, decimals: number = 2): string {
  return amount.toFixed(decimals);
} 

export const tokenDenoms: Token[] = [
  {
    base: "ibc/13B2C536BB057AC79D5616B8EA1B9540EC1F2170718CAFF6F0083C966FFFED0B",
    symbol: "OSMO",
    icon: "https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/osmosis/asset/osmo.png"
  },
  {
    base: "ibc/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162A1A47DB930D40D8AF4",
    symbol: "USDC",
    icon: "https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/noble/asset/usdc.png"
  },
  {
    base: "uxion",
    symbol: "XION",
    icon: "https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/xion/asset/xion.png"
  }
];
