import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseUsdc } from './money.ts';
import {
  clinicCancelEntitlement,
  distribute,
  entitlement,
  policyRows,
  DAY_SECONDS,
  type Policy,
} from './policy.ts';

const PROCEDURE = Date.parse('2026-10-28T09:00:00+03:00') / 1000;

const policy: Policy = {
  procedureDate: PROCEDURE,
  tiers: [
    { minDaysBefore: 14, refundBps: 10_000 },
    { minDaysBefore: 7, refundBps: 5_000 },
    { minDaysBefore: 0, refundBps: 0 },
  ],
  agencyBps: 1_000,
};

const parties = { patient: 'PATIENT', clinic: 'CLINIC', agency: 'AGENCY' };
const at = (secondsBeforeProcedure: number) => new Date((PROCEDURE - secondsBeforeProcedure) * 1000);

// ---------------------------------------------------------------- kademeler

test('kademe sınırı dahildir: tam 14 gün önce hâlâ tam iade', () => {
  assert.equal(entitlement(policy, at(14 * DAY_SECONDS)).patientBps, 10_000);
});

test('sınırın bir saniye sonrası alt kademeye düşer', () => {
  assert.equal(entitlement(policy, at(14 * DAY_SECONDS - 1)).patientBps, 5_000);
});

test('tam 7 gün önce yarı iade, bir saniye sonrası sıfır', () => {
  assert.equal(entitlement(policy, at(7 * DAY_SECONDS)).patientBps, 5_000);
  assert.equal(entitlement(policy, at(7 * DAY_SECONDS - 1)).patientBps, 0);
});

test('işlem tarihi geçmişse en dar kademe uygulanır', () => {
  assert.equal(entitlement(policy, at(-30 * DAY_SECONDS)).patientBps, 0);
});

test('klinik iptali kademelere bakmaz', () => {
  assert.equal(clinicCancelEntitlement(policy).patientBps, 10_000);
});

test('üç pay her kademede tam 10000 baz puana toplanır', () => {
  for (const seconds of [60 * DAY_SECONDS, 14 * DAY_SECONDS, 10 * DAY_SECONDS, 0, -DAY_SECONDS]) {
    const e = entitlement(policy, at(seconds));
    assert.equal(e.patientBps + e.clinicBps + e.agencyBps, 10_000, `${seconds}s`);
  }
});

test('politika satırları en cömertten en dara sıralı ve aralıklar bitişik', () => {
  const rows = policyRows(policy);
  assert.deepEqual(
    rows.map((row) => row.refundBps),
    [10_000, 5_000, 0],
  );
  assert.equal(rows[0]!.from, null);
  assert.equal(rows.at(-1)!.until, null);
  assert.equal(rows[0]!.until!.getTime(), rows[1]!.from!.getTime());
});

// ---------------------------------------------------------------- dağıtım

test('dağıtım toplamı bakiyeye tam eşit — TW resolve-dispute şartı', () => {
  const balances = ['869.5652174', '0.0000001', '1', '1000', '33.3333333', '7.7777777'];
  for (const value of balances) {
    const balance = parseUsdc(value);
    for (const seconds of [20 * DAY_SECONDS, 10 * DAY_SECONDS, DAY_SECONDS]) {
      const rows = distribute(balance, entitlement(policy, at(seconds)), parties);
      const total = rows.reduce((sum, row) => sum + row.amount, 0n);
      assert.equal(total, balance, `${value} @ ${seconds}s`);
      assert.ok(
        rows.every((row) => row.amount > 0n),
        'sıfır tutar TW tarafından reddedilir',
      );
    }
  }
});

test('tam iadede yalnızca hasta listeye girer', () => {
  const balance = parseUsdc('869.5652174');
  const rows = distribute(balance, entitlement(policy, at(20 * DAY_SECONDS)), parties);
  assert.deepEqual(rows, [{ address: 'PATIENT', amount: balance }]);
});

test('sıfır iadede hasta listeye hiç girmez', () => {
  const rows = distribute(parseUsdc('869.5652174'), entitlement(policy, at(DAY_SECONDS)), parties);
  assert.deepEqual(
    rows.map((row) => row.address),
    ['CLINIC', 'AGENCY'],
  );
});

test('yuvarlama artığı hasta lehine yazılır (FR-4)', () => {
  const balance = parseUsdc('869.5652174');
  const rows = distribute(balance, entitlement(policy, at(10 * DAY_SECONDS)), parties);
  const patient = rows.find((row) => row.address === 'PATIENT')!.amount;
  const exactHalf = (balance * 5_000n) / 10_000n;
  assert.ok(patient >= exactHalf, `${patient} < ${exactHalf}`);
  assert.ok(patient - exactHalf <= 2n, 'artık en fazla iki taban birim olabilir');
});

test('ajans yoksa payı kliniğe eklenir', () => {
  const balance = parseUsdc('100');
  const rows = distribute(balance, entitlement(policy, at(DAY_SECONDS)), {
    patient: 'PATIENT',
    clinic: 'CLINIC',
  });
  assert.deepEqual(rows, [{ address: 'CLINIC', amount: balance }]);
});

test('sıfır bakiye reddedilir', () => {
  assert.throws(() => distribute(0n, entitlement(policy, at(DAY_SECONDS)), parties));
});
