export type GameCategory =
  | 'all'
  | 'my-casino'
  | 'only-on-asted'
  | 'new-releases'
  | 'asted-originals'
  | 'slots'
  | 'live-casino'
  | 'table-games';

export interface GameItem {
  id: string;
  title: string;
  provider: string;
  category: GameCategory;
  playersCount: number;
  image?: string;
  color?: string;
  badge?: string;
  hasPlayableModal?: 'mines' | 'plinko' | 'crash' | 'dice' | 'roulette' | 'slots' | 'billiard' | 'solitaire';
  rtp?: number;
  description?: string;
}

export interface LiveBet {
  id: string;
  game: string;
  user: string;
  time: string;
  betAmount: number;
  currency: string;
  multiplier: number;
  payout: number;
  isWin: boolean;
}

export interface ChatMessage {
  id: string;
  user: string;
  vipTier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  message: string;
  time: string;
  isSystem?: boolean;
}

export interface UserAccount {
  username: string;
  email: string;
  balance: number;
  vaultBalance: number;
  rakebackBalance: number;
  currency: string;
  vipLevel: string;
  totalWagered: number;
  joinedDate: string;
  savedGames: string[];
}

export interface SportsSelection {
  matchId: string;
  matchTitle: string;
  sport: string;
  marketName: string;
  selectionName: string;
  odds: number;
}

export interface SportsBet {
  id: string;
  type: 'single' | 'parlay' | 'builder';
  selections: SportsSelection[];
  stake: number;
  totalOdds: number;
  potentialPayout: number;
  cashOutAvailable: boolean;
  cashOutAmount: number;
  status: 'pending' | 'won' | 'lost' | 'cashed_out';
  placedAt: string;
}

export interface SportsMatch {
  id: string;
  sport: 'football' | 'basketball' | 'tennis' | 'esports';
  league: string;
  teamHome: string;
  teamAway: string;
  scoreHome?: number;
  scoreAway?: number;
  time: string;
  isLive: boolean;
  oddsHome: number;
  oddsDraw?: number;
  oddsAway: number;
  overUnderLine?: number;
  oddsOver?: number;
  oddsUnder?: number;
}
