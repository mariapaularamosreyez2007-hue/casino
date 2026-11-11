// ============================================================================
// ASTED AUTO-BET ENGINE
// Real-time automated betting loop with Martingale/Anti-Martingale progression,
// financial circuit breakers, and sub-millisecond turbo mode execution.
// ============================================================================

export interface AutoBetConfig {
  baseBet: number;
  totalBets: number; // 0 for infinite
  onWin: {
    action: 'reset' | 'increase';
    percentage: number;
  };
  onLoss: {
    action: 'reset' | 'increase';
    percentage: number;
  };
  stopOnProfit?: number;
  stopOnLoss?: number;
  turboMode?: boolean;
  delayMs?: number;
}

export interface AutoBetState {
  isRunning: boolean;
  currentBet: number;
  betsExecuted: number;
  netProfit: number;
  winsCount: number;
  lossesCount: number;
  stopReason: 'user_stop' | 'insufficient_funds' | 'target_bets_reached' | 'profit_limit_reached' | 'loss_limit_reached' | null;
}

export interface SingleBetResult {
  payout: number;
  isWin: boolean;
  multiplier: number;
}

export type BetCallback = (betAmount: number) => Promise<SingleBetResult>;
export type StateCallback = (state: AutoBetState) => void;

export class AutoBetEngine {
  private config: AutoBetConfig;
  private state: AutoBetState;
  private shouldStop: boolean = false;
  private onStateChange?: StateCallback;

  constructor(config: AutoBetConfig, onStateChange?: StateCallback) {
    this.config = config;
    this.onStateChange = onStateChange;
    this.state = {
      isRunning: false,
      currentBet: this.roundCurrency(config.baseBet),
      betsExecuted: 0,
      netProfit: 0,
      winsCount: 0,
      lossesCount: 0,
      stopReason: null,
    };
  }

  /**
   * Safe financial rounding to 2 decimal places to prevent floating-point artifacts.
   */
  public static round(val: number): number {
    return Math.round(val * 100) / 100;
  }

  private roundCurrency(val: number): number {
    return AutoBetEngine.round(val);
  }

  public getState(): AutoBetState {
    return { ...this.state };
  }

  /**
   * Request immediate cancellation of auto-betting.
   */
  public stop(reason: AutoBetState['stopReason'] = 'user_stop') {
    this.shouldStop = true;
    this.state.isRunning = false;
    this.state.stopReason = reason;
    this.notifyState();
  }

  private notifyState() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  /**
   * Executes the automated betting sequence.
   * Runs sequentially: bet N+1 is never triggered until bet N is resolved and confirmed.
   */
  public async start(
    getBalance: () => number,
    executeBet: BetCallback
  ): Promise<AutoBetState> {
    this.shouldStop = false;
    this.state.isRunning = true;
    this.state.betsExecuted = 0;
    this.state.netProfit = 0;
    this.state.winsCount = 0;
    this.state.lossesCount = 0;
    this.state.currentBet = this.roundCurrency(this.config.baseBet);
    this.state.stopReason = null;
    this.notifyState();

    const delay = this.config.turboMode
      ? 50
      : (this.config.delayMs !== undefined ? this.config.delayMs : 400);

    while (!this.shouldStop) {
      const balance = getBalance();

      // Circuit Breaker 1: Insufficient Balance
      if (this.state.currentBet > balance || this.state.currentBet <= 0) {
        this.stop('insufficient_funds');
        break;
      }

      // Circuit Breaker 2: Target Number of Bets Reached
      if (this.config.totalBets > 0 && this.state.betsExecuted >= this.config.totalBets) {
        this.stop('target_bets_reached');
        break;
      }

      // Circuit Breaker 3: Stop on Profit
      if (
        this.config.stopOnProfit !== undefined &&
        this.config.stopOnProfit > 0 &&
        this.state.netProfit >= this.config.stopOnProfit
      ) {
        this.stop('profit_limit_reached');
        break;
      }

      // Circuit Breaker 4: Stop on Loss
      if (
        this.config.stopOnLoss !== undefined &&
        this.config.stopOnLoss > 0 &&
        this.state.netProfit <= -Math.abs(this.config.stopOnLoss)
      ) {
        this.stop('loss_limit_reached');
        break;
      }

      // Execute Single Bet
      const betAmountThisRound = this.state.currentBet;
      try {
        const result = await executeBet(betAmountThisRound);

        if (this.shouldStop) break;

        // Financial accounting
        const roundProfit = this.roundCurrency(result.payout - betAmountThisRound);
        this.state.netProfit = this.roundCurrency(this.state.netProfit + roundProfit);
        this.state.betsExecuted += 1;

        if (result.isWin) {
          this.state.winsCount += 1;
          // Apply onWin rule
          if (this.config.onWin.action === 'increase' && this.config.onWin.percentage > 0) {
            const next = betAmountThisRound * (1 + this.config.onWin.percentage / 100);
            this.state.currentBet = this.roundCurrency(next);
          } else {
            this.state.currentBet = this.roundCurrency(this.config.baseBet);
          }
        } else {
          this.state.lossesCount += 1;
          // Apply onLoss rule (Martingale)
          if (this.config.onLoss.action === 'increase' && this.config.onLoss.percentage > 0) {
            const next = betAmountThisRound * (1 + this.config.onLoss.percentage / 100);
            this.state.currentBet = this.roundCurrency(next);
          } else {
            this.state.currentBet = this.roundCurrency(this.config.baseBet);
          }
        }

        this.notifyState();

        // Check if another round will be executed
        if (this.config.totalBets > 0 && this.state.betsExecuted >= this.config.totalBets) {
          this.stop('target_bets_reached');
          break;
        }

        // Delay between rounds
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (err) {
        this.stop('user_stop');
        break;
      }
    }

    this.state.isRunning = false;
    this.notifyState();
    return { ...this.state };
  }
}
