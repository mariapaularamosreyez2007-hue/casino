import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { showToast } from '../../utils/toast';
import {
  Volume2,
  VolumeX,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Trophy,
  Crown,
  Play,
  Palette,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface SolitaireGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordBet: (betAmount: number, multiplier: number, payout: number, isWin: boolean) => void;
}

type Suit = '♠' | '♥' | '♦' | '♣';
type CardColor = 'red' | 'black';

interface Card {
  id: string;
  suit: Suit;
  value: number; // 1 = A, 11 = J, 12 = Q, 13 = K
  color: CardColor;
  faceUp: boolean;
}

type DeckSkin = 'gold' | 'crimson' | 'cyber';

const DECK_SKINS: Record<DeckSkin, { name: string; bg: string; border: string; accent: string }> = {
  gold: {
    name: 'Oro Asted Real',
    bg: 'bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700',
    border: 'border-amber-300',
    accent: '#facc15',
  },
  crimson: {
    name: 'Carmesí Royale',
    bg: 'bg-gradient-to-br from-red-800 via-rose-700 to-red-950',
    border: 'border-red-400',
    accent: '#f43f5e',
  },
  cyber: {
    name: 'Cyberpunk Neón',
    bg: 'bg-gradient-to-br from-indigo-900 via-purple-800 to-cyan-900',
    border: 'border-cyan-400',
    accent: '#38bdf8',
  },
};

const SUIT_COLORS: Record<Suit, CardColor> = {
  '♠': 'black',
  '♣': 'black',
  '♥': 'red',
  '♦': 'red',
};

const VALUE_LABELS: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

export const SolitaireGame: React.FC<SolitaireGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordBet,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [deckSkin, setDeckSkin] = useState<DeckSkin>('gold');
  const [showRules, setShowRules] = useState<boolean>(false);

  // Solitaire Game State
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]); // 4 suits
  const [tableau, setTableau] = useState<Card[][]>([[], [], [], [], [], [], []]); // 7 columns
  const [selectedCard, setSelectedCard] = useState<{ source: string; colIdx?: number; cardIdx?: number } | null>(null);

  // Financial Stats
  const [cardsPlacedInFoundations, setCardsPlacedInFoundations] = useState<number>(0);
  const [currentPayoutTally, setCurrentPayoutTally] = useState<number>(0);

  // Payout per card placed on foundation: (betAmount * 0.20)
  const payoutPerCard = parseFloat((betAmount * 0.2).toFixed(2));

  // Initialize new 52-card deck
  const createDeck = (): Card[] => {
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const deck: Card[] = [];
    suits.forEach((suit) => {
      for (let value = 1; value <= 13; value++) {
        deck.push({
          id: `${suit}-${value}-${Math.random().toString(36).substr(2, 4)}`,
          suit,
          value,
          color: SUIT_COLORS[suit],
          faceUp: false,
        });
      }
    });

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const startNewGame = () => {
    if (betAmount <= 0) return;
    if (betAmount > balance) {
      showToast('Saldo insuficiente en tu cartera de Asted.', 'error');
      return;
    }

    onUpdateBalance(balance - betAmount);
    sounds.playChipClick();

    const deck = createDeck();
    const newTableau: Card[][] = [[], [], [], [], [], [], []];
    let cardIdx = 0;

    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck[cardIdx++];
        card.faceUp = row === col; // Only top card face up
        newTableau[col].push(card);
      }
    }

    const remainingStock = deck.slice(cardIdx).map((c) => ({ ...c, faceUp: false }));

    setTableau(newTableau);
    setStock(remainingStock);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setSelectedCard(null);
    setCardsPlacedInFoundations(0);
    setCurrentPayoutTally(0);
    setIsPlaying(true);
  };

  // Draw card from Stock to Waste
  const handleDrawStock = () => {
    if (stock.length > 0) {
      const drawn = stock[stock.length - 1];
      drawn.faceUp = true;
      setStock((s) => s.slice(0, -1));
      setWaste((w) => [...w, drawn]);
      sounds.playSpinTick();
    } else if (waste.length > 0) {
      // Recycle waste back into stock
      const recycled = [...waste].reverse().map((c) => ({ ...c, faceUp: false }));
      setStock(recycled);
      setWaste([]);
      sounds.playChipClick();
    }
  };

  // Try to auto move card to foundations
  const moveToFoundation = (card: Card, sourceCol?: number) => {
    const fIdx = foundations.findIndex((f) => {
      if (f.length === 0) return card.value === 1; // Ace
      const top = f[f.length - 1];
      return top.suit === card.suit && top.value === card.value - 1;
    });

    if (fIdx !== -1) {
      const newFoundations = foundations.map((f, i) => (i === fIdx ? [...f, card] : f));
      setFoundations(newFoundations);

      // Remove from source
      if (sourceCol !== undefined) {
        setTableau((t) => {
          const col = [...t[sourceCol]];
          col.pop();
          if (col.length > 0 && !col[col.length - 1].faceUp) {
            col[col.length - 1].faceUp = true;
          }
          return t.map((c, i) => (i === sourceCol ? col : c));
        });
      } else {
        setWaste((w) => w.slice(0, -1));
      }

      // Add Payout!
      const newPlaced = cardsPlacedInFoundations + 1;
      const reward = payoutPerCard;
      const totalEarned = parseFloat((currentPayoutTally + reward).toFixed(2));

      setCardsPlacedInFoundations(newPlaced);
      setCurrentPayoutTally(totalEarned);
      onUpdateBalance(balance + reward);

      sounds.playGemChime(Math.min(10, newPlaced));

      // 52 cards completed = WIN JACKPOT
      if (newPlaced === 52) {
        const grandBonus = betAmount * 20;
        onUpdateBalance(balance + reward + grandBonus);
        sounds.playGoldenJackpot();
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
        onRecordBet(betAmount, 25.4, totalEarned + grandBonus, true);
        setIsPlaying(false);
      }
      return true;
    }
    return false;
  };

  // Click card on Tableau
  const handleCardClick = (colIdx: number, cardIdx: number) => {
    const col = tableau[colIdx];
    const card = col[cardIdx];
    if (!card.faceUp) return;

    // If top card, try quick foundation move
    if (cardIdx === col.length - 1) {
      if (moveToFoundation(card, colIdx)) {
        setSelectedCard(null);
        return;
      }
    }

    // Otherwise select or move
    if (!selectedCard) {
      setSelectedCard({ source: 'tableau', colIdx, cardIdx });
      sounds.playChipClick();
    } else {
      // Attempt to move selected card(s) to this column
      moveSelectedToTableau(colIdx);
    }
  };

  // Move from Waste or Tableau to target Tableau column
  const moveSelectedToTableau = (targetColIdx: number) => {
    if (!selectedCard) return;

    let cardsToMove: Card[] = [];
    if (selectedCard.source === 'waste') {
      if (waste.length > 0) cardsToMove = [waste[waste.length - 1]];
    } else if (selectedCard.source === 'tableau' && selectedCard.colIdx !== undefined) {
      const srcCol = tableau[selectedCard.colIdx];
      cardsToMove = srcCol.slice(selectedCard.cardIdx!);
    }

    if (cardsToMove.length === 0) {
      setSelectedCard(null);
      return;
    }

    const movingCard = cardsToMove[0];
    const targetCol = tableau[targetColIdx];

    const canPlace =
      targetCol.length === 0
        ? movingCard.value === 13 // Only King can go to empty column
        : targetCol[targetCol.length - 1].color !== movingCard.color &&
          targetCol[targetCol.length - 1].value === movingCard.value + 1;

    if (canPlace) {
      // Add to target
      setTableau((t) =>
        t.map((col, idx) => (idx === targetColIdx ? [...col, ...cardsToMove] : col))
      );

      // Remove from source
      if (selectedCard.source === 'waste') {
        setWaste((w) => w.slice(0, -1));
      } else if (selectedCard.colIdx !== undefined) {
        setTableau((t) => {
          const srcCol = [...t[selectedCard.colIdx!]];
          srcCol.splice(selectedCard.cardIdx!);
          if (srcCol.length > 0 && !srcCol[srcCol.length - 1].faceUp) {
            srcCol[srcCol.length - 1].faceUp = true;
          }
          return t.map((c, i) => (i === selectedCard.colIdx ? srcCol : c));
        });
      }

      sounds.playPegBounce();
      setSelectedCard(null);
    } else {
      setSelectedCard(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row bg-[#0f212e] rounded-2xl overflow-hidden border border-[#213743] shadow-2xl">
      {/* Control Panel */}
      <div className="w-full lg:w-80 bg-[#1a2c38] p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#213743]">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#213743]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span className="text-sm font-black tracking-wider text-white uppercase">
                SOLITARIO VEGAS ASTED
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowRules(!showRules)}
                className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
                title="Reglas y Pagos"
              >
                <HelpCircle size={18} />
              </button>
              <button
                onClick={() => {
                  sounds.enabled = !soundEnabled;
                  setSoundEnabled(!soundEnabled);
                }}
                className="text-[#b1bad3] hover:text-white p-1 rounded transition-colors"
                title="Sonido"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
          </div>

          {/* Deck Back Skin Selector */}
          <div>
            <label className="text-xs text-[#b1bad3] font-semibold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Palette size={13} className="text-amber-400" /> Reverso de la Baraja
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#0f212e] p-1.5 rounded-xl border border-[#213743]">
              {(Object.keys(DECK_SKINS) as DeckSkin[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDeckSkin(key)}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-1 border ${
                    deckSkin === key
                      ? 'border-white text-white shadow-sm'
                      : 'border-[#213743] text-[#b1bad3] hover:text-white'
                  }`}
                >
                  <span className={`w-4 h-5 rounded ${DECK_SKINS[key].bg} border border-white/20`} />
                  <span>{DECK_SKINS[key].name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <div className="flex justify-between text-xs text-[#b1bad3] mb-1.5 font-medium">
              <span>Monto por Baraja</span>
              <span className="font-mono text-white font-bold">US$ {betAmount.toFixed(2)}</span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-xs font-semibold text-[#557086]">$</div>
              <input
                type="number"
                min="1"
                step="5"
                disabled={isPlaying}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-amber-400 rounded-lg py-2.5 pl-7 pr-24 text-sm font-semibold text-white focus:outline-none transition-colors disabled:opacity-60 font-mono"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => setBetAmount(Math.max(1, parseFloat((betAmount / 2).toFixed(2))))}
                  className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white text-xs font-bold rounded transition-colors"
                >
                  ½
                </button>
                <button
                  type="button"
                  disabled={isPlaying}
                  onClick={() => setBetAmount(parseFloat((betAmount * 2).toFixed(2)))}
                  className="px-2 py-1 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white text-xs font-bold rounded transition-colors"
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          {/* Casino Vegas Rules Summary */}
          <div className="bg-[#0f212e] p-3 rounded-xl border border-[#213743] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#b1bad3] font-sans">Pago por carta en base:</span>
              <span className="text-[#00e701] font-bold">+US$ {payoutPerCard.toFixed(2)} (0.2×)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#b1bad3] font-sans">Cartas en fundaciones:</span>
              <span className="text-white font-bold">{cardsPlacedInFoundations} / 52</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#213743]">
              <span className="text-[#b1bad3] font-sans">Ganado en partida:</span>
              <span className="text-[#00e701] font-bold text-sm">+US$ {currentPayoutTally.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 mt-4 border-t border-[#213743]">
          <button
            onClick={startNewGame}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm uppercase tracking-wider rounded-xl transition-all transform active:scale-95 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            <span>{isPlaying ? 'Reiniciar Partida' : 'Comprar Baraja'}</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#557086] mt-2.5">
            <ShieldCheck size={14} className="text-[#00e701]" />
            <span>Reglas Vegas Solitaire · 5 cartas para recuperar apuesta</span>
          </div>
        </div>
      </div>

      {/* Main Solitaire Casino Felt Arena */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between bg-gradient-to-b from-[#0b3823] via-[#082b1b] to-[#04170e] relative min-h-[540px]">
        {/* Top Area: Stock, Waste, and 4 Foundations */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Stock & Waste */}
          <div className="flex items-center gap-3">
            {/* Stock */}
            <div
              onClick={handleDrawStock}
              className={`w-14 h-20 sm:w-16 sm:h-24 rounded-xl border-2 cursor-pointer flex items-center justify-center shadow-md transition-transform active:scale-95 ${
                stock.length > 0
                  ? `${DECK_SKINS[deckSkin].bg} ${DECK_SKINS[deckSkin].border}`
                  : 'bg-black/30 border-dashed border-white/20'
              }`}
            >
              {stock.length > 0 ? (
                <span className="text-white/60 font-black text-xs font-mono">{stock.length}</span>
              ) : (
                <RotateCcw size={18} className="text-white/40" />
              )}
            </div>

            {/* Waste */}
            <div
              onClick={() => {
                if (waste.length > 0) {
                  const top = waste[waste.length - 1];
                  if (!moveToFoundation(top)) {
                    setSelectedCard({ source: 'waste' });
                  }
                }
              }}
              className={`w-14 h-20 sm:w-16 sm:h-24 rounded-xl border-2 flex items-center justify-center relative cursor-pointer shadow-md ${
                waste.length > 0
                  ? 'bg-white border-white/80'
                  : 'bg-black/20 border-dashed border-white/10'
              } ${selectedCard?.source === 'waste' ? 'ring-4 ring-amber-400' : ''}`}
            >
              {waste.length > 0 && (
                <CardView card={waste[waste.length - 1]} />
              )}
            </div>
          </div>

          {/* 4 Foundations */}
          <div className="flex items-center gap-2 sm:gap-3">
            {foundations.map((pile, idx) => {
              const suitIcons: Suit[] = ['♠', '♥', '♦', '♣'];
              const topCard = pile.length > 0 ? pile[pile.length - 1] : null;

              return (
                <div
                  key={idx}
                  className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl border-2 border-dashed border-amber-400/40 bg-black/30 flex items-center justify-center relative shadow-inner"
                >
                  {topCard ? (
                    <CardView card={topCard} />
                  ) : (
                    <span className="text-amber-400/30 text-2xl font-bold select-none">
                      {suitIcons[idx]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tableau 7 Columns */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3 w-full my-auto items-start">
          {tableau.map((column, colIdx) => (
            <div
              key={colIdx}
              onClick={() => {
                if (column.length === 0 && selectedCard) {
                  moveSelectedToTableau(colIdx);
                }
              }}
              className="flex flex-col relative min-h-[140px] rounded-xl border border-dashed border-white/5 bg-black/10 p-0.5"
            >
              {column.map((card, cardIdx) => {
                const isSelected =
                  selectedCard?.source === 'tableau' &&
                  selectedCard.colIdx === colIdx &&
                  selectedCard.cardIdx === cardIdx;

                return (
                  <div
                    key={card.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(colIdx, cardIdx);
                    }}
                    style={{ marginTop: cardIdx === 0 ? 0 : -52 }}
                    className={`w-full aspect-[2/3] rounded-xl border-2 flex items-center justify-center relative shadow-lg cursor-pointer transition-transform ${
                      card.faceUp
                        ? 'bg-white border-white/90'
                        : `${DECK_SKINS[deckSkin].bg} ${DECK_SKINS[deckSkin].border}`
                    } ${isSelected ? 'ring-4 ring-amber-400 scale-105 z-30' : 'hover:scale-[1.02]'}`}
                  >
                    {card.faceUp ? (
                      <CardView card={card} />
                    ) : (
                      <span className="text-white/40 text-xs font-black">ASTED</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Statistics Bar */}
        <div className="w-full flex items-center justify-between text-xs text-white/70 pt-2 border-t border-white/10">
          <span>Baraja Francesa 52 Cartas · Modo Solitario Klondike</span>
          <span>5+ Cartas en fundaciones generan ganancia neta</span>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1a2c38] border border-[#2f4553] max-w-md w-full rounded-2xl p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-amber-300 uppercase tracking-wide">
              REGLAS DE SOLITARIO VEGAS ASTED
            </h3>
            <p className="text-xs text-[#b1bad3] leading-relaxed">
              En Solitario Vegas compras una baraja completa. Cada carta que logras colocar en las 4 fundaciones (del As al Rey por palo) te paga instantáneamente el <strong>20% de tu apuesta inicial (0.2×)</strong>.
            </p>
            <ul className="text-xs text-[#b1bad3] space-y-1.5 list-disc pl-4">
              <li>Colocar 5 cartas recupera el 100% de tu apuesta.</li>
              <li>Colocar 20 cartas te otorga 4× tu inversión.</li>
              <li>Completar las 52 cartas otorga el premio mayor con bonificación de 20×!</li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="w-full py-3 bg-[#00e701] text-[#0f212e] font-black uppercase rounded-xl"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent to render 3D-styled French card face
const CardView: React.FC<{ card: Card }> = ({ card }) => {
  const isRed = card.color === 'red';
  const label = VALUE_LABELS[card.value];

  return (
    <div className="w-full h-full p-1.5 flex flex-col justify-between select-none">
      <div className={`flex items-center justify-between text-xs font-black leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span>{label}</span>
        <span>{card.suit}</span>
      </div>
      <div className={`text-center text-xl sm:text-2xl font-black ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        {card.suit}
      </div>
      <div className={`flex items-center justify-between text-xs font-black leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span>{label}</span>
        <span>{card.suit}</span>
      </div>
    </div>
  );
};
