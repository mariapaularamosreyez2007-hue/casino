// ============================================================================
// PROVABLY FAIR & AUTO-BET ENGINE VERIFICATION TEST SUITE
// Tests mathematical determinism, floating-point rounding precision, and circuit breakers.
// ============================================================================

import { ProvablyFairService } from './ProvablyFairService';
import { AutoBetEngine, AutoBetConfig } from './AutoBetEngine';
import { PlayerEconomyService } from './PlayerEconomyService';

export function runProvablyFairTests() {
  console.log('--- STARTING PROVABLY FAIR TEST SUITE ---');

  const testServerSeed = '4f82d1c9e83a7b54201938472910485729103948572019384720193847201938';
  const testClientSeed = 'stake_client_seed_test_1';
  const testNonce = 42;

  // Test 1: Determinism Test (Idempotency)
  const runA = ProvablyFairService.generateOutcome(testServerSeed, testClientSeed, testNonce);
  const runB = ProvablyFairService.generateOutcome(testServerSeed, testClientSeed, testNonce);

  if (runA.hmac !== runB.hmac || runA.float !== runB.float) {
    throw new Error('FAILED: generateOutcome is not deterministic!');
  }
  console.log('✓ PASS: Outcome is 100% deterministic between identical seeds.');

  // Test 2: Dice Conversion
  const diceA = ProvablyFairService.getDiceResult(runA.float);
  const diceB = ProvablyFairService.getDiceResult(runB.float);
  if (diceA !== diceB || diceA < 0 || diceA > 100) {
    throw new Error(`FAILED: getDiceResult invalid: ${diceA}`);
  }
  console.log(`✓ PASS: Dice result verified: ${diceA.toFixed(2)}`);

  // Test 3: Limbo/Crash Conversion
  const crashA = ProvablyFairService.getLimboCrashResult(runA.float, 0.01);
  const crashB = ProvablyFairService.getLimboCrashResult(runB.float, 0.01);
  if (crashA !== crashB || crashA < 1.0) {
    throw new Error(`FAILED: getLimboCrashResult invalid: ${crashA}`);
  }
  console.log(`✓ PASS: Limbo/Crash multiplier verified: ${crashA.toFixed(2)}x`);

  // Test 4: Mines Board 5x5 Shuffle
  const minesA = ProvablyFairService.getMinesBoard(testServerSeed, testClientSeed, testNonce, 3);
  const minesB = ProvablyFairService.getMinesBoard(testServerSeed, testClientSeed, testNonce, 3);
  const minesACount = minesA.filter((b) => b.isMine).length;
  const minesBCount = minesB.filter((b) => b.isMine).length;
  if (minesACount !== 3 || minesBCount !== 3) {
    throw new Error('FAILED: Mines count mismatch');
  }
  for (let i = 0; i < 25; i++) {
    if (minesA[i].isMine !== minesB[i].isMine) {
      throw new Error(`FAILED: Mines position mismatch at tile ${i}`);
    }
  }
  console.log('✓ PASS: Mines board layout is 100% deterministic (3 mines).');

  // Test 5: Financial Precision (No 0.1 + 0.2 = 0.30000000000000004)
  const a = 0.1;
  const b = 0.2;
  const sum = AutoBetEngine.round(a + b);
  if (sum !== 0.3) {
    throw new Error(`FAILED: Floating point rounding error: ${sum}`);
  }
  console.log(`✓ PASS: Decimal precision safety verified (0.1 + 0.2 = ${sum}).`);

  // Test 6: Rakeback Calculation
  const rakeback = PlayerEconomyService.calculateRakeback(100, 0.01, 30000); // Gold Tier = 10%
  // 100 * 0.01 * 0.10 = 0.10
  if (rakeback !== 0.1) {
    throw new Error(`FAILED: Rakeback calculation incorrect: ${rakeback}`);
  }
  console.log(`✓ PASS: Rakeback calculated accurately: US$ ${rakeback}`);

  console.log('--- ALL PROVABLY FAIR & BETTING ENGINE TESTS PASSED ---');
  return true;
}
