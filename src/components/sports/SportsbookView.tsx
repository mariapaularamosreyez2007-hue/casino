import React, { useState, useEffect } from 'react';
import { SportsMatch, SportsSelection, SportsBet, UserAccount } from '../../types';
import {
  Trophy,
  Flame,
  Radio,
  Clock,
  CheckCircle2,
  X,
  Trash2,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import { sounds } from '../../utils/audio';

interface SportsbookViewProps {
  user: UserAccount | null;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

const SAMPLE_MATCHES: SportsMatch[] = [
  {
    id: 'm1',
    sport: 'football',
    league: 'UEFA Champions League',
    teamHome: 'Real Madrid',
    teamAway: 'Manchester City',
    scoreHome: 2,
    scoreAway: 1,
    time: '68\' 2T',
    isLive: true,
    oddsHome: 2.15,
    oddsDraw: 3.40,
    oddsAway: 3.10,
    overUnderLine: 3.5,
    oddsOver: 1.85,
    oddsUnder: 1.95,
  },
  {
    id: 'm2',
    sport: 'football',
    league: 'Premier League',
    teamHome: 'Arsenal',
    teamAway: 'Liverpool',
    scoreHome: 1,
    scoreAway: 1,
    time: '52\' 2T',
    isLive: true,
    oddsHome: 2.45,
    oddsDraw: 3.20,
    oddsAway: 2.80,
    overUnderLine: 2.5,
    oddsOver: 1.72,
    oddsUnder: 2.10,
  },
  {
    id: 'm3',
    sport: 'basketball',
    league: 'NBA Playoffs',
    teamHome: 'Boston Celtics',
    teamAway: 'Golden State Warriors',
    scoreHome: 88,
    scoreAway: 84,
    time: 'Q3 04:12',
    isLive: true,
    oddsHome: 1.55,
    oddsAway: 2.45,
    overUnderLine: 218.5,
    oddsOver: 1.90,
    oddsUnder: 1.90,
  },
  {
    id: 'm4',
    sport: 'esports',
    league: 'CS2 Major Championship',
    teamHome: 'Natus Vincere',
    teamAway: 'FaZe Clan',
    scoreHome: 1,
    scoreAway: 0,
    time: 'Mapa 2 (Mirage)',
    isLive: true,
    oddsHome: 1.65,
    oddsAway: 2.25,
    overUnderLine: 26.5,
    oddsOver: 1.80,
    oddsUnder: 2.00,
  },
  {
    id: 'm5',
    sport: 'football',
    league: 'La Liga Santander',
    teamHome: 'FC Barcelona',
    teamAway: 'Atlético de Madrid',
    time: 'Hoy 21:00',
    isLive: false,
    oddsHome: 1.90,
    oddsDraw: 3.50,
    oddsAway: 3.80,
    overUnderLine: 2.5,
    oddsOver: 1.82,
    oddsUnder: 1.98,
  },
  {
    id: 'm6',
    sport: 'tennis',
    league: 'Roland Garros Grand Slam',
    teamHome: 'Carlos Alcaraz',
    teamAway: 'Jannik Sinner',
    time: 'Mañana 15:30',
    isLive: false,
    oddsHome: 1.85,
    oddsAway: 1.95,
  },
];

export const SportsbookView: React.FC<SportsbookViewProps> = ({
  user,
  onUpdateBalance,
  onRecordBet,
}) => {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [filterLive, setFilterLive] = useState<boolean>(false);

  // Betslip state
  const [betslipTab, setBetslipTab] = useState<'single' | 'parlay' | 'builder'>('single');
  const [selections, setSelections] = useState<SportsSelection[]>([]);
  const [stakeAmount, setStakeAmount] = useState<number>(20);
  const [activeBets, setActiveBets] = useState<SportsBet[]>([
    {
      id: 'sb-demo-1',
      type: 'single',
      selections: [
        {
          matchId: 'm1',
          matchTitle: 'Real Madrid vs Manchester City',
          sport: 'Fútbol',
          marketName: 'Ganador (1X2)',
          selectionName: 'Real Madrid',
          odds: 2.15,
        },
      ],
      stake: 50,
      totalOdds: 2.15,
      potentialPayout: 107.5,
      cashOutAvailable: true,
      cashOutAmount: 78.4,
      status: 'pending',
      placedAt: 'Hace 35 min',
    },
  ]);

  const [activeSubTab, setActiveSubTab] = useState<'slip' | 'my_bets'>('slip');

  const filteredMatches = SAMPLE_MATCHES.filter((m) => {
    if (filterLive && !m.isLive) return false;
    if (selectedSport !== 'all' && m.sport !== selectedSport) return false;
    return true;
  });

  const isSelectionInSlip = (matchId: string, selectionName: string) => {
    return selections.some((s) => s.matchId === matchId && s.selectionName === selectionName);
  };

  const handleToggleSelection = (
    match: SportsMatch,
    marketName: string,
    selectionName: string,
    odds: number
  ) => {
    sounds.playChipClick();
    if (isSelectionInSlip(match.id, selectionName)) {
      setSelections((prev) => prev.filter((s) => !(s.matchId === match.id && s.selectionName === selectionName)));
    } else {
      const matchTitle = `${match.teamHome} vs ${match.teamAway}`;
      // In single/parlay, replace existing selection from same match unless builder mode
      if (betslipTab !== 'builder') {
        const otherMatchSelections = selections.filter((s) => s.matchId !== match.id);
        setSelections([
          ...otherMatchSelections,
          { matchId: match.id, matchTitle, sport: match.sport, marketName, selectionName, odds },
        ]);
      } else {
        setSelections((prev) => [
          ...prev,
          { matchId: match.id, matchTitle, sport: match.sport, marketName, selectionName, odds },
        ]);
      }
      setActiveSubTab('slip');
    }
  };

  // Calculate total Parlay / Combinada Odds
  const totalParlayOdds = selections.reduce((acc, s) => acc * s.odds, 1);
  const comboBonusMultiplier = selections.length >= 3 ? 1 + (selections.length * 0.03) : 1;
  const finalCalculatedOdds = parseFloat((totalParlayOdds * comboBonusMultiplier).toFixed(2));
  const potentialPayout = parseFloat((stakeAmount * finalCalculatedOdds).toFixed(2));

  // Place Betslip
  const handlePlaceBet = () => {
    if (!user) {
      showToast('Inicia sesión para colocar tu apuesta deportiva.', 'error');
      return;
    }
    if (selections.length === 0) {
      showToast('Selecciona al menos una cuota para apostar.', 'info');
      return;
    }
    if (stakeAmount <= 0) {
      showToast('Ingresa un monto de apuesta válido.', 'error');
      return;
    }
    if (stakeAmount > user.balance) {
      showToast('Saldo insuficiente en tu cuenta para esta apuesta.', 'error');
      return;
    }

    onUpdateBalance(user.balance - stakeAmount);
    sounds.playTilePress();

    const newBet: SportsBet = {
      id: `sb-${Date.now()}`,
      type: betslipTab,
      selections: [...selections],
      stake: stakeAmount,
      totalOdds: finalCalculatedOdds,
      potentialPayout,
      cashOutAvailable: true,
      cashOutAmount: parseFloat((stakeAmount * 0.92).toFixed(2)),
      status: 'pending',
      placedAt: 'Justo ahora',
    };

    setActiveBets((prev) => [newBet, ...prev]);
    setSelections([]);
    setActiveSubTab('my_bets');
    showToast(`¡Apuesta de US$ ${stakeAmount.toFixed(2)} colocada con éxito!`, 'success');

    // Record in global bets log
    onRecordBet(stakeAmount, finalCalculatedOdds, 0, false);
  };

  // Cash Out in real-time
  const handleCashOut = (bet: SportsBet) => {
    if (!user || !bet.cashOutAvailable || bet.status !== 'pending') return;

    onUpdateBalance(user.balance + bet.cashOutAmount);
    sounds.playCashout();

    setActiveBets((prev) =>
      prev.map((b) => (b.id === bet.id ? { ...b, status: 'cashed_out', cashOutAvailable: false } : b))
    );

    showToast(`¡Cash Out procesado! Cobraste US$ ${bet.cashOutAmount.toFixed(2)} instantáneamente.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Ticker */}
      <div className="bg-gradient-to-r from-[#0f212e] via-[#1a2c38] to-[#0f212e] border border-[#213743] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#00e701]/10 border border-[#00e701]/30 flex items-center justify-center text-[#00e701]">
            <Trophy size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">STAKE SPORTSBOOK PRO</h2>
              <span className="bg-[#ed4245] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Radio size={10} /> EN VIVO
              </span>
            </div>
            <p className="text-xs text-[#b1bad3]">
              Cuotas oficiales en tiempo real · Apuestas Simples, Parlays y Cash Out Inmediato
            </p>
          </div>
        </div>

        {/* Quick Sport Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterLive(!filterLive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              filterLive
                ? 'bg-[#ed4245] border-[#ed4245] text-white shadow-md shadow-[#ed4245]/20'
                : 'bg-[#1a2c38] border-[#2f4553] text-[#b1bad3] hover:text-white'
            }`}
          >
            <Radio size={12} className={filterLive ? 'animate-spin' : ''} />
            <span>Solo En Vivo</span>
          </button>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'football', label: '⚽ Fútbol' },
            { id: 'basketball', label: '🏀 Baloncesto' },
            { id: 'tennis', label: '🎾 Tenis' },
            { id: 'esports', label: '🎮 eSports' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSport(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                selectedSport === s.id
                  ? 'bg-[#00e701] border-[#00e701] text-[#0f212e] shadow-md shadow-[#00e701]/20 font-black'
                  : 'bg-[#1a2c38] border-[#2f4553] text-[#b1bad3] hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Matches feed on Left (2/3), Betslip on Right (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Matches Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#b1bad3] uppercase tracking-wider">
              Mercados Principales ({filteredMatches.length} eventos disponibles)
            </span>
            <span className="text-xs text-[#00e701] font-semibold flex items-center gap-1">
              <ShieldCheck size={14} /> Cuotas Verificadas Oficiales
            </span>
          </div>

          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="bg-[#1a2c38] border border-[#213743] hover:border-[#2f4553] rounded-2xl p-4 transition-all shadow-md"
              >
                {/* Match Header */}
                <div className="flex items-center justify-between text-xs text-[#557086] mb-3 pb-2 border-b border-[#213743]/60">
                  <span className="font-bold uppercase tracking-wider text-[#b1bad3]">
                    {match.league}
                  </span>
                  <div className="flex items-center gap-2">
                    {match.isLive ? (
                      <span className="text-[#ed4245] font-black flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#ed4245] animate-ping" />
                        {match.time}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[#b1bad3]">
                        <Clock size={12} /> {match.time}
                      </span>
                    )}
                  </div>
                </div>

                {/* Teams & Score */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-bold text-white">
                      <span>{match.teamHome}</span>
                      {match.scoreHome !== undefined && (
                        <span className="font-mono text-base text-[#00e701] font-black">
                          {match.scoreHome}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-white">
                      <span>{match.teamAway}</span>
                      {match.scoreAway !== undefined && (
                        <span className="font-mono text-base text-[#00e701] font-black">
                          {match.scoreAway}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Odds 1X2 Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* 1: Home Win */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleSelection(match, 'Ganador (1X2)', match.teamHome, match.oddsHome)
                      }
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isSelectionInSlip(match.id, match.teamHome)
                          ? 'bg-[#00e701] border-[#00e701] text-[#0f212e] font-black shadow-md'
                          : 'bg-[#0f212e] border-[#213743] hover:border-[#00e701]/60 text-white'
                      }`}
                    >
                      <span className="text-[10px] block opacity-70">1 (Local)</span>
                      <span className="text-xs font-mono font-bold">{match.oddsHome.toFixed(2)}</span>
                    </button>

                    {/* X: Draw */}
                    {match.oddsDraw ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSelection(match, 'Ganador (1X2)', 'Empate (X)', match.oddsDraw!)
                        }
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelectionInSlip(match.id, 'Empate (X)')
                            ? 'bg-[#00e701] border-[#00e701] text-[#0f212e] font-black shadow-md'
                            : 'bg-[#0f212e] border-[#213743] hover:border-[#00e701]/60 text-white'
                        }`}
                      >
                        <span className="text-[10px] block opacity-70">X (Empate)</span>
                        <span className="text-xs font-mono font-bold">{match.oddsDraw.toFixed(2)}</span>
                      </button>
                    ) : (
                      <div className="bg-[#0f212e]/40 rounded-xl border border-[#213743] flex items-center justify-center text-[10px] text-[#557086]">
                        -
                      </div>
                    )}

                    {/* 2: Away Win */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleSelection(match, 'Ganador (1X2)', match.teamAway, match.oddsAway)
                      }
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isSelectionInSlip(match.id, match.teamAway)
                          ? 'bg-[#00e701] border-[#00e701] text-[#0f212e] font-black shadow-md'
                          : 'bg-[#0f212e] border-[#213743] hover:border-[#00e701]/60 text-white'
                      }`}
                    >
                      <span className="text-[10px] block opacity-70">2 (Visita)</span>
                      <span className="text-xs font-mono font-bold">{match.oddsAway.toFixed(2)}</span>
                    </button>
                  </div>
                </div>

                {/* Over/Under Markets if present */}
                {match.overUnderLine && match.oddsOver && match.oddsUnder && (
                  <div className="mt-3 pt-2.5 border-t border-[#213743]/50 flex items-center justify-between text-xs">
                    <span className="text-[#557086] font-semibold text-[11px]">
                      Goles Más / Menos ({match.overUnderLine})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleToggleSelection(
                            match,
                            `Más de ${match.overUnderLine}`,
                            `+${match.overUnderLine} Goles`,
                            match.oddsOver!
                          )
                        }
                        className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold transition-all ${
                          isSelectionInSlip(match.id, `+${match.overUnderLine} Goles`)
                            ? 'bg-[#00e701] border-[#00e701] text-[#0f212e]'
                            : 'bg-[#0f212e] border-[#213743] text-[#b1bad3] hover:text-white'
                        }`}
                      >
                        Más: {match.oddsOver.toFixed(2)}
                      </button>
                      <button
                        onClick={() =>
                          handleToggleSelection(
                            match,
                            `Menos de ${match.overUnderLine}`,
                            `-${match.overUnderLine} Goles`,
                            match.oddsUnder!
                          )
                        }
                        className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold transition-all ${
                          isSelectionInSlip(match.id, `-${match.overUnderLine} Goles`)
                            ? 'bg-[#00e701] border-[#00e701] text-[#0f212e]'
                            : 'bg-[#0f212e] border-[#213743] text-[#b1bad3] hover:text-white'
                        }`}
                      >
                        Menos: {match.oddsUnder.toFixed(2)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Stake Betslip & My Bets */}
        <div className="space-y-4">
          <div className="bg-[#1a2c38] border border-[#213743] rounded-2xl overflow-hidden shadow-2xl sticky top-20">
            {/* Sub-Tabs: Boleta vs Mis Apuestas */}
            <div className="grid grid-cols-2 p-1.5 bg-[#0f212e] border-b border-[#213743]">
              <button
                type="button"
                onClick={() => setActiveSubTab('slip')}
                className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeSubTab === 'slip'
                    ? 'bg-[#213743] text-white shadow-md'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                <span>Boleta de Apuestas</span>
                {selections.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#00e701] text-[#0f212e] text-[10px] font-black flex items-center justify-center">
                    {selections.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('my_bets')}
                className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeSubTab === 'my_bets'
                    ? 'bg-[#213743] text-white shadow-md'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                <span>Mis Apuestas</span>
                {activeBets.filter((b) => b.status === 'pending').length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-[#0f212e] text-[10px] font-black flex items-center justify-center">
                    {activeBets.filter((b) => b.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>

            {activeSubTab === 'slip' ? (
              <div className="p-4 space-y-4">
                {/* Bet Types Toggle: Simple / Combinada / Bet Builder */}
                <div className="grid grid-cols-3 p-1 bg-[#0f212e] rounded-xl border border-[#213743]">
                  <button
                    type="button"
                    onClick={() => setBetslipTab('single')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      betslipTab === 'single'
                        ? 'bg-[#213743] text-white shadow'
                        : 'text-[#b1bad3] hover:text-white'
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setBetslipTab('parlay')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      betslipTab === 'parlay'
                        ? 'bg-[#213743] text-white shadow'
                        : 'text-[#b1bad3] hover:text-white'
                    }`}
                  >
                    Combinada
                  </button>
                  <button
                    type="button"
                    onClick={() => setBetslipTab('builder')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      betslipTab === 'builder'
                        ? 'bg-[#213743] text-white shadow'
                        : 'text-[#b1bad3] hover:text-white'
                    }`}
                  >
                    Bet Builder
                  </button>
                </div>

                {/* Selections List */}
                {selections.length === 0 ? (
                  <div className="text-center py-8 text-[#557086] space-y-2">
                    <Trophy size={36} className="mx-auto opacity-30" />
                    <p className="text-xs font-semibold">Tu boleta de apuestas está vacía</p>
                    <p className="text-[11px] text-[#557086]">
                      Haz clic en cualquier cuota de los partidos para armar tu apuesta simple o parlay.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <div className="flex justify-between text-xs text-[#557086] pb-1">
                      <span>Selecciones ({selections.length})</span>
                      <button
                        onClick={() => setSelections([])}
                        className="text-[#ed4245] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Trash2 size={11} /> Vaciar
                      </button>
                    </div>

                    {selections.map((sel) => (
                      <div
                        key={`${sel.matchId}-${sel.selectionName}`}
                        className="bg-[#0f212e] border border-[#213743] p-2.5 rounded-xl text-xs space-y-1 relative"
                      >
                        <button
                          onClick={() =>
                            setSelections((prev) =>
                              prev.filter((s) => !(s.matchId === sel.matchId && s.selectionName === sel.selectionName))
                            )
                          }
                          className="absolute right-2 top-2 text-[#557086] hover:text-white"
                        >
                          <X size={13} />
                        </button>
                        <span className="text-[10px] text-[#557086] block truncate max-w-[200px]">
                          {sel.matchTitle}
                        </span>
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-white">{sel.selectionName}</span>
                          <span className="font-mono text-[#00e701]">{sel.odds.toFixed(2)}</span>
                        </div>
                        <span className="text-[10px] text-[#b1bad3] block">{sel.marketName}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stake Input & Summary */}
                {selections.length > 0 && (
                  <div className="pt-2 border-t border-[#213743] space-y-3">
                    {/* Combo boost notice */}
                    {betslipTab === 'parlay' && selections.length >= 3 && (
                      <div className="p-2 bg-[#00e701]/10 border border-[#00e701]/30 rounded-lg flex items-center justify-between text-[11px] text-[#00e701]">
                        <span className="flex items-center gap-1 font-bold">
                          <Sparkles size={12} /> Multi-Combo Boost Activado
                        </span>
                        <span className="font-mono font-black">+{(selections.length * 3)}% EXTRA</span>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-xs text-[#b1bad3] mb-1 font-semibold">
                        <span>Monto de Apuesta (USD)</span>
                        <span className="font-mono text-white">US$ {stakeAmount.toFixed(2)}</span>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-xs font-bold text-[#557086]">$</div>
                        <input
                          type="number"
                          min="1"
                          step="5"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                          className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2 pl-7 pr-24 text-xs font-bold text-white font-mono focus:outline-none"
                        />
                        <div className="absolute right-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setStakeAmount(Math.max(1, parseFloat((stakeAmount / 2).toFixed(2))))}
                            className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[11px] font-bold text-[#b1bad3] rounded"
                          >
                            ½
                          </button>
                          <button
                            type="button"
                            onClick={() => setStakeAmount(parseFloat((stakeAmount * 2).toFixed(2)))}
                            className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[11px] font-bold text-[#b1bad3] rounded"
                          >
                            2×
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Calculated Odds and Payout */}
                    <div className="bg-[#0f212e] p-3 rounded-xl border border-[#213743] text-xs space-y-1.5">
                      <div className="flex justify-between text-[#b1bad3]">
                        <span>Cuota Total Acumulada:</span>
                        <span className="font-mono font-bold text-white">{finalCalculatedOdds}×</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-[#213743]/60">
                        <span className="text-white font-bold">Ganancia Potencial:</span>
                        <span className="font-mono font-black text-[#00e701] text-sm tabular-nums">
                          US$ {potentialPayout.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlaceBet}
                      className="w-full py-3 bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#00e701]/25 flex items-center justify-center gap-2"
                    >
                      <span>Colocar Apuesta</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* MY ACTIVE BETS & CASH OUT */
              <div className="p-4 space-y-3">
                <span className="text-xs font-bold text-[#b1bad3] block uppercase tracking-wider mb-2">
                  Historial de Apuestas Deportivas
                </span>

                {activeBets.length === 0 ? (
                  <p className="text-xs text-[#557086] text-center py-6">No tienes apuestas activas.</p>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {activeBets.map((bet) => (
                      <div
                        key={bet.id}
                        className="bg-[#0f212e] border border-[#213743] p-3 rounded-xl text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#213743]/60">
                          <span className="font-mono text-[#557086]">{bet.placedAt}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              bet.status === 'cashed_out'
                                ? 'bg-amber-400/10 text-amber-400'
                                : bet.status === 'won'
                                ? 'bg-[#00e701]/10 text-[#00e701]'
                                : 'bg-sky-400/10 text-sky-400'
                            }`}
                          >
                            {bet.status === 'cashed_out'
                              ? 'CASH OUT REALIZADO'
                              : bet.status === 'won'
                              ? 'GANADA'
                              : 'EN VIVO'}
                          </span>
                        </div>

                        {/* Selections */}
                        <div className="space-y-1">
                          {bet.selections.map((s, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span className="text-white font-semibold">{s.selectionName}</span>
                              <span className="font-mono text-[#00e701]">{s.odds.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-[#213743]/50 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="text-[#557086] block">Apostado:</span>
                            <span className="font-mono text-white font-bold">US$ {bet.stake.toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#557086] block">Posible Pago:</span>
                            <span className="font-mono text-[#00e701] font-bold">
                              US$ {bet.potentialPayout.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* CASH OUT BUTTON */}
                        {bet.status === 'pending' && bet.cashOutAvailable && (
                          <button
                            type="button"
                            onClick={() => handleCashOut(bet)}
                            className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0f212e] font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow flex items-center justify-center gap-1.5"
                          >
                            <DollarSign size={14} />
                            <span>Cash Out Anticipado (Cobrar US$ {bet.cashOutAmount.toFixed(2)})</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
