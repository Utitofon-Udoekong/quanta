import { NextResponse } from 'next/server';
import { SigningStargateClient } from "@cosmjs/stargate";
import { Decimal } from "@cosmjs/math";
import { createClient } from '@/app/utils/supabase/server';
import { OfflineSigner } from '@cosmjs/proto-signing';
// XION Testnet Configuration
const RPC_ENDPOINT = process.env.rpcUrl;
const TOKEN_DENOM = process.env.tokenDenom;
const TREASURY = process.env.treasuryAddress;

export async function POST(request: Request) {
    try {
        const { amount, sender, offlineSigner }: { amount: string, sender: string, offlineSigner: OfflineSigner } = (await request.json());
        console.log('Received payment request:', { amount, sender, offlineSigner });
        // Validate required fields
        if (!amount || !sender || !offlineSigner) {
            console.error('Missing required fields:', { amount, sender, offlineSigner });
            return NextResponse.json(
                { error: 'Amount, sender, and offlineSigner are required' },
                { status: 400 }
            );
        }

        console.log('Processing payment:', {
            amount,
            sender,
            recipient: TREASURY,
            rpc: RPC_ENDPOINT,
            denom: TOKEN_DENOM
        });

        // Create fee object
        const fee = {
            amount: [
                {
                    denom: TOKEN_DENOM || "",
                    amount: "100", // minimal fee
                }
            ],
            gas: "100000",
        };

        // Send tokens
        let result;
        try {
            // Get the accounts from the signer
            const accounts = await offlineSigner.getAccounts()
            const senderAccount = accounts[0].address;

            // Verify sender matches connected wallet
            if (senderAccount !== sender) {
                throw new Error('Connected wallet does not match sender address');
            }

            // Connect to the blockchain with signer
            const signingClient = await SigningStargateClient.connectWithSigner(
                RPC_ENDPOINT || "",
                offlineSigner,
                {
                    gasPrice: {
                        amount: Decimal.fromUserInput('0.025', 6),
                        denom: TOKEN_DENOM || "",
                    },
                }
            );

            console.log('Sending transaction:', {
                from: sender,
                to: TREASURY,
                amount: amount,
                denom: TOKEN_DENOM
            });

            result = await signingClient.sendTokens(
                sender,
                TREASURY || "",
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

        if (result?.code === 0) {
            // Create payment record in database
            const supabase = await createClient();
            const { data: payment, error: dbError } = await supabase
                .from('subscription_payments')
                .insert({
                    amount: parseFloat(amount) / 1000000, // Convert from uxion to XION
                    currency: 'XION',
                    status: 'succeeded',
                    payment_method: 'keplr_wallet',
                    payment_date: new Date().toISOString(),
                    transaction_hash: result.transactionHash
                })
                .select()
                .single();

            if (dbError) {
                console.error('Error recording payment:', dbError);
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
            console.error('Transaction failed:', result.events);
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