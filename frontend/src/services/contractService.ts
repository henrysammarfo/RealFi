import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts';

export interface ContractService {
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
}

class ContractServiceClass implements ContractService {
  public provider: ethers.Provider | null = null;
  public signer: ethers.Signer | null = null;
  public account: string | null = null;
  public chainId: number | null = null;

  private contracts: Map<string, ethers.Contract> = new Map();

  async initialize(provider: ethers.Provider, signer: ethers.Signer, account: string) {
    this.provider = provider;
    this.signer = signer;
    this.account = account;
    this.chainId = Number((await provider.getNetwork()).chainId);
    
    // Initialize all contracts
    this.initializeContracts();
  }

  private initializeContracts() {
    if (!this.signer) return;

    Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
      if (address && CONTRACT_ABIS[name as keyof typeof CONTRACT_ABIS]) {
        const contract = new ethers.Contract(
          address,
          CONTRACT_ABIS[name as keyof typeof CONTRACT_ABIS],
          this.signer!
        );
        this.contracts.set(name, contract);
      }
    });
  }

  getContract(contractName: keyof typeof CONTRACT_ADDRESSES): ethers.Contract | null {
    return this.contracts.get(contractName) || null;
  }

  async getContractReadOnly(contractName: keyof typeof CONTRACT_ADDRESSES): Promise<ethers.Contract | null> {
    if (!this.provider) return null;
    
    const address = CONTRACT_ADDRESSES[contractName];
    const abi = CONTRACT_ABIS[contractName];
    
    if (!address || !abi) return null;
    
    return new ethers.Contract(address, abi, this.provider);
  }

  // RealFiToken methods
  async getTokenBalance(address: string): Promise<string> {
    const contract = this.getContract('RealFiToken');
    if (!contract) throw new Error('RealFiToken contract not available');
    
    const balance = await contract.balanceOf(address);
    return ethers.formatEther(balance);
  }

  async getTokenInfo() {
    const contract = this.getContract('RealFiToken');
    if (!contract) throw new Error('RealFiToken contract not available');
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);
    
    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatEther(totalSupply)
    };
  }

  async approveToken(spender: string, amount: string): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('RealFiToken');
    if (!contract) throw new Error('RealFiToken contract not available');
    
    const amountWei = ethers.parseEther(amount);
    return await contract.approve(spender, amountWei);
  }

  async transferToken(to: string, amount: string): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('RealFiToken');
    if (!contract) throw new Error('RealFiToken contract not available');
    
    const amountWei = ethers.parseEther(amount);
    return await contract.transfer(to, amountWei);
  }

  // UserProfile methods
  async getUserData(address: string) {
    const contract = this.getContract('UserProfile');
    if (!contract) throw new Error('UserProfile contract not available');
    
    const data = await contract.getUserData(address);
    return {
      username: data[0],
      registrationTime: Number(data[1]),
      totalDeposits: ethers.formatEther(data[2]), // Convert from wei to ether
      totalWithdrawals: ethers.formatEther(data[3]), // Convert from wei to ether
      battlesJoined: Number(data[4]),
      battlesWon: Number(data[5]),
      reputationScore: Number(data[6]),
      isActive: data[7]
    };
  }

  async registerUser(username: string): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('UserProfile');
    if (!contract) throw new Error('UserProfile contract not available');
    
    return await contract.registerUser(username);
  }

  async updateProfile(username: string): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('UserProfile');
    if (!contract) throw new Error('UserProfile contract not available');
    
    return await contract.updateProfile(username);
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const contract = this.getContract('UserProfile');
    if (!contract) throw new Error('UserProfile contract not available');
    
    return await contract.isUsernameAvailable(username);
  }

  // YieldVault methods
  async getUserPosition(address: string) {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    const position = await contract.getUserPosition(address);
    return {
      depositedAmount: ethers.formatEther(position[0]),
      depositTime: Number(position[1]),
      lastUpdateTime: Number(position[2]),
      yieldEarned: ethers.formatEther(position[3]),
      isActive: position[4]
    };
  }

  async getVaultStats() {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    const stats = await contract.getVaultStats();
    return {
      totalVaultValue: ethers.formatEther(stats[0]),
      totalYieldDistributed: ethers.formatEther(stats[1]),
      nextBattleId: Number(stats[2])
    };
  }

  async getBattleDetails(battleId: number) {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    const battle = await contract.getBattleDetails(battleId);
    return {
      name: battle[0],
      startTime: Number(battle[1]),
      endTime: Number(battle[2]),
      totalPrizePool: ethers.formatEther(battle[3]),
      entryFee: ethers.formatEther(battle[4]),
      maxParticipants: Number(battle[5]),
      currentParticipants: Number(battle[6]),
      isActive: battle[7]
    };
  }

  async deposit(amount: string): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    const amountWei = ethers.parseEther(amount);
    return await contract.deposit(amountWei);
  }

  async withdraw(amount: string): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    const amountWei = ethers.parseEther(amount);
    return await contract.withdraw(amountWei);
  }

  async withdrawAll(): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    return await contract.withdrawAll();
  }

  async createBattle(name: string, entryFee: string, maxParticipants: number, duration: number): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    const entryFeeWei = ethers.parseEther(entryFee);
    return await contract.createBattle(name, entryFeeWei, maxParticipants, duration);
  }

  async joinBattle(battleId: number, amount: string): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    const amountWei = ethers.parseEther(amount);
    return await contract.joinBattle(battleId, amountWei);
  }

  async claimYield(): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    return await contract.claimYield();
  }

  async endBattle(battleId: number): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    return await contract.endBattle(battleId);
  }

  async getBattleWinners(battleId: number) {
    const contract = this.getContract('YieldVault');
    if (!contract) throw new Error('YieldVault contract not available');
    
    try {
      const winners = await contract.getBattleWinners(battleId);
      return winners.map((winner: any) => ({
        address: winner[0],
        yieldEarned: ethers.formatEther(winner[1]),
        rank: Number(winner[2])
      }));
    } catch (error) {
      console.log(`Battle ${battleId} winners not available yet`);
      return [];
    }
  }

  // Leaderboard methods
  async getTopUsers(count: number) {
    const contract = this.getContract('Leaderboard');
    if (!contract) throw new Error('Leaderboard contract not available');
    
    const [addresses, scores, usernames] = await contract.getTopUsers(count);
    
    return addresses.map((address: string, index: number) => ({
      address,
      username: usernames[index] || 'Unknown',
      score: Number(scores[index]),
      rank: index + 1
    }));
  }

  async getUserRank(address: string): Promise<number> {
    const contract = this.getContract('Leaderboard');
    if (!contract) throw new Error('Leaderboard contract not available');
    
    const rank = await contract.getUserRank(address);
    return Number(rank);
  }

  // CrossChainBridge methods
  async createBridgeRequest(tokenAddress: string, amount: string, targetChain: number): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('CrossChainBridge');
    if (!contract) throw new Error('CrossChainBridge contract not available');
    
    const amountWei = ethers.parseEther(amount);
    return await contract.createBridgeRequest(tokenAddress, amountWei, targetChain);
  }

  async getUserBridgeRequests(address: string): Promise<number[]> {
    const contract = this.getContract('CrossChainBridge');
    if (!contract) throw new Error('CrossChainBridge contract not available');
    
    const requestIds = await contract.getUserBridgeRequests(address);
    return requestIds.map((id: any) => Number(id));
  }

  // AIStrategy methods
  async generateAIRecommendations(address: string) {
    const contract = this.getContract('AIStrategy');
    if (!contract) throw new Error('AIStrategy contract not available');
    
    const [strategyIds, confidence] = await contract.generateAIRecommendations(address);
    return {
      strategies: strategyIds.map((id: any) => Number(id)),
      confidence: Number(confidence)
    };
  }

  async adoptStrategy(strategyId: number, amount: string): Promise<ethers.TransactionResponse> {
    const contract = this.getContract('AIStrategy');
    if (!contract) throw new Error('AIStrategy contract not available');
    
    const amountWei = ethers.parseEther(amount);
    return await contract.adoptStrategy(strategyId, amountWei);
  }

  async getUserActiveStrategies(address: string) {
    const contract = this.getContract('AIStrategy');
    if (!contract) throw new Error('AIStrategy contract not available');
    
    const [strategyIds, amounts, startTimes] = await contract.getUserActiveStrategies(address);
    
    return strategyIds.map((id: any, index: number) => ({
      strategyId: Number(id),
      amount: ethers.formatEther(amounts[index]),
      startTime: Number(startTimes[index])
    }));
  }

  // Utility methods
  async waitForTransaction(txHash: string): Promise<ethers.TransactionReceipt> {
    if (!this.provider) throw new Error('Provider not available');
    
    const receipt = await this.provider.waitForTransaction(txHash);
    if (!receipt) throw new Error('Transaction receipt not found');
    return receipt;
  }

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  formatAmount(amount: string, decimals: number = 4): string {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.0000' : num.toFixed(decimals);
  }

  parseAmount(amount: string): bigint {
    return ethers.parseEther(amount);
  }

  getExplorerUrl(txHash: string): string {
    return `https://shannon-explorer.somnia.network/tx/${txHash}`;
  }

  getAddressExplorerUrl(address: string): string {
    return `https://shannon-explorer.somnia.network/address/${address}`;
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.contracts.clear();
  }
}

export const contractService = new ContractServiceClass();
