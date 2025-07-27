'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Loader2, AlertCircle, CheckCircle2, CreditCard, Building2 } from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { plaidService, type PlaidLinkSuccess, type BankAccount } from '../../services/plaidService';

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBankConnected: (accounts: BankAccount[]) => void;
}

const BankConnectionModal: React.FC<BankConnectionModalProps> = ({
  isOpen,
  onClose,
  onBankConnected,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'intro' | 'connecting' | 'success'>('intro');
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Fetch link token when modal opens
  const fetchLinkToken = useCallback(async () => {
    try {
      const response = await fetch('/api/plaid/create_link_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: 'default_user' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create link token');
      }

      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (err) {
      console.error('Error fetching link token:', err);
      setError('Failed to initialize bank connection. Please try again.');
    }
  }, []);

  // Fetch link token when modal opens
  React.useEffect(() => {
    if (isOpen && !linkToken) {
      fetchLinkToken();
    }
  }, [isOpen, linkToken, fetchLinkToken]);

  const handlePlaidLinkSuccess = useCallback(async (publicToken: string, metadata: any) => {
    try {
      setIsLoading(true);
      setCurrentStep('connecting');
      setError(null);

      // Exchange public token for access token
      const institutionName = metadata.institution.name;
      await plaidService.exchangePublicToken(publicToken, institutionName);

      // Fetch accounts
      const accounts = await plaidService.getAccounts(institutionName);
      setConnectedAccounts(accounts);
      setCurrentStep('success');

      // Don't call onBankConnected here - wait for user to click "Done"
    } catch (err) {
      console.error('Error connecting bank account:', err);
      setError('Failed to connect bank account. Please try again.');
      setCurrentStep('intro');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePlaidLinkError = useCallback((error: any) => {
    console.error('Plaid Link error:', error);
    setError(`Connection failed: ${error.error_message || 'Unknown error'}`);
    setCurrentStep('intro');
  }, []);

  const handlePlaidLinkExit = useCallback((err: any, metadata: any) => {
    if (err) {
      console.error('Plaid Link exit with error:', err);
      setError('Connection was cancelled or failed.');
    }
    setCurrentStep('intro');
  }, []);

  // Configure Plaid Link
  const config = {
    token: linkToken,
    onSuccess: handlePlaidLinkSuccess,
    onError: handlePlaidLinkError,
    onExit: handlePlaidLinkExit,
  };

  const { open, ready } = usePlaidLink(config);

  const openPlaidLink = useCallback(() => {
    if (ready && linkToken) {
      open();
    } else {
      setError('Plaid Link is not ready. Please try again.');
    }
  }, [open, ready, linkToken]);

  const handleClose = () => {
    // If we have connected accounts and we're on the success step, notify parent
    if (currentStep === 'success' && connectedAccounts.length > 0) {
      onBankConnected(connectedAccounts);
    }
    
    setCurrentStep('intro');
    setError(null);
    setConnectedAccounts([]);
    setLinkToken(null); // Reset link token for next time
    onClose();
  };

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      scale: 0.8, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onClick={handleClose}
      >
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg mx-auto"
        >
          <Card className="p-6 bg-white/10 backdrop-blur-xl border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {currentStep === 'intro' && 'Connect Your Bank'}
                {currentStep === 'connecting' && 'Connecting...'}
                {currentStep === 'success' && 'Connection Successful!'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {currentStep === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Security Notice */}
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-blue-400 font-medium mb-1">Bank-Level Security</h3>
                        <p className="text-blue-300/80 text-sm">
                          We use Plaid's secure connection to link your bank account. 
                          Your credentials are encrypted and never stored on our servers.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-green-400" />
                      <span className="text-white/90">Real-time transaction tracking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-5 h-5 text-green-400" />
                      <span className="text-white/90">Support for 12,000+ banks and credit unions</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-white/90">Read-only access - we can't move your money</span>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-red-400 font-medium mb-1">Connection Error</h3>
                          <p className="text-red-300/80 text-sm">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connect Button */}
                  <Button
                    onClick={openPlaidLink}
                    disabled={isLoading || !ready || !linkToken}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : !linkToken ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Initializing...
                      </>
                    ) : !ready ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Connect with Plaid'
                    )}
                  </Button>

                  <p className="text-white/60 text-xs text-center">
                    By connecting your account, you agree to our{' '}
                    <span className="text-blue-400 hover:underline cursor-pointer">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-blue-400 hover:underline cursor-pointer">Privacy Policy</span>
                  </p>
                </motion.div>
              )}

              {currentStep === 'connecting' && (
                <motion.div
                  key="connecting"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-8"
                >
                  <div className="mb-6">
                    <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Securely connecting your account...
                    </h3>
                    <p className="text-white/70">
                      This may take a few moments
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-8"
                >
                  <div className="mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Successfully connected!
                    </h3>
                    <p className="text-white/70 mb-4">
                      {connectedAccounts.length} account{connectedAccounts.length !== 1 ? 's' : ''} connected
                    </p>
                  </div>

                  {/* Connected Accounts */}
                  <div className="space-y-3 mb-6">
                    {connectedAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">{account.name}</p>
                            <p className="text-white/60 text-sm">•••• {account.mask}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">
                              ${account.balance.toLocaleString()}
                            </p>
                            <p className="text-white/60 text-sm capitalize">
                              {account.subtype}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3"
                  >
                    Done
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BankConnectionModal;
export { BankConnectionModal };
