import { GameItem, LiveBet, ChatMessage } from '../types';

export const GAMES_DATA: GameItem[] = [
  // Asted Originals
  {
    id: 'villar',
    title: 'VILLAR PRO',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 3120,
    image: '/assets/games/billiard.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'billiard',
    rtp: 98.7,
    description: 'Mesa de billar y pool profesional con física 2D de colisión acelerada, bola 8, carambola 3 bandas y tiros maestros.'
  },
  {
    id: 'solitaire',
    title: 'SOLITARIO VEGAS',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 1680,
    image: '/assets/games/solitaire.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'solitaire',
    rtp: 98.5,
    description: 'Solitario clásico estilo casino Klondike con pago progresivo por cada carta enviada a las fundaciones y premio mayor por completar la baraja.'
  },
  {
    id: 'mines',
    title: 'MINES',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 2466,
    image: '/assets/games/mines.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'mines',
    rtp: 99.0,
    description: 'Encuentra las gemas y evita las minas explosivas. ¡Retira tu multiplicador en cualquier momento!'
  },
  {
    id: 'limbo',
    title: 'LIMBO',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 1846,
    image: '/assets/games/limbo.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'crash',
    rtp: 99.0,
    description: 'Apunta a multiplicadores gigantescos de hasta 1,000,000x en un solo tiro.'
  },
  {
    id: 'dice',
    title: 'DICE',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 1918,
    image: '/assets/games/dice.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'dice',
    rtp: 99.0,
    description: 'El clásico dado de Asted con slider personalizable de probabilidad y multiplicador.'
  },
  {
    id: 'blackjack',
    title: 'BLACKJACK',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 1401,
    image: '/assets/games/blackjack.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'roulette',
    rtp: 99.5,
    description: 'Blackjack clásico con crupier automático y probabilidad matemática favorable.'
  },
  {
    id: 'plinko',
    title: 'PLINKO',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 1029,
    image: '/assets/games/plinko.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'plinko',
    rtp: 99.0,
    description: 'Suelta bolas en la pirámide de clavijas y multiplica tu premio hasta 1000x.'
  },
  {
    id: 'keno',
    title: 'KENO',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 1514,
    image: '/assets/games/keno.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'mines',
    rtp: 99.0,
    description: 'Selecciona hasta 10 números y acierta los números extraídos.'
  },
  {
    id: 'crash',
    title: 'CRASH',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 868,
    image: '/assets/games/crash.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'crash',
    rtp: 99.0,
    description: 'Mira cómo despega el cohete con multiplicador creciente. ¡Retira antes de que explote!'
  },
  {
    id: 'chicken',
    title: 'CHICKEN',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 742,
    image: '/assets/games/chicken.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'mines',
    rtp: 98.8
  },
  {
    id: 'hilo',
    title: 'HILO',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 520,
    image: '/assets/games/hilo.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'dice',
    rtp: 99.0
  },
  {
    id: 'dragon-tower',
    title: 'DRAGON TOWER',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 689,
    image: '/assets/games/dragon-tower.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'mines',
    rtp: 98.5
  },
  {
    id: 'moles',
    title: 'MOLES',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 412,
    image: '/assets/games/moles.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'mines',
    rtp: 98.5
  },
  {
    id: 'flip',
    title: 'FLIP',
    provider: 'ASTED ORIGINALS',
    category: 'asted-originals',
    playersCount: 388,
    image: '/assets/games/flip.png',
    badge: 'ASTED ORIGINALS',
    hasPlayableModal: 'dice',
    rtp: 99.0
  },

  // Solo en Asted (Exclusives)
  {
    id: 'candy-swipe',
    title: 'Candy Swipe Matchwin',
    provider: 'Coreffect Interactive',
    category: 'only-on-asted',
    playersCount: 440,
    image: '/assets/games/candy-swipe.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.3
  },
  {
    id: 'private-jet',
    title: 'Private Jet',
    provider: 'Paperclip Gaming',
    category: 'only-on-asted',
    playersCount: 250,
    image: '/assets/games/private-jet.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.8
  },
  {
    id: 'buried-by-night',
    title: 'Buried by Night',
    provider: 'Hacksaw Gaming',
    category: 'only-on-asted',
    playersCount: 159,
    image: '/assets/games/buried-by-night.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.4
  },
  {
    id: 'waylanders-forge',
    title: 'Waylanders Forge',
    provider: 'Valkyrie',
    category: 'only-on-asted',
    playersCount: 371,
    image: '/assets/games/waylanders-forge.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.2
  },
  {
    id: 'gummy-express',
    title: 'Gummy Express',
    provider: 'Pragmatic Play',
    category: 'only-on-asted',
    playersCount: 133,
    image: '/assets/games/gummy-express.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.6
  },
  {
    id: 'lazy-vampire',
    title: 'Lazy Vampire',
    provider: 'Paperclip Gaming',
    category: 'only-on-asted',
    playersCount: 111,
    image: '/assets/games/lazy-vampire.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.0
  },
  {
    id: 'big-bass-rock-roll',
    title: 'Big Bass Rock and Roll',
    provider: 'Pragmatic Play',
    category: 'only-on-asted',
    playersCount: 219,
    image: '/assets/games/big-bass-rock-roll.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.7
  },
  {
    id: 'duck-hunters',
    title: 'Duck Hunters',
    provider: 'Nolimit City',
    category: 'only-on-asted',
    playersCount: 312,
    image: '/assets/games/duck-hunters.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.1
  },
  {
    id: 'odins-vault',
    title: "Odin's Vault",
    provider: 'Hacksaw Gaming',
    category: 'only-on-asted',
    playersCount: 285,
    image: '/assets/games/odins-vault.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.5
  },
  {
    id: 'deal-with-the-devil',
    title: 'Deal with the Devil',
    provider: 'Push Gaming',
    category: 'only-on-asted',
    playersCount: 394,
    image: '/assets/games/deal-with-the-devil.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.3
  },
  {
    id: 'yokai-fortune',
    title: 'Yokai Fortune',
    provider: 'Pragmatic Play',
    category: 'only-on-asted',
    playersCount: 240,
    image: '/assets/games/yokai-fortune.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.4
  },
  {
    id: 'fat-gamba',
    title: 'Fat Gamba',
    provider: 'Push Gaming',
    category: 'only-on-asted',
    playersCount: 178,
    image: '/assets/games/fat-gamba.png',
    badge: 'Solo en Asted',
    hasPlayableModal: 'slots',
    rtp: 96.2
  },

  // Slots
  {
    id: 'booming-buffalo',
    title: 'Booming Buffalo Hold & Win Extreme',
    provider: 'Booming Games',
    category: 'slots',
    playersCount: 2890,
    image: '/assets/games/booming-buffalo.png',
    badge: '10,000× EXTREME',
    hasPlayableModal: 'slots',
    rtp: 96.7,
    description: 'Búfalo dorado, Rueda Buffalo Bonus y cuadrícula Hold & Win con Grand Jackpot de 10,000× tu apuesta.'
  },
  {
    id: 'fury-of-anubis',
    title: 'Fury of Anubis',
    provider: 'Pragmatic Play',
    category: 'slots',
    playersCount: 1940,
    image: '/assets/games/anubis-doubles.png',
    badge: 'FARAÓN VIP',
    hasPlayableModal: 'slots',
    rtp: 96.5,
    description: 'Descubre los tesoros de la tumba sagrada de Anubis con multiplicadores colosales y orbes ancestrales.'
  },
  {
    id: 'gates-of-olympus-super',
    title: 'Gates of Olympus Super Scatter',
    provider: 'Pragmatic Play',
    category: 'slots',
    playersCount: 587,
    image: '/assets/games/gates-of-olympus-super.png',
    badge: 'DESTACADO',
    hasPlayableModal: 'slots',
    rtp: 96.5
  },
  {
    id: 'gates-of-olympus-1000',
    title: 'Gates of Olympus 1000',
    provider: 'Pragmatic Play',
    category: 'slots',
    playersCount: 414,
    image: '/assets/games/gates-of-olympus-1000.png',
    badge: 'POPULAR',
    hasPlayableModal: 'slots',
    rtp: 96.5,
    description: 'El todopoderoso Zeus bendice tus tiradas con orbes multiplicadores de hasta 1000x.'
  },
  {
    id: 'gates-of-olympus-2500',
    title: 'Gates of Olympus 2500',
    provider: 'Pragmatic Play',
    category: 'slots',
    playersCount: 295,
    image: '/assets/games/gates-of-olympus-2500.png',
    badge: 'HOT',
    hasPlayableModal: 'slots',
    rtp: 96.5
  },
  {
    id: 'sugar-rush-1000',
    title: 'Sugar Rush 1000',
    provider: 'Pragmatic Play',
    category: 'slots',
    playersCount: 403,
    image: '/assets/games/sugar-rush-1000.png',
    badge: 'POPULAR',
    hasPlayableModal: 'slots',
    rtp: 96.53
  },
  {
    id: 'sweet-bonanza-1000',
    title: 'Sweet Bonanza 1000',
    provider: 'Pragmatic Play',
    category: 'slots',
    playersCount: 358,
    image: '/assets/games/sweet-bonanza-1000.png',
    badge: 'POPULAR',
    hasPlayableModal: 'slots',
    rtp: 96.53
  },
  {
    id: 'midas-squares',
    title: 'Midas Squares',
    provider: 'Pragmatic Play',
    category: 'slots',
    playersCount: 320,
    image: '/assets/games/midas-squares.png',
    hasPlayableModal: 'slots',
    rtp: 96.4
  },
  {
    id: 'big-bass-halloween',
    title: 'Big Bass Halloween',
    provider: 'Pragmatic Play',
    category: 'slots',
    playersCount: 260,
    image: '/assets/games/big-bass-halloween.png',
    badge: 'TEMPORADA',
    hasPlayableModal: 'slots',
    rtp: 96.7
  },
  {
    id: 'le-clubber',
    title: 'Le Clubber',
    provider: 'Hacksaw Gaming',
    category: 'slots',
    playersCount: 169,
    image: '/assets/games/le-clubber.png',
    hasPlayableModal: 'slots',
    rtp: 96.3
  },

  // Casino en Vivo
  {
    id: 'blackjack-live-pragmatic',
    title: 'Blackjack Live',
    provider: 'Pragmatic Play',
    category: 'live-casino',
    playersCount: 723,
    image: '/assets/games/blackjack-live-pragmatic.png',
    badge: 'LIVE',
    hasPlayableModal: 'roulette',
    rtp: 99.5
  },
  {
    id: 'ruleta-en-espanol',
    title: 'Ruleta en Español Live',
    provider: 'Evolution',
    category: 'live-casino',
    playersCount: 34,
    image: '/assets/games/ruleta-en-espanol.png',
    badge: 'ES',
    hasPlayableModal: 'roulette',
    rtp: 97.3,
    description: 'Mesa de ruleta en vivo transmitida en alta definición con crupieres hispanohablantes.'
  },
  {
    id: 'baccarat-live',
    title: 'Baccarat Live',
    provider: 'Pragmatic Play',
    category: 'live-casino',
    playersCount: 394,
    image: '/assets/games/baccarat-live.png',
    badge: 'LIVE',
    hasPlayableModal: 'roulette',
    rtp: 98.9
  },
  {
    id: 'blackjack-live-evolution',
    title: 'Blackjack Live VIP',
    provider: 'Evolution',
    category: 'live-casino',
    playersCount: 1122,
    image: '/assets/games/blackjack-live-evolution.png',
    badge: 'VIP',
    hasPlayableModal: 'roulette',
    rtp: 99.5
  },
  {
    id: 'spanish-roulette',
    title: 'Spanish Roulette Live',
    provider: 'Pragmatic Play',
    category: 'live-casino',
    playersCount: 63,
    image: '/assets/games/spanish-roulette.png',
    badge: 'ES',
    hasPlayableModal: 'roulette',
    rtp: 97.3
  },
  {
    id: 'futbol-studio',
    title: 'Fútbol Studio Live',
    provider: 'Evolution',
    category: 'live-casino',
    playersCount: 7,
    image: '/assets/games/futbol-studio.png',
    badge: 'LIVE',
    hasPlayableModal: 'dice',
    rtp: 96.2
  },
  {
    id: 'mega-bola',
    title: 'Mega Bola Live',
    provider: 'Evolution',
    category: 'live-casino',
    playersCount: 3,
    image: '/assets/games/mega-bola.png',
    badge: 'LIVE',
    hasPlayableModal: 'plinko',
    rtp: 95.5
  },

  // Lanzamientos (New releases)
  {
    id: 'anubis-doubles',
    title: 'Anubis Doubles',
    provider: 'Uppercut Gaming',
    category: 'new-releases',
    playersCount: 77,
    image: '/assets/games/anubis-doubles.png',
    badge: 'NUEVO',
    hasPlayableModal: 'slots',
    rtp: 96.4
  },
  {
    id: 'dr-rip',
    title: 'Dr. Rip',
    provider: 'Titan Gaming',
    category: 'new-releases',
    playersCount: 38,
    image: '/assets/games/dr-rip.png',
    badge: 'NUEVO',
    hasPlayableModal: 'slots',
    rtp: 96.1
  },
  {
    id: 'battle-beetle',
    title: 'Battle Beetle',
    provider: 'Pocket Play',
    category: 'new-releases',
    playersCount: 72,
    image: '/assets/games/battle-beetle.png',
    badge: 'NUEVO',
    hasPlayableModal: 'slots',
    rtp: 96.3
  },
  {
    id: 'gator-hunters',
    title: 'Gator Hunters Double Trouble',
    provider: 'Nolimit City',
    category: 'new-releases',
    playersCount: 49,
    image: '/assets/games/gator-hunters.png',
    badge: 'NUEVO',
    hasPlayableModal: 'slots',
    rtp: 96.2
  },
  {
    id: 'angry-angel',
    title: 'Angry Angel',
    provider: 'Hacksaw Gaming',
    category: 'new-releases',
    playersCount: 88,
    image: '/assets/games/angry-angel.png',
    badge: 'NUEVO',
    hasPlayableModal: 'slots',
    rtp: 96.5
  },
  {
    id: 'undead-samurai',
    title: 'Undead Samurai',
    provider: 'Hacksaw Gaming',
    category: 'new-releases',
    playersCount: 74,
    image: '/assets/games/undead-samurai.png',
    badge: 'NUEVO',
    hasPlayableModal: 'slots',
    rtp: 96.3
  },
  {
    id: 'egg-drop',
    title: 'Egg Drop',
    provider: 'Pragmatic Play',
    category: 'new-releases',
    playersCount: 52,
    image: '/assets/games/egg-drop.png',
    badge: 'NUEVO',
    hasPlayableModal: 'slots',
    rtp: 96.2
  },
  {
    id: 'deep-sea-legacy',
    title: 'Deep Sea Legacy',
    provider: 'Pragmatic Play',
    category: 'new-releases',
    playersCount: 65,
    image: '/assets/games/deep-sea-legacy.png',
    badge: 'NUEVO',
    hasPlayableModal: 'slots',
    rtp: 96.4
  },
  {
    id: 'crazy-ex-girlfriend',
    title: 'Crazy Ex Girlfriend',
    provider: 'Nolimit City',
    category: 'new-releases',
    playersCount: 41,
    image: '/assets/games/crazy-ex-girlfriend.png',
    badge: 'NUEVO',
    hasPlayableModal: 'slots',
    rtp: 96.1
  }
];

export const MOCK_LIVE_BETS: LiveBet[] = [
  { id: 'b1', game: 'Mines', user: 'LuckyStriker', time: '14:02:11', betAmount: 25.0, currency: 'USD', multiplier: 3.42, payout: 85.5, isWin: true },
  { id: 'b2', game: 'Plinko', user: 'ViperKing', time: '14:02:14', betAmount: 10.0, currency: 'USD', multiplier: 29.0, payout: 290.0, isWin: true },
  { id: 'b3', game: 'Crash', user: 'CryptoWolf', time: '14:02:18', betAmount: 50.0, currency: 'USD', multiplier: 1.84, payout: 92.0, isWin: true },
  { id: 'b4', game: 'Gates of Olympus 1000', user: 'ZeusWinner', time: '14:02:22', betAmount: 4.0, currency: 'USD', multiplier: 125.0, payout: 500.0, isWin: true },
  { id: 'b5', game: 'Dice', user: 'RollMaster', time: '14:02:25', betAmount: 100.0, currency: 'USD', multiplier: 1.98, payout: 198.0, isWin: true },
  { id: 'b6', game: 'Blackjack Live', user: 'ElPatron99', time: '14:02:28', betAmount: 75.0, currency: 'USD', multiplier: 2.0, payout: 150.0, isWin: true },
  { id: 'b7', game: 'Sugar Rush 1000', user: 'SweetTooth', time: '14:02:30', betAmount: 2.5, currency: 'USD', multiplier: 0.0, payout: 0.0, isWin: false },
  { id: 'b8', game: 'Limbo', user: 'MegaShot', time: '14:02:35', betAmount: 15.0, currency: 'USD', multiplier: 12.5, payout: 187.5, isWin: true },
  { id: 'b9', game: 'Ruleta en Español', user: 'MadridKing', time: '14:02:41', betAmount: 30.0, currency: 'USD', multiplier: 36.0, payout: 1080.0, isWin: true },
  { id: 'b10', game: 'Crash', user: 'ToTheMoon', time: '14:02:44', betAmount: 200.0, currency: 'USD', multiplier: 0.0, payout: 0.0, isWin: false },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'c1', user: 'Elena_99', vipTier: 'gold', message: '¡Acabo de sacar x29 en Plinko! 🚀🎉', time: '14:00' },
  { id: 'c2', user: 'KikoGamer', vipTier: 'silver', message: 'Mines hoy está pagando durísimo con 5 minas', time: '14:01' },
  { id: 'c3', user: 'AstedBot', isSystem: true, message: '🎉 ¡Enhorabuena a MadridKing por ganar $1,080.00 en Ruleta en Español!', time: '14:02' },
  { id: 'c4', user: 'ViperKing', vipTier: 'platinum', message: 'Grande MadridKing, buena jugada al pleno!', time: '14:02' },
  { id: 'c5', user: 'NicoBtc', vipTier: 'bronze', message: '¿Alguien jugando Gates 1000? ¿Cómo va el bono?', time: '14:03' },
  { id: 'c6', user: 'CryptoWolf', vipTier: 'diamond', message: 'Crash se fue a 45x hace un momento 🔥', time: '14:03' },
];
