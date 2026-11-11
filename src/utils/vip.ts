export interface VipTierInfo {
  tierName: string;
  nextTierName: string;
  progressPercent: number;
  currentTierMin: number;
  nextTierMin: number;
  wageredTotal: number;
  wageredInTier: number;
  tierTotalNeeded: number;
  remainingToNextTier: number;
  badgeColor: string;
  glowColor: string;
  rakebackRate: number; // percentage
  benefits: string[];
}

const TIERS = [
  { name: 'Sin Rango', min: 0, color: '#557086', glow: 'rgba(85, 112, 134, 0.4)', rakeback: 0, benefits: ['Acceso a promociones generales'] },
  { name: 'Bronze', min: 10000, color: '#cd7f32', glow: 'rgba(205, 127, 50, 0.4)', rakeback: 5, benefits: ['5% Rakeback mensual', 'Bono de nivel de $15', 'Eventos VIP de telegram'] },
  { name: 'Silver', min: 50000, color: '#c0c0c0', glow: 'rgba(192, 192, 192, 0.4)', rakeback: 7.5, benefits: ['7.5% Rakeback semanal', 'Bono de nivel de $50', 'Bono extra mensual'] },
  { name: 'Gold', min: 100000, color: '#f6c443', glow: 'rgba(246, 196, 67, 0.4)', rakeback: 10, benefits: ['10% Rakeback diario', 'Bono de nivel de $110', 'Aumento de límites'] },
  { name: 'Platinum I', min: 250000, color: '#00e701', glow: 'rgba(0, 231, 1, 0.4)', rakeback: 12.5, benefits: ['12.5% Rakeback instantáneo', 'Bono de nivel de $220', 'Recargas de 14 días'] },
  { name: 'Platinum II', min: 500000, color: '#1475e1', glow: 'rgba(20, 117, 225, 0.4)', rakeback: 15, benefits: ['15% Rakeback', 'Bono de nivel de $440', 'Recargas de 28 días'] },
  { name: 'Platinum III', min: 1000000, color: '#9d4edd', glow: 'rgba(157, 78, 221, 0.4)', rakeback: 17.5, benefits: ['Anfitrión VIP personal en Telegram/WhatsApp', 'Bonos personalizados'] },
  { name: 'Diamond', min: 25000000, color: '#00e7ff', glow: 'rgba(0, 231, 255, 0.5)', rakeback: 20, benefits: ['Acceso a la mesa de fundadores', 'Retiros prioritarios sin límite', 'Regalos físicos de lujo'] },
];

export function getVipProgress(totalWagered: number): VipTierInfo {
  let tierIndex = 0;

  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalWagered >= TIERS[i].min) {
      tierIndex = i;
      break;
    }
  }

  const currentTier = TIERS[tierIndex];
  const nextTier = TIERS[Math.min(tierIndex + 1, TIERS.length - 1)];

  if (tierIndex === TIERS.length - 1) {
    // Top tier Diamond maxed
    return {
      tierName: currentTier.name,
      nextTierName: 'Máximo',
      progressPercent: 100,
      currentTierMin: currentTier.min,
      nextTierMin: currentTier.min,
      wageredTotal: totalWagered,
      wageredInTier: totalWagered - currentTier.min,
      tierTotalNeeded: 0,
      remainingToNextTier: 0,
      badgeColor: currentTier.color,
      glowColor: currentTier.glow,
      rakebackRate: currentTier.rakeback,
      benefits: currentTier.benefits,
    };
  }

  const range = nextTier.min - currentTier.min;
  const inRange = totalWagered - currentTier.min;
  const percent = Math.min(100, Math.max(0, parseFloat(((inRange / range) * 100).toFixed(1))));

  return {
    tierName: currentTier.name,
    nextTierName: nextTier.name,
    progressPercent: percent,
    currentTierMin: currentTier.min,
    nextTierMin: nextTier.min,
    wageredTotal: totalWagered,
    wageredInTier: inRange,
    tierTotalNeeded: range,
    remainingToNextTier: Math.max(0, nextTier.min - totalWagered),
    badgeColor: currentTier.color,
    glowColor: currentTier.glow,
    rakebackRate: currentTier.rakeback,
    benefits: currentTier.benefits,
  };
}
