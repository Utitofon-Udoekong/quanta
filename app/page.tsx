"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { AccountCreation } from './components/xion/AccountCreation';
import { Button } from "@burnt-labs/ui";

export default function LandingPage() {
  const { data: account } = useAbstraxionAccount();
  const [showAccountCreation, setShowAccountCreation] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Web3 Pay-As-You-Go Content Platform
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Access premium content instantly. Pay only for what you consume. No subscriptions, no commitments.
          </p>
          
          {!account?.bech32Address ? (
            <div className="space-y-4">
              <Button 
                fullWidth 
                onClick={() => setShowAccountCreation(true)}
                structure="base"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started with XION
              </Button>
              <p className="text-sm text-gray-400">
                Powered by XION's gasless transactions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Link href="/dashboard">
                <Button 
                  fullWidth 
                  structure="base"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
              </Link>
              <p className="text-sm text-gray-400">
                Connected: {account.bech32Address.slice(0, 6)}...{account.bech32Address.slice(-4)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Pay As You Go</h3>
              <p className="text-gray-300">
                No more subscriptions. Pay only for the content you consume, when you consume it.
              </p>
            </div>
            <div className="p-6 bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Gasless Transactions</h3>
              <p className="text-gray-300">
                Powered by XION's account abstraction. No gas fees, no complexity.
              </p>
            </div>
            <div className="p-6 bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Instant Access</h3>
              <p className="text-gray-300">
                Get immediate access to content after payment. No waiting, no processing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Types Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Available Content Types</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {['Articles', 'Videos', 'Courses', 'Software'].map((type) => (
            <div key={type} className="p-6 bg-gray-700 rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-2">{type}</h3>
              <p className="text-gray-300 text-sm">
                Access premium {type.toLowerCase()} from top creators
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Account Creation Modal */}
      {showAccountCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create Your XION Account</h2>
            <p className="text-gray-300 mb-6">
              Create your XION account to start accessing premium content with gasless transactions.
            </p>
            <AccountCreation 
              userId="temp" // This should be replaced with actual user ID after signup
              onSuccess={() => {
                setShowAccountCreation(false);
              }}
              onError={(error) => {
                console.error('Account creation failed:', error);
                setShowAccountCreation(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
