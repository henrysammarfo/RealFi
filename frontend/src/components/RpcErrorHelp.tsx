import React, { useState } from 'react';
import { getMetaMaskResetInstructions, getAlternativeSolutions } from '../utils/metaMaskUtils';

interface RpcErrorHelpProps {
  error: any;
  onRetry: () => void;
}

const RpcErrorHelp: React.FC<RpcErrorHelpProps> = ({ error, onRetry }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  const isCircuitBreakerError = error?.message?.includes('circuit breaker') || 
                               error?.message?.includes('Execution prevented because the circuit breaker is open');

  if (!isCircuitBreakerError) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            MetaMask Circuit Breaker Active
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              MetaMask has temporarily blocked requests due to network issues. This is a safety feature to prevent excessive failed requests.
            </p>
          </div>
          <div className="mt-4">
            <div className="flex space-x-3">
              <button
                onClick={onRetry}
                className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-200"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-200"
              >
                {showInstructions ? 'Hide' : 'Show'} Reset Instructions
              </button>
            </div>
          </div>
          
          {showInstructions && (
            <div className="mt-4 p-4 bg-yellow-100 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Reset MetaMask Account:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {getMetaMaskResetInstructions().map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
              
              <h4 className="text-sm font-medium text-yellow-800 mt-4 mb-2">Alternative Solutions:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {getAlternativeSolutions().map((solution, index) => (
                  <li key={index}>{solution}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RpcErrorHelp;
