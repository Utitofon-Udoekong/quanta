import { NextResponse } from 'next/server';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import { Decimal } from "@cosmjs/math";
import { createClient } from '@/app/utils/supabase/server';

// XION Testnet Configuration
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL;
const TOKEN_DENOM = process.env.NEXT_PUBLIC_XION_TOKEN_DENOM;
const MNEMONIC = process.env.NEXT_PAYMENT_WALLET_MNEMONIC;
const BUFFER_AMOUNT = 10000;
const FEE_AMOUNT = "100";
const GAS_LIMIT = "100000";

export async function POST(request: Request) {
    try {
        const { amount, sender, recipient } = (await request.json());

        // Validate required fields
        if (!amount || !sender || !recipient) {
            console.error('Missing required fields:', { amount, sender, recipient });
            return NextResponse.json(
                { error: 'Amount, sender, and recipient are required' },
                { status: 400 }
            );
        }

        // Validate mnemonic
        if (!MNEMONIC) {
            console.error('Payment wallet mnemonic is not configured');
            return NextResponse.json(
                { error: 'Payment service is not properly configured' },
                { status: 500 }
            );
        }

        console.log('Processing payment:', {
            amount,
            sender,
            recipient,
            rpc: RPC_ENDPOINT,
            denom: TOKEN_DENOM
        });

        // Initialize wallet
        let wallet;
        try {
            wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, {
                prefix: "xion",
            });
            const [account] = await wallet.getAccounts();
            console.log('Wallet initialized:', account.address);
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
            return NextResponse.json(
                { error: 'Failed to initialize payment wallet' },
                { status: 500 }
            );
        }

        // Check sender's balance
        let readClient;
        try {
            readClient = await StargateClient.connect(RPC_ENDPOINT || "");
            console.log('Connected to RPC endpoint');
        } catch (error) {
            console.error('Failed to connect to RPC:', error);
            return NextResponse.json(
                { error: 'Failed to connect to blockchain network' },
                { status: 500 }
            );
        }

        const balances = await readClient.getAllBalances(sender);
        const uxionBalance = balances.find((b) => b.denom === TOKEN_DENOM);

        if (!uxionBalance) {
            console.error('No uxion balance found for sender:', sender);
            return NextResponse.json(
                { error: 'No uxion balance found' },
                { status: 400 }
            );
        }

        console.log('Sender balance:', uxionBalance);

        const available = parseInt(uxionBalance.amount);
        const requiredAmount = parseInt(amount) + parseInt(FEE_AMOUNT) + BUFFER_AMOUNT;

        if (available < requiredAmount) {
            console.error('Insufficient balance:', {
                available,
                required: requiredAmount,
                difference: requiredAmount - available
            });
            return NextResponse.json(
                { 
                    error: 'Insufficient balance',
                    details: {
                        available: available,
                        required: requiredAmount,
                        difference: requiredAmount - available
                    }
                },
                { status: 400 }
            );
        }

        // Initialize signing client with the payment wallet
        let signingClient;
        try {
            signingClient = await SigningStargateClient.connectWithSigner(
                RPC_ENDPOINT || "",
                wallet,
                {
                    gasPrice: {
                        amount: Decimal.fromUserInput("0.025", 18),
                        denom: TOKEN_DENOM || ""
                    }
                }
            );
            console.log('Signing client initialized');
        } catch (error) {
            console.error('Failed to initialize signing client:', error);
            return NextResponse.json(
                { error: 'Failed to initialize transaction signing' },
                { status: 500 }
            );
        }

        const fee = {
            amount: [{ denom: TOKEN_DENOM || "", amount: FEE_AMOUNT }],
            gas: GAS_LIMIT,
        };

        // Send tokens
        let result;
        try {
            const [account] = await wallet.getAccounts();
            console.log('Sending transaction:', {
                from: sender,
                to: recipient,
                amount: amount,
                denom: TOKEN_DENOM
            });

            result = await signingClient.sendTokens(
                sender,
                recipient,
                [{ denom: TOKEN_DENOM || "", amount: amount }],
                fee,
                "Subscription payment"
            );

            console.log('Transaction result:', result);
        } catch (error) {
            console.error('Failed to send tokens:', error);
            return NextResponse.json(
                { error: 'Failed to process payment transaction', details: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
        }

        if (!result?.code) {
            // Create payment record in database
            const supabase = await createClient();
            const { data: payment, error: dbError } = await supabase
                .from('subscription_payments')
                .insert({
                    amount: parseFloat(amount) / 1000000, // Convert from uxion to XION
                    currency: 'XION',
                    status: 'succeeded',
                    payment_method: 'xion_wallet',
                    payment_date: new Date().toISOString(),
                    transaction_hash: result.transactionHash
                })
                .select()
                .single();

            if (dbError) {
                console.error('Error recording payment:', dbError);
                // Payment succeeded but database record failed
                return NextResponse.json({
                    success: true,
                    transactionHash: result.transactionHash,
                    warning: 'Payment successful but failed to record in database'
                });
            }

            return NextResponse.json({
                success: true,
                transactionHash: result.transactionHash,
                payment
            });
        } else {
            console.error('Transaction failed:', result.rawLog);
            return NextResponse.json(
                { error: 'Transaction failed', details: result.rawLog },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 