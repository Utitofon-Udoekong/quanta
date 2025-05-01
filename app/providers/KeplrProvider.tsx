import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Window as KeplrWindow } from "@keplr-wallet/types";
import { Coin, OfflineSigner } from '@cosmjs/proto-signing';
import { toast } from '@/app/components/helpers/toast';
import { StargateClient } from '@cosmjs/stargate';
import { DECIMALS, getXionPrice, RPC_URL } from '@/app/utils/xion';

declare global {
    interface Window extends KeplrWindow {}
}

interface KeplrContextType {
    walletAddress: string | null;
    isConnecting: boolean;
    balance: string;
    xionPrice: number;
    connectKeplr: () => Promise<void>;
    getTokenBalance: () => Promise<void>;
    offlineSigner: any | null;
    balances: Coin[];
}

const KeplrContext = createContext<KeplrContextType>({
    walletAddress: null,
    isConnecting: false,
    balance: "0",
    xionPrice: 0,
    connectKeplr: async () => {},
    getTokenBalance: async () => {},
    offlineSigner: null,
    balances: [],
});

export const useKeplr = () => {
    const context = useContext(KeplrContext);
    if (!context) {
        throw new Error('useKeplr must be used within a KeplrProvider');
    }
    return context;
};

interface KeplrProviderProps {
    children: ReactNode;
}

export function KeplrProvider({ children }: KeplrProviderProps) {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [balance, setBalance] = useState("0");
    const [balances, setBalances] = useState<Coin[]>([]);
    const [xionPrice, setXionPrice] = useState(0);
    const [offlineSigner, setOfflineSigner] = useState<OfflineSigner | null>(null);
    const chainId = process.env.chainId;
    const getTokenBalance = async () => {
        if (!walletAddress) return;
        
        try {
            const client = await StargateClient.connect(RPC_URL || "");
            const response = await client.getAllBalances(walletAddress);
            const amountInXion = parseFloat(response.find(coin => coin.denom === 'uxion')?.amount || "0")/(Math.pow(10, DECIMALS));
            setBalance(amountInXion.toFixed(2));
            setBalances([...response]);
            console.log(response);
            const price = await getXionPrice();
            setXionPrice(price);
        } catch (error) {
            console.error("Error querying token balance:", error);
            toast.error("Failed to fetch balance");
        }
    };

    const connectKeplr = async () => {
        try {
            setIsConnecting(true);
            
            if (!window.keplr) {
                toast.error("Please install Keplr Wallet");
                return;
            }

            if (!window.keplr || !window.getOfflineSignerAuto) {
                throw new Error("Keplr or getOfflineSignerAuto is not available");
            }
            await window.keplr.enable(chainId || "");
            const signer = await window.getOfflineSignerAuto(chainId || "");
            console.log('Signer:', signer);
            const accounts = await signer.getAccounts();
            const address = accounts[0].address;
            setOfflineSigner(signer as OfflineSigner);
            setWalletAddress(address);
            await getTokenBalance();

            toast.success("Wallet connected successfully");
        } catch (error) {
            console.error("Error connecting wallet:", error);
            toast.error("Failed to connect wallet");
        } finally {
            setIsConnecting(false);
        }
    };

    // Watch for wallet address changes and update balance
    useEffect(() => {
        if (walletAddress) {
            getTokenBalance();
        }
    }, [walletAddress]);

    // Auto-connect to Keplr if available
    useEffect(() => {
        const autoConnect = async () => {
            if (window.keplr && !walletAddress) {
                try {
                    await connectKeplr();
                } catch (error) {
                    console.error("Auto-connect failed:", error);
                }
            }
        };

        autoConnect();
    }, []);

    // Listen for Keplr account changes
    useEffect(() => {
        const handleAccountChange = () => {
            connectKeplr();
        };

        window.addEventListener("keplr_keystorechange", handleAccountChange);

        return () => {
            window.removeEventListener("keplr_keystorechange", handleAccountChange);
        };
    }, []);

    return (
        <KeplrContext.Provider value={{
            walletAddress,
            isConnecting,
            balance,
            xionPrice,
            connectKeplr,
            getTokenBalance,
            offlineSigner,
            balances
        }}>
            {children}
        </KeplrContext.Provider>
    );
} 