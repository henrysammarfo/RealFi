// Debug utility to check which contract addresses are being used

import { CONTRACT_ADDRESSES } from '../config/contracts';

export function debugContractAddresses() {
  console.log('🔍 Contract Addresses Debug Info:');
  console.log('================================');
  
  Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  
  console.log('================================');
  
  // Check for any hardcoded addresses that might be different
  const expectedAddresses = {
    RealFiToken: '0x7941e8df64Ce12751e8823A058ebE9872371eFAc',
    UserProfile: '0x6C76a75860F150DC1A1fD3b369Dde113De02aD55',
    YieldVault: '0x34F50ebC45BAeEdA521652280FbfF294E39E896D',
    Leaderboard: '0x5D3235c4eB39f5c3729e75932D62E40f77D8e70f',
    CrossChainBridge: '0x9F54700Ae37615C4D751FEE27138A1Cc4276e43d',
    AIStrategy: '0x72A2dF456B5BF22A87BB56cC08BAf3037250cd01'
  };
  
  console.log('🔍 Expected vs Actual Addresses:');
  console.log('================================');
  
  Object.entries(expectedAddresses).forEach(([name, expected]) => {
    const actual = CONTRACT_ADDRESSES[name as keyof typeof CONTRACT_ADDRESSES];
    const match = actual === expected;
    console.log(`${name}:`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}`);
    console.log(`  Match:    ${match ? '✅' : '❌'}`);
    console.log('');
  });
}

export function checkForHardcodedAddresses() {
  console.log('🔍 Checking for hardcoded addresses in components...');
  
  // This would need to be run in the browser console to check actual component state
  console.log('Run this in browser console to check component state:');
  console.log('window.debugContractAddresses()');
}

// Make it available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).debugContractAddresses = debugContractAddresses;
}
