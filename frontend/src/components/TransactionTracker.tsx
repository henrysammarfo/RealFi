import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { contractService } from '../services/contractService';

interface Transaction {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: string;
  timestamp: number;
  blockNumber?: number;
  gasUsed?: string;
}

const TransactionTracker: React.FC = () => {
  const { isConnected } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setTransactions([]);
      return;
    }

    // Load recent transactions from localStorage
    const savedTransactions = localStorage.getItem('realfi-transactions');
    if (savedTransactions) {
      try {
        const parsed = JSON.parse(savedTransactions);
        setTransactions(parsed);
      } catch (error) {
        console.error('Failed to parse saved transactions:', error);
      }
    }
  }, [isConnected]);

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => {
      const updated = [tx, ...prev].slice(0, 10); // Keep only last 10 transactions
      localStorage.setItem('realfi-transactions', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTransaction = (hash: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const updated = prev.map(tx => 
        tx.hash === hash ? { ...tx, ...updates } : tx
      );
      localStorage.setItem('realfi-transactions', JSON.stringify(updated));
      return updated;
    });
  };

  const removeTransaction = (hash: string) => {
    setTransactions(prev => {
      const updated = prev.filter(tx => tx.hash !== hash);
      localStorage.setItem('realfi-transactions', JSON.stringify(updated));
      return updated;
    });
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit': return '💰';
      case 'withdraw': return '💸';
      case 'battle': return '⚔️';
      case 'bridge': return '🌉';
      case 'strategy': return '🤖';
      case 'register': return '👤';
      default: return '📝';
    }
  };

  if (!isConnected || transactions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Transaction Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {transactions.filter(tx => tx.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {transactions.filter(tx => tx.status === 'pending').length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Transaction Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {transactions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No recent transactions</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getTypeIcon(tx.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {tx.type}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(tx.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                        <a
                          href={contractService.getExplorerUrl(tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          onClick={() => removeTransaction(tx.hash)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {tx.gasUsed && (
                      <div className="mt-2 text-xs text-gray-500">
                        Gas used: {tx.gasUsed}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {transactions.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setTransactions([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all transactions
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// Export functions for use in other components
export const transactionTracker = {
  addTransaction: (tx: Transaction) => {
    // This will be called from other components
    const event = new CustomEvent('addTransaction', { detail: tx });
    window.dispatchEvent(event);
  },
  updateTransaction: (hash: string, updates: Partial<Transaction>) => {
    const event = new CustomEvent('updateTransaction', { detail: { hash, updates } });
    window.dispatchEvent(event);
  }
};

export default TransactionTracker;
