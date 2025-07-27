'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Unlink,
  Building2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import BankConnectionModal from './BankConnectionModal';
import { plaidService, type BankAccount } from '../../services/plaidService';

interface ConnectedBanksProps {
  onAccountsUpdate?: (accounts: BankAccount[]) => void;
  keyPrefix?: string;
}

export const ConnectedBanks: React.FC<ConnectedBanksProps> = ({ onAccountsUpdate, keyPrefix = 'cb' }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const allAccounts = await plaidService.getAllAccounts();
      setAccounts(allAccounts);
      onAccountsUpdate?.(allAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      // Force refresh accounts from all connected institutions
      const connectedInstitutions = plaidService.getConnectedInstitutions();
      const allAccounts: BankAccount[] = [];
      
      for (const institution of connectedInstitutions) {
        const institutionAccounts = await plaidService.getAccounts(institution);
        allAccounts.push(...institutionAccounts);
      }
      
      setAccounts(allAccounts);
      onAccountsUpdate?.(allAccounts);
    } catch (error) {
      console.error('Error syncing accounts:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBankConnected = async (newAccounts: BankAccount[]) => {
    setAccounts(prev => [...prev, ...newAccounts]);
    onAccountsUpdate?.([...accounts, ...newAccounts]);
    setIsModalOpen(false); // Modal will close after user clicks "Done"
  };

  const handleDisconnectBank = async (institutionName: string) => {
    try {
      await plaidService.removeInstitution(institutionName);
      const remainingAccounts = accounts.filter(account => account.institutionName !== institutionName);
      setAccounts(remainingAccounts);
      onAccountsUpdate?.(remainingAccounts);
    } catch (error) {
      console.error('Error disconnecting bank:', error);
    }
  };

  const groupedAccounts = accounts.reduce((groups, account) => {
    const institution = account.institutionName;
    if (!groups[institution]) {
      groups[institution] = [];
    }
    groups[institution].push(account);
    return groups;
  }, {} as Record<string, BankAccount[]>);

  const formatBalance = (balance: number, currency: string = 'USD') => {
    if (!showBalances) return '••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(Math.abs(balance));
  };

  const getAccountTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'credit':
        return <CreditCard className="w-full h-full" />;
      case 'depository':
        return <Building2 className="w-full h-full" />;
      default:
        return <CreditCard className="w-full h-full" />;
    }
  };

  const getAccountTypeColor = (accountType: string, balance: number) => {
    if (accountType === 'credit') {
      return balance < 0 ? 'text-red-400' : 'text-green-400';
    }
    return balance > 0 ? 'text-green-400' : 'text-red-400';
  };

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="animate-pulse">
          <div className="h-5 sm:h-6 bg-white/10 rounded mb-3 sm:mb-4"></div>
          <div className="space-y-2 sm:space-y-3">
            <div className="h-12 sm:h-16 bg-white/10 rounded"></div>
            <div className="h-12 sm:h-16 bg-white/10 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold truncate">Connected Banks</h2>
              <p className="text-xs sm:text-sm text-neutral-400">
                {Object.keys(groupedAccounts).length} institution{Object.keys(groupedAccounts).length !== 1 ? 's' : ''} • {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div title={showBalances ? 'Hide balances' : 'Show balances'}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
                className=" hover:text-white hover:bg-white/10"
              >
                {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <div title="Sync all accounts">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className=" hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Bank</span>
            </Button>
          </div>
        </div>

        {Object.keys(groupedAccounts).length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-white/5 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-lg font-medium  mb-2">No banks connected</h3>
            <p className=" mb-6">
              Connect your bank accounts to start tracking your finances automatically.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Your First Bank
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAccounts).map(([institutionName, institutionAccounts]) => (
              <motion.div
                key={`${keyPrefix}-inst-${institutionName}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 " />
                    </div>
                    <h3 className="text-lg font-medium ">{institutionName}</h3>
                  </div>
                  <div title="Disconnect bank">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnectBank(institutionName)}
                      className=" hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {institutionAccounts.map((account) => (
                    <motion.div
                      key={`${keyPrefix}-${account.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${account.accountType === 'credit' ? 'bg-purple-500/20' : 'bg-green-500/20'}`}>
                            <div className="w-4 h-4 sm:w-5 sm:h-5">
                              {getAccountTypeIcon(account.accountType)}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm sm:text-base truncate">{account.name}</h4>
                            <p className="text-neutral-400 text-xs sm:text-sm">
                              •••• {account.mask} • {account.subtype}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`font-semibold text-sm sm:text-base ${getAccountTypeColor(account.accountType, account.balance)}`}>
                            {formatBalance(account.balance, account.currency)}
                          </p>
                          {account.availableBalance !== undefined && account.availableBalance !== account.balance && (
                            <p className="text-white/60 text-xs sm:text-sm">
                              Available: {formatBalance(account.availableBalance, account.currency)}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <BankConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBankConnected={handleBankConnected}
      />
    </>
  );
};
