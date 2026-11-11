import React, { useState, useEffect } from 'react';
import { GameItem, GameCategory, UserAccount, LiveBet } from './types';
import { GAMES_DATA } from './data/games';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HeroCarousel } from './components/HeroCarousel';
import { CategoryNav } from './components/CategoryNav';
import { GameCard } from './components/GameCard';
import { LiveBetsTable } from './components/LiveBetsTable';
import { ChatSidebar } from './components/ChatSidebar';
import { GameModal } from './components/games/GameModal';
import { SearchModal } from './components/modals/SearchModal';
import { AuthModal } from './components/modals/AuthModal';
import { WalletModal } from './components/modals/WalletModal';
import { SupportModal } from './components/modals/SupportModal';
import { ToastContainer } from './components/ToastContainer';
import { PlayerEconomyService } from './services/PlayerEconomyService';
import { SportsbookView } from './components/sports/SportsbookView';
import { AstedLogo, AstedExclusiveBadge } from './components/AstedLogo';
import {
  Flame,
  Sparkles,
  Tv,
  ChevronRight,
  Headphones,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  // Navigation & UI States
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<GameCategory>('all');
  const [activeMode, setActiveMode] = useState<'casino' | 'sports'>('casino');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);

  // Selected game to play
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);

  // Provider filter inside lobby
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // User session state (Defaults to demo logged in user for instant fun!)
  const [user, setUser] = useState<UserAccount | null>({
    username: 'AstedPro',
    email: 'vip@asted.com',
    balance: 2450.0,
    vaultBalance: 850.0,
    rakebackBalance: 42.80,
    currency: 'USD',
    vipLevel: 'Gold',
    totalWagered: 4320.0,
    joinedDate: 'Oct 2024',
    savedGames: ['mines', 'plinko', 'gates-of-olympus-1000', 'ruleta-en-espanol'],
  });

  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [userBets, setUserBets] = useState<LiveBet[]>([]);

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRecordBet = (
    betAmount: number,
    multiplier: number,
    payout: number,
    isWin: boolean
  ) => {
    if (!activeGame || !user) return;

    // Calculate instantaneous Rakeback from house edge
    const rakebackEarned = PlayerEconomyService.calculateRakeback(betAmount, 0.01, user.totalWagered);
    const newTotalWagered = user.totalWagered + betAmount;
    const newVip = PlayerEconomyService.getVipTier(newTotalWagered).name;

    // Update user stats with Rakeback and VIP level
    setUser((prev) =>
      prev
        ? {
            ...prev,
            totalWagered: newTotalWagered,
            rakebackBalance: Math.round(((prev.rakebackBalance || 0) + rakebackEarned) * 100) / 100,
            vipLevel: newVip,
          }
        : null
    );

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newBet: LiveBet = {
      id: `ub-${Date.now()}`,
      game: activeGame.title,
      user: user.username,
      time: timeStr,
      betAmount,
      currency: selectedCurrency,
      multiplier,
      payout,
      isWin,
    };

    setUserBets((prev) => [newBet, ...prev.slice(0, 19)]);
  };

  const handleToggleFavorite = (gameId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const isSaved = user.savedGames.includes(gameId);
    const updated = isSaved
      ? user.savedGames.filter((id) => id !== gameId)
      : [...user.savedGames, gameId];
    setUser({ ...user, savedGames: updated });
  };

  const handleSelectGameById = (gameId: string) => {
    const found = GAMES_DATA.find((g) => g.id === gameId);
    if (found) {
      setActiveGame(found);
    }
  };

  const handleSelectGameByName = (gameName: string) => {
    const found = GAMES_DATA.find(
      (g) => g.title.toLowerCase() === gameName.toLowerCase() || g.id === gameName.toLowerCase()
    );
    if (found) {
      setActiveGame(found);
    }
  };

  // Filtered games based on category and provider
  const getFilteredGames = () => {
    return GAMES_DATA.filter((game) => {
      // Category filter
      if (activeCategory === 'my-casino') {
        if (!user || !user.savedGames.includes(game.id)) return false;
      } else if (activeCategory !== 'all') {
        if (game.category !== activeCategory) return false;
      }

      // Provider filter
      if (selectedProvider !== 'all' && game.provider !== selectedProvider) {
        return false;
      }

      return true;
    });
  };

  // Grouped sections for the main view
  const originalsGames = GAMES_DATA.filter((g) => g.category === 'asted-originals');
  const exclusiveGames = GAMES_DATA.filter((g) => g.category === 'only-on-asted');
  const slotsGames = GAMES_DATA.filter((g) => g.category === 'slots');
  const liveGames = GAMES_DATA.filter((g) => g.category === 'live-casino');
  const newReleasesGames = GAMES_DATA.filter((g) => g.category === 'new-releases');

  const filteredGames = getFilteredGames();

  // All distinct providers for the dropdown filter
  const allProviders = Array.from(new Set(GAMES_DATA.map((g) => g.provider)));

  return (
    <div className="min-h-screen bg-[#0f212e] text-white flex flex-col font-sans selection:bg-[#1475e1] selection:text-white">
      {/* Top Header */}
      <Header
        user={user}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={() => setUser(null)}
        onOpenWallet={() => setWalletModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={setSelectedCurrency}
      />

      {/* Main Container with Sidebar Layout */}
      <div className="flex flex-1 relative">
        {/* Left Sidebar */}
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          activeMode={activeMode}
          onSelectMode={setActiveMode}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenSupport={() => setSupportModalOpen(true)}
          savedCount={user?.savedGames.length || 0}
          totalWagered={user?.totalWagered || 0}
        />

        {/* Main Content Viewport */}
        <main
          className={`flex-1 transition-all duration-300 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full ${
            isChatOpen ? 'lg:pr-84' : ''
          }`}
        >
          {activeMode === 'sports' ? (
            <SportsbookView
              user={user}
              onUpdateBalance={(newBal) => setUser((u) => (u ? { ...u, balance: newBal } : null))}
              onRecordBet={handleRecordBet}
            />
          ) : (
            <>
              {/* Top Hero Promotional Carousel */}
              <HeroCarousel onPlayGame={handleSelectGameById} />

              {/* Quick Filter Bar: Search In-Place & Provider Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-3 bg-[#1a2c38] hover:bg-[#213743] border border-[#2f4553] px-4 py-2.5 rounded-xl text-xs text-[#b1bad3] transition-colors w-full sm:max-w-md"
            >
              <Search size={16} className="text-[#557086]" />
              <span>Buscar en Asted.com</span>
              <span className="ml-auto bg-[#0f212e] text-[#557086] text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                Ctrl + K
              </span>
            </button>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[#1a2c38] border border-[#2f4553] px-3 py-2 rounded-xl text-xs text-[#b1bad3]">
                <Filter size={14} className="text-[#557086]" />
                <span className="text-[#557086] font-medium hidden sm:inline">Proveedor:</span>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-[#1a2c38]">Todos los proveedores</option>
                  {allProviders.map((p) => (
                    <option key={p} value={p} className="bg-[#1a2c38]">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Horizontal Category Tab Navigation */}
          <CategoryNav
            activeCategory={activeCategory}
            onSelectCategory={(cat) => setActiveCategory(cat)}
          />

          {/* SECTION 1: IF CATEGORY FILTER IS ACTIVE, SHOW SINGLE FILTERED GRID */}
          {activeCategory !== 'all' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-[#213743]">
                <div className="flex items-center gap-2">
                  {activeCategory === 'only-on-asted' && <AstedExclusiveBadge size={20} />}
                  {activeCategory === 'asted-originals' && <Flame size={20} className="text-[#00e701]" />}
                  {activeCategory === 'new-releases' && <Sparkles size={20} className="text-amber-400" />}
                  {activeCategory === 'live-casino' && <Tv size={20} className="text-blue-400" />}
                  <h2 className="text-lg font-bold text-white capitalize">
                    {activeCategory === 'asted-originals'
                      ? 'Originales de Asted'
                      : activeCategory === 'only-on-asted'
                      ? 'Solo en Asted'
                      : activeCategory === 'new-releases'
                      ? 'Lanzamientos'
                      : activeCategory === 'slots'
                      ? 'Tragamonedas / Slots'
                      : activeCategory === 'live-casino'
                      ? 'Casino en Vivo'
                      : activeCategory === 'my-casino'
                      ? 'Mi Casino / Favoritos'
                      : 'Juegos de Mesa'}
                  </h2>
                </div>
                <span className="text-xs text-[#557086] font-medium">
                  {filteredGames.length} juegos disponibles
                </span>
              </div>

              {filteredGames.length === 0 ? (
                <div className="py-16 text-center text-[#557086] bg-[#1a2c38] rounded-xl border border-[#213743]">
                  No se encontraron juegos en esta sección.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                  {filteredGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onSelect={(g) => setActiveGame(g)}
                      isFavorite={user?.savedGames.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* SECTION 2: DEFAULT LOBBY (SHOWS ALL STAKE-STYLE SECTIONS) */
            <div className="space-y-10">
              {/* Row 1: Originales de Asted (Mines, Limbo, Dice, Blackjack, Plinko, Keno, Crash) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame size={18} className="text-[#00e701]" />
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Originales de Asted
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveCategory('asted-originals')}
                    className="flex items-center gap-1 text-xs text-[#b1bad3] hover:text-white font-semibold transition-colors"
                  >
                    <span>Ver todos</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                  {originalsGames.slice(0, 7).map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onSelect={(g) => setActiveGame(g)}
                      isFavorite={user?.savedGames.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>

              {/* Row 2: Solo en Asted (Exclusives: Candy Swipe, Private Jet, Buried by Night, etc.) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AstedExclusiveBadge size={18} />
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Solo en Asted
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveCategory('only-on-asted')}
                    className="flex items-center gap-1 text-xs text-[#b1bad3] hover:text-white font-semibold transition-colors"
                  >
                    <span>Ver todos</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                  {exclusiveGames.slice(0, 7).map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onSelect={(g) => setActiveGame(g)}
                      isFavorite={user?.savedGames.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>

              {/* Row 3: Slots Populares (Gates of Olympus, Sugar Rush 1000, Sweet Bonanza 1000) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs bg-amber-400 text-[#0f212e] px-1 rounded">
                      777
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Tragamonedas Populares
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveCategory('slots')}
                    className="flex items-center gap-1 text-xs text-[#b1bad3] hover:text-white font-semibold transition-colors"
                  >
                    <span>Ver todos</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                  {slotsGames.slice(0, 7).map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onSelect={(g) => setActiveGame(g)}
                      isFavorite={user?.savedGames.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>

              {/* Row 4: Casino en Vivo (Blackjack Live, Ruleta en Español, Baccarat, etc.) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Tv size={18} className="text-blue-400" />
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Casino en Vivo
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveCategory('live-casino')}
                    className="flex items-center gap-1 text-xs text-[#b1bad3] hover:text-white font-semibold transition-colors"
                  >
                    <span>Ver todos</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                  {liveGames.slice(0, 7).map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onSelect={(g) => setActiveGame(g)}
                      isFavorite={user?.savedGames.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>

              {/* Row 5: Lanzamientos Recientes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Nuevos Lanzamientos
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveCategory('new-releases')}
                    className="flex items-center gap-1 text-xs text-[#b1bad3] hover:text-white font-semibold transition-colors"
                  >
                    <span>Ver todos</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                  {newReleasesGames.slice(0, 7).map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onSelect={(g) => setActiveGame(g)}
                      isFavorite={user?.savedGames.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Live Bets Table (Stake bottom rolling ticker) */}
          <LiveBetsTable
            userBets={userBets}
            onSelectGameByName={handleSelectGameByName}
          />

          {/* Footer with Stake Certifications, Fair Play, and Crypto Partners */}
          <footer className="pt-10 pb-16 border-t border-[#213743] mt-12 text-[#557086] text-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#213743]">
              <div className="flex items-center gap-3">
                <AstedLogo size="sm" />
                <span className="text-xs text-[#b1bad3]">
                  © 2026 ASTED.com · Todos los derechos reservados.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#b1bad3]">
                <span className="hover:text-white cursor-pointer transition-colors">Términos del Servicio</span>
                <span>·</span>
                <span className="hover:text-white cursor-pointer transition-colors">Juego Responsable (18+)</span>
                <span>·</span>
                <span className="hover:text-white cursor-pointer transition-colors">Equidad y Provably Fair</span>
                <span>·</span>
                <span className="hover:text-white cursor-pointer transition-colors">Afiliados</span>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck size={16} className="text-[#00e701]" />
                <span>Licencia Oficial de Juego Seguro y Criptomonedas Verificadas</span>
              </div>
              <div className="flex items-center gap-3 text-lg opacity-60">
                <span title="Bitcoin">🪙</span>
                <span title="Ethereum">💎</span>
                <span title="Tether">🟢</span>
                <span title="Litecoin">⚡</span>
                <span title="18+ Only">🔞</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </main>

        {/* Right Community Live Chat Drawer */}
        <ChatSidebar
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          user={user}
          onOpenAuth={() => {
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
        />
      </div>

      {/* Floating Headset Support Button (Stake bottom right corner) */}
      <button
        onClick={() => setSupportModalOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-[#1a2c38] hover:bg-[#213743] border border-[#2f4553] text-[#b1bad3] hover:text-white shadow-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95"
        title="Soporte ASTED en Vivo 24/7"
      >
        <Headphones size={20} className="text-[#00e701]" />
      </button>

      {/* Interactive Modals */}
      {/* 1. Playable Game Modal */}
      {activeGame && (
        <GameModal
          game={activeGame}
          onClose={() => setActiveGame(null)}
          balance={user?.balance || 0}
          onUpdateBalance={(newBal) => {
            if (user) {
              setUser({ ...user, balance: newBal });
            }
          }}
          onRecordBet={handleRecordBet}
          isFavorite={user ? user.savedGames.includes(activeGame.id) : false}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* 2. Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectGame={(g) => setActiveGame(g)}
      />

      {/* 3. Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />

      {/* 4. Wallet Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        user={user}
        onUpdateUser={(updated) => setUser(updated)}
        onAddFunds={(amount) => {
          if (user) {
            setUser({ ...user, balance: user.balance + amount });
          }
        }}
      />

      {/* 5. Support Modal */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />

      {/* 6. Global Stake Toast Container */}
      <ToastContainer />
    </div>
  );
}
