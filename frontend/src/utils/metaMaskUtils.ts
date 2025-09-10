// MetaMask Utilities

export function getMetaMaskResetInstructions(): string[] {
  return [
    "1. Open MetaMask extension",
    "2. Click on the three dots (⋮) in the top right",
    "3. Go to Settings → Advanced",
    "4. Scroll down and click 'Reset Account'",
    "5. Confirm the reset",
    "6. Refresh this page and try connecting again"
  ];
}

export function getAlternativeSolutions(): string[] {
  return [
    "• Clear your browser cache and cookies",
    "• Try using a different browser",
    "• Disconnect and reconnect your wallet",
    "• Check if MetaMask is up to date",
    "• Try connecting during off-peak hours"
  ];
}

export async function checkMetaMaskAvailability(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  return new Promise((resolve) => {
    if (!window.ethereum) {
      resolve(false);
      return;
    }
    
    // Try a simple call to check if MetaMask is responsive
    window.ethereum.request({ method: 'eth_accounts' })
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}
