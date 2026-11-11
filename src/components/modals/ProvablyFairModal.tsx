import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Calculator,
  Key,
  RotateCcw,
  Sparkles,
  Bomb,
  Dices,
  Flame,
} from 'lucide-react';
import { ProvablyFairService } from '../../services/ProvablyFairService';
import { showToast } from '../../utils/toast';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle?: string;
  gameType?: 'dice' | 'crash' | 'limbo' | 'plinko' | 'mines';
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose,
  gameTitle = 'Juego Original',
  gameType = 'crash',
}) => {
  const [activeTab, setActiveTab] = useState<'seeds' | 'verifier'>('seeds');

  // Active seeds
  const [serverSeed, setServerSeed] = useState<string>(() =>
    ProvablyFairService.generateServerSeed()
  );
  const [serverSeedHash, setServerSeedHash] = useState<string>(() =>
    ProvablyFairService.hashServerSeed(serverSeed)
  );
  const [clientSeed, setClientSeed] = useState<string>('asted_vip_7f29a');
  const [nonce, setNonce] = useState<number>(42);
  const [revealedOldSeed, setRevealedOldSeed] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Verifier State
  const [vGame, setVGame] = useState<'dice' | 'crash' | 'limbo' | 'plinko' | 'mines'>(gameType);
  const [vServerSeed, setVServerSeed] = useState<string>(
    '8f4a13b9c7e2d5f8103948572019384729104857291039485720193847201938'
  );
  const [vClientSeed, setVClientSeed] = useState<string>('asted_vip_7f29a');
  const [vNonce, setVNonce] = useState<number>(1);
  const [vMinesCount, setVMinesCount] = useState<number>(3);
  const [vPlinkoRows, setVPlinkoRows] = useState<number>(16);

  const [verificationResult, setVerificationResult] = useState<{
    serverSeedHash: string;
    float: number;
    hmac: string;
    result: number | number[] | boolean[];
  } | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleRotateSeeds = () => {
    const rotated = ProvablyFairService.rotateSeedPair(serverSeed, clientSeed);
    setRevealedOldSeed(rotated.revealedServerSeed);
    setServerSeed(rotated.newServerSeed);
    setServerSeedHash(rotated.newServerSeedHash);
    setClientSeed(rotated.newClientSeed);
    setNonce(0);
    showToast('¡Par de semillas rotado con éxito! Semilla anterior revelada para auditoría.', 'success');
  };

  const handleVerify = () => {
    try {
      const res = ProvablyFairService.verifyPastBet(
        vServerSeed,
        vClientSeed,
        vNonce,
        vGame,
        { minesCount: vMinesCount, rows: vPlinkoRows }
      );
      setVerificationResult(res);
      showToast('Cálculo criptográfico verificado con éxito.', 'success');
    } catch (e) {
      showToast('Error al verificar semillas. Revisa los caracteres.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#1a2c38] border border-[#213743] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#213743] flex items-center justify-between bg-[#0f212e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00e701]/10 border border-[#00e701]/30 flex items-center justify-center text-[#00e701]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-2">
                PROVABLY FAIR · EQUIDAD COMPROBABLE
              </h2>
              <p className="text-[11px] text-[#b1bad3]">Transparencia Criptográfica HMAC-SHA256 · {gameTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#b1bad3] hover:text-white p-1 rounded-lg hover:bg-[#213743] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#213743] bg-[#14232e] px-4 pt-2">
          <button
            onClick={() => setActiveTab('seeds')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'seeds'
                ? 'border-[#00e701] text-white'
                : 'border-transparent text-[#b1bad3] hover:text-white'
            }`}
          >
            <Key size={13} /> Par de Semillas Activo
          </button>
          <button
            onClick={() => setActiveTab('verifier')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'verifier'
                ? 'border-[#00e701] text-white'
                : 'border-transparent text-[#b1bad3] hover:text-white'
            }`}
          >
            <Calculator size={13} /> Verificador de Jugadas
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {activeTab === 'seeds' ? (
            <>
              {/* Formula badge */}
              <div className="bg-[#0f212e] p-3 rounded-xl border border-[#213743] text-xs space-y-1">
                <span className="text-[#557086] text-[10px] uppercase font-bold tracking-wider block">
                  Estándar Criptográfico Stake:
                </span>
                <code className="text-[#00e701] font-mono text-[11px] block">
                  HMAC_SHA256(key = ServerSeed, message = `${'{ClientSeed}'}:${'{Nonce}'}`)
                </code>
              </div>

              {/* Active Server Seed Hash */}
              <div>
                <label className="text-xs text-[#b1bad3] font-semibold block mb-1">
                  Hash de la Semilla del Servidor (SHA-256 Bloqueado)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={serverSeedHash}
                    className="w-full bg-[#0f212e] border border-[#213743] rounded-lg py-2 pl-3 pr-10 text-xs font-mono text-white/90 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(serverSeedHash, 'serverHash')}
                    className="absolute right-2 text-[#b1bad3] hover:text-white p-1"
                    title="Copiar"
                  >
                    {copiedField === 'serverHash' ? <Check size={14} className="text-[#00e701]" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-[#557086] mt-1">
                  Este hash fue generado antes de tus apuestas. Al rotar semillas, podrás auditar que la semilla revelada coincide con este hash.
                </p>
              </div>

              {/* Client Seed */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-[#b1bad3] font-semibold">Tu Semilla de Cliente (Editable)</label>
                  <button
                    onClick={() => setClientSeed(ProvablyFairService.generateClientSeed())}
                    className="text-[11px] text-[#00e701] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw size={11} /> Aleatoria
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    className="w-full bg-[#0f212e] border border-[#2f4553] focus:border-[#00e701] rounded-lg py-2 pl-3 pr-10 text-xs font-mono text-white focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(clientSeed, 'client')}
                    className="absolute right-2 text-[#b1bad3] hover:text-white p-1"
                    title="Copiar"
                  >
                    {copiedField === 'client' ? <Check size={14} className="text-[#00e701]" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Nonce */}
              <div>
                <label className="text-xs text-[#b1bad3] font-semibold block mb-1">
                  Nonce (Contador de Jugadas de este Par)
                </label>
                <div className="bg-[#0f212e] border border-[#213743] rounded-lg py-2 px-3 text-xs font-mono text-white/80 tabular-nums">
                  {nonce}
                </div>
              </div>

              {/* Revealed Old Seed Banner (if rotated) */}
              {revealedOldSeed && (
                <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl space-y-1">
                  <span className="text-amber-400 font-bold text-xs block">
                    Semilla Anterior Revelada (Lista para Auditar):
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-white/90 break-all select-all flex-1">
                      {revealedOldSeed}
                    </span>
                    <button
                      onClick={() => handleCopy(revealedOldSeed, 'oldSeed')}
                      className="p-1 text-[#b1bad3] hover:text-white"
                    >
                      {copiedField === 'oldSeed' ? <Check size={14} className="text-[#00e701]" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Rotate Seeds Button */}
              <button
                type="button"
                onClick={handleRotateSeeds}
                className="w-full py-2.5 bg-[#213743] hover:bg-[#2f4553] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-[#2f4553] flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} className="text-[#00e701]" />
                <span>Rotar Semilla del Servidor (Revelar Anterior)</span>
              </button>
            </>
          ) : (
            <>
              {/* Verifier tab */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#b1bad3] font-semibold block mb-1">Selecciona el Juego a Verificar</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'crash', label: 'Crash / Limbo' },
                      { id: 'dice', label: 'Dice' },
                      { id: 'mines', label: 'Mines' },
                      { id: 'plinko', label: 'Plinko' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setVGame(g.id as any)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                          vGame === g.id
                            ? 'bg-[#00e701]/15 border-[#00e701] text-white'
                            : 'bg-[#0f212e] border-[#213743] text-[#b1bad3]'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#b1bad3] font-semibold block mb-1">Semilla del Servidor Revelada</label>
                  <input
                    type="text"
                    value={vServerSeed}
                    onChange={(e) => setVServerSeed(e.target.value)}
                    className="w-full bg-[#0f212e] border border-[#213743] rounded-lg py-1.5 px-3 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#b1bad3] font-semibold block mb-1">Semilla del Cliente</label>
                    <input
                      type="text"
                      value={vClientSeed}
                      onChange={(e) => setVClientSeed(e.target.value)}
                      className="w-full bg-[#0f212e] border border-[#213743] rounded-lg py-1.5 px-3 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#b1bad3] font-semibold block mb-1">Nonce (Ronda #)</label>
                    <input
                      type="number"
                      value={vNonce}
                      onChange={(e) => setVNonce(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0f212e] border border-[#213743] rounded-lg py-1.5 px-3 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerify}
                  className="w-full py-2.5 bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#00e701]/20"
                >
                  Ejecutar Verificación Matemática
                </button>

                {verificationResult && (
                  <div className="bg-[#0f212e] p-3.5 rounded-xl border border-[#00e701]/40 text-xs space-y-2 animate-in fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-[#213743]">
                      <span className="text-[#b1bad3]">Resultado Verificado:</span>
                      <span className="text-[#00e701] font-mono font-black text-base">
                        {vGame === 'crash' || vGame === 'limbo'
                          ? `${verificationResult.result}×`
                          : vGame === 'dice'
                          ? `${verificationResult.result}`
                          : vGame === 'mines'
                          ? 'Mapeo 5x5 Revelado'
                          : `${(verificationResult.result as number[]).length} rebotes`}
                      </span>
                    </div>

                    {vGame === 'mines' && Array.isArray(verificationResult.result) && (
                      <div className="py-2">
                        <span className="text-[11px] text-[#557086] block mb-1.5">Posición de Minas (Rojo = Mina):</span>
                        <div className="grid grid-cols-5 gap-1 max-w-[160px] mx-auto">
                          {(verificationResult.result as boolean[]).map((isMine, idx) => (
                            <div
                              key={idx}
                              className={`h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold ${
                                isMine ? 'bg-[#ed4245] text-white' : 'bg-[#213743] text-[#00e701]'
                              }`}
                            >
                              {isMine ? '💣' : '💎'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#557086]">Flotante derivado [0, 1):</span>
                      <span className="font-mono text-white">{verificationResult.float.toFixed(8)}</span>
                    </div>
                    <div className="text-[11px]">
                      <span className="text-[#557086] block mb-0.5">Firma HMAC-SHA256:</span>
                      <span className="font-mono text-[#b1bad3] text-[10px] break-all block">
                        {verificationResult.hmac}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#213743] bg-[#0f212e] flex items-center justify-between text-xs text-[#557086]">
          <span>Certificado RNG SHA-256 · 99% RTP</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#213743] hover:bg-[#2f4553] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
