// ============================================================================
// ASTED PLAYER ECONOMY SERVICE
// Rakeback Accumulator, Vault (Bóveda) Asset Isolation, and VIP System
// ============================================================================

export interface PlayerWallet {
  balance: number;
  vaultBalance: number;
  rakebackBalance: number;
  totalWagered: number;
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

export class PlayerEconomyService {
  /**
   * VIP Tier thresholds based on total volume wagered (USD).
   */
  public static VIP_TIERS = [
    { name: 'Bronze' as const, wagerRequirement: 0, rakebackRate: 0.05 },
    { name: 'Silver' as const, wagerRequirement: 5000, rakebackRate: 0.08 },
    { name: 'Gold' as const, wagerRequirement: 25000, rakebackRate: 0.10 },
    { name: 'Platinum' as const, wagerRequirement: 100000, rakebackRate: 0.12 },
    { name: 'Diamond' as const, wagerRequirement: 500000, rakebackRate: 0.15 },
  ];

  public static getVipTier(totalWagered: number) {
    const tiers = [...this.VIP_TIERS].reverse();
    for (const t of tiers) {
      if (totalWagered >= t.wagerRequirement) {
        return t;
      }
    }
    return this.VIP_TIERS[0];
  }

  /**
   * Calculates instantaneous Rakeback for any placed bet.
   * Formula: BetAmount * HouseEdge (1% on Originals) * RakebackRate (5% to 15%)
   */
  public static calculateRakeback(
    betAmount: number,
    houseEdge: number = 0.01,
    totalWagered: number = 0
  ): number {
    const tier = this.getVipTier(totalWagered);
    const rakeback = betAmount * houseEdge * tier.rakebackRate;
    return Math.round(rakeback * 10000) / 10000; // 4 decimal places for precision
  }

  /**
   * Transfers funds from active Balance into the Vault (Bóveda).
   */
  public static depositToVault(
    wallet: PlayerWallet,
    amount: number
  ): { success: boolean; newWallet: PlayerWallet; message: string } {
    if (amount <= 0 || amount > wallet.balance) {
      return { success: false, newWallet: wallet, message: 'Saldo insuficiente para transferir a la bóveda.' };
    }
    const cleanAmount = Math.round(amount * 100) / 100;
    const newWallet: PlayerWallet = {
      ...wallet,
      balance: Math.round((wallet.balance - cleanAmount) * 100) / 100,
      vaultBalance: Math.round((wallet.vaultBalance + cleanAmount) * 100) / 100,
    };
    return { success: true, newWallet, message: `US$ ${cleanAmount.toFixed(2)} resguardados en tu Bóveda.` };
  }

  /**
   * Withdraws funds from Vault back to active betting bankroll.
   */
  public static withdrawFromVault(
    wallet: PlayerWallet,
    amount: number
  ): { success: boolean; newWallet: PlayerWallet; message: string } {
    if (amount <= 0 || amount > wallet.vaultBalance) {
      return { success: false, newWallet: wallet, message: 'Saldo insuficiente en tu Bóveda.' };
    }
    const cleanAmount = Math.round(amount * 100) / 100;
    const newWallet: PlayerWallet = {
      ...wallet,
      vaultBalance: Math.round((wallet.vaultBalance - cleanAmount) * 100) / 100,
      balance: Math.round((wallet.balance + cleanAmount) * 100) / 100,
    };
    return { success: true, newWallet, message: `US$ ${cleanAmount.toFixed(2)} retirados de tu Bóveda al saldo activo.` };
  }

  /**
   * Claims accumulated Rakeback into active balance.
   */
  public static claimRakeback(
    wallet: PlayerWallet
  ): { success: boolean; newWallet: PlayerWallet; claimedAmount: number; message: string } {
    if (wallet.rakebackBalance <= 0) {
      return { success: false, newWallet: wallet, claimedAmount: 0, message: 'No tienes Rakeback acumulado para reclamar.' };
    }
    const claimedAmount = Math.round(wallet.rakebackBalance * 100) / 100;
    const newWallet: PlayerWallet = {
      ...wallet,
      balance: Math.round((wallet.balance + claimedAmount) * 100) / 100,
      rakebackBalance: 0,
    };
    return {
      success: true,
      newWallet,
      claimedAmount,
      message: `¡Has reclamado US$ ${claimedAmount.toFixed(2)} de Rakeback a tu saldo!`,
    };
  }
}
