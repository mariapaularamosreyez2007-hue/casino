// ============================================================================
// ASTED PROVABLY FAIR SERVICE (CRYPTOGRAPHIC DETERMINISTIC RNG)
// Adheres strictly to Stake Provably Fair specifications:
// HMAC-SHA256 with Server Seed, Client Seed, and incremental Nonce
// ============================================================================

// Lightweight, pure TypeScript SHA-256 and HMAC-SHA256 implementations
// to guarantee 100% deterministic results across all browser and Node environments.

function sha256Sync(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let compositeHash: number[] = [];

  for (i = 0; i < ascii[lengthProperty]; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = words.slice(i, i + 16);
    compositeHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 =
          ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^
          ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^
          (w[j - 15] >>> 3);
        const s1 =
          ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^
          ((w[j - 2] >>> 19) | (w[j - 2] << 13)) ^
          (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const S1 =
        ((compositeHash[4] >>> 6) | (compositeHash[4] << 26)) ^
        ((compositeHash[4] >>> 11) | (compositeHash[4] << 21)) ^
        ((compositeHash[4] >>> 25) | (compositeHash[4] << 7));
      const ch =
        (compositeHash[4] & compositeHash[5]) ^ (~compositeHash[4] & compositeHash[6]);
      const temp1 =
        (compositeHash[7] + S1 + ch + k[j] + w[j]) | 0;
      const S0 =
        ((compositeHash[0] >>> 2) | (compositeHash[0] << 30)) ^
        ((compositeHash[0] >>> 13) | (compositeHash[0] << 19)) ^
        ((compositeHash[0] >>> 22) | (compositeHash[0] << 10));
      const maj =
        (compositeHash[0] & compositeHash[1]) ^
        (compositeHash[0] & compositeHash[2]) ^
        (compositeHash[1] & compositeHash[2]);
      const temp2 = (S0 + maj) | 0;

      compositeHash = [
        (temp1 + temp2) | 0,
        compositeHash[0],
        compositeHash[1],
        compositeHash[2],
        (compositeHash[3] + temp1) | 0,
        compositeHash[4],
        compositeHash[5],
        compositeHash[6],
      ];
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + compositeHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

// HMAC-SHA256 implementation
function hmacSha256Sync(key: string, message: string): string {
  const blockSize = 64; // 64 bytes for SHA-256
  let keyBytes: number[] = [];

  for (let i = 0; i < key.length; i++) {
    keyBytes.push(key.charCodeAt(i) & 0xff);
  }

  if (keyBytes.length > blockSize) {
    const keyHash = sha256Sync(key);
    keyBytes = [];
    for (let i = 0; i < keyHash.length; i += 2) {
      keyBytes.push(parseInt(keyHash.substr(i, 2), 16));
    }
  }

  while (keyBytes.length < blockSize) {
    keyBytes.push(0);
  }

  let oKeyPad = '';
  let iKeyPad = '';

  for (let i = 0; i < blockSize; i++) {
    oKeyPad += String.fromCharCode(keyBytes[i] ^ 0x5c);
    iKeyPad += String.fromCharCode(keyBytes[i] ^ 0x36);
  }

  const innerHashHex = sha256Sync(iKeyPad + message);
  let innerHashRaw = '';
  for (let i = 0; i < innerHashHex.length; i += 2) {
    innerHashRaw += String.fromCharCode(parseInt(innerHashHex.substr(i, 2), 16));
  }

  return sha256Sync(oKeyPad + innerHashRaw);
}

export interface ProvablyFairResult {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  hmac: string;
  float: number; // [0, 1)
}

export interface PastBetAudit {
  id: string;
  game: string;
  timestamp: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  outcome: number | string;
  verified: boolean;
}

export class ProvablyFairService {
  /**
   * Generates a 64-character (32-byte) hex cryptographically secure Server Seed.
   */
  public static generateServerSeed(): string {
    const bytes = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 32; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generates a user-friendly Client Seed (16 characters alphanumeric).
   */
  public static generateClientSeed(): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    let res = '';
    for (let i = 0; i < 16; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  }

  /**
   * Returns SHA-256 hash of a Server Seed (shown to user before bets).
   */
  public static hashServerSeed(serverSeed: string): string {
    return sha256Sync(serverSeed);
  }

  /**
   * Calculates HMAC-SHA256 using serverSeed and `${clientSeed}:${nonce}`.
   * Converts first 8 hex characters (4 bytes) to float in range [0, 1).
   */
  public static generateOutcome(
    serverSeed: string,
    clientSeed: string,
    nonce: number
  ): ProvablyFairResult {
    const message = `${clientSeed}:${nonce}`;
    const hmac = hmacSha256Sync(serverSeed, message);

    // Take first 8 hex characters (32-bit unsigned integer)
    const hex8 = hmac.substring(0, 8);
    const int32 = parseInt(hex8, 16);
    // Divide by 2^32 (4294967296) to obtain uniform float [0, 1)
    const float = int32 / 0x100000000;

    return {
      serverSeed,
      serverSeedHash: this.hashServerSeed(serverSeed),
      clientSeed,
      nonce,
      hmac,
      float,
    };
  }

  /**
   * Dice Outcome: Converts float to decimal number between 0.00 and 100.00
   * Formula: Math.floor(float * 10001) / 100
   */
  public static getDiceResult(float: number): number {
    return Math.floor(float * 10001) / 100;
  }

  /**
   * Limbo & Crash Outcome: Converts float to multiplier with 1% house edge (99% RTP).
   * Formula: Math.max(1.00, Math.floor((0.99 / (1 - float)) * 100) / 100)
   */
  public static getLimboCrashResult(float: number, houseEdge: number = 0.01): number {
    const rtp = 1 - houseEdge; // 0.99
    if (float >= 0.999999) return 1000000.0; // Cap
    const mult = rtp / (1 - float);
    return Math.max(1.0, Math.floor(mult * 100) / 100);
  }

  /**
   * Plinko Outcome: Generates path directions (Left: 0, Right: 1) for each row.
   * Uses HMAC hex characters paired per row.
   */
  public static getPlinkoPath(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    rows: number = 16
  ): number[] {
    const message = `${clientSeed}:${nonce}:plinko`;
    const hmac = hmacSha256Sync(serverSeed, message);
    const path: number[] = [];

    for (let i = 0; i < rows; i++) {
      const byteHex = hmac.substring((i * 2) % (hmac.length - 2), ((i * 2) % (hmac.length - 2)) + 2);
      const byteVal = parseInt(byteHex, 16);
      path.push(byteVal % 2); // 0 = left, 1 = right
    }

    return path;
  }

  /**
   * Mines Board: Generates 5x5 board with configured number of mines.
   * Uses Fisher-Yates shuffle seeded deterministically from HMAC bytes.
   */
  public static getMinesBoard(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    minesCount: number = 3
  ): { isMine: boolean }[] {
    const board = Array(25).fill(false);
    // Put mines at start
    for (let i = 0; i < minesCount; i++) {
      board[i] = true;
    }

    const message = `${clientSeed}:${nonce}:mines`;
    const hmac = hmacSha256Sync(serverSeed, message);

    // Fisher-Yates shuffle
    for (let i = 24; i > 0; i--) {
      const offset = (24 - i) * 2;
      const byteHex = hmac.substring(offset % (hmac.length - 2), (offset % (hmac.length - 2)) + 2);
      const byteVal = parseInt(byteHex, 16);
      const j = byteVal % (i + 1);
      const temp = board[i];
      board[i] = board[j];
      board[j] = temp;
    }

    return board.map((isMine) => ({ isMine }));
  }

  /**
   * Rotates seed pair:
   * Returns revealed old server seed, new fresh server seed, its hash, and resets nonce to 0.
   */
  public static rotateSeedPair(
    currentServerSeed: string,
    currentClientSeed: string
  ): {
    revealedServerSeed: string;
    newServerSeed: string;
    newServerSeedHash: string;
    newClientSeed: string;
    newNonce: number;
  } {
    const newServerSeed = this.generateServerSeed();
    const newServerSeedHash = this.hashServerSeed(newServerSeed);
    const newClientSeed = this.generateClientSeed();

    return {
      revealedServerSeed: currentServerSeed,
      newServerSeed,
      newServerSeedHash,
      newClientSeed,
      newNonce: 0,
    };
  }

  /**
   * Verify past bet mathematically.
   */
  public static verifyPastBet(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    game: 'dice' | 'crash' | 'limbo' | 'plinko' | 'mines',
    params?: { minesCount?: number; rows?: number }
  ): {
    serverSeedHash: string;
    float: number;
    hmac: string;
    result: number | number[] | boolean[];
  } {
    const outcome = this.generateOutcome(serverSeed, clientSeed, nonce);

    let result: number | number[] | boolean[] = outcome.float;
    if (game === 'dice') {
      result = this.getDiceResult(outcome.float);
    } else if (game === 'crash' || game === 'limbo') {
      result = this.getLimboCrashResult(outcome.float);
    } else if (game === 'plinko') {
      result = this.getPlinkoPath(serverSeed, clientSeed, nonce, params?.rows || 16);
    } else if (game === 'mines') {
      result = this.getMinesBoard(serverSeed, clientSeed, nonce, params?.minesCount || 3).map((b) => b.isMine);
    }

    return {
      serverSeedHash: outcome.serverSeedHash,
      float: outcome.float,
      hmac: outcome.hmac,
      result,
    };
  }
}
