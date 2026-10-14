# Pacta — project summary

**Health-tourism deposits, held in escrow until the patient walks into the clinic.**
Stellar Hackathon Pro 2026 · Scale Track

---

## What it is

A patient flying to İstanbul for treatment is asked for a deposit before they
book the flight. Today that deposit goes by wire or Western Union to a clinic
they found on Instagram, and the terms are non-refundable.

Pacta replaces the bank account with a link. The patient reads the clinic's
licence number, the procedure date, and exactly what they get back if they
cancel — then pays. The money is locked in a Trustless Work escrow, and the
cancellation schedule is committed to a Soroban contract **before the deposit
lands**. At the clinic, the front desk checks the patient in, the patient
confirms from a QR, and only then does the escrow release. The clinic cashes out
in Turkish lira through a SEP-6 anchor.

If the patient cancels, the contract computes the split from the chain's clock
and publishes it before any money moves.

## The problem, in numbers

Türkiye treated **1,398,580** health tourists in 2025 for **$3.02B**. Revenue per
patient rose from $1,815 to $2,518 in Q1 2026 — fewer patients, larger tickets,
more money at risk in every deposit. *(Source: Hizmet İhracatçıları Birliği, the
services exporters' association — official trade data.)*

Deposits run 10–30% of the price and are openly advertised as non-refundable.
None of the rails clinics use offer a chargeback. The patient carries all the
risk, the clinic loses bookings to that distrust, and nobody in between is
neutral. April 2025 brought a new medical tourism regulation; the complaints
did not stop.

## How it works

1. **The clinic writes a notice.** Procedure, date, deposit, its own cancellation
   schedule, and the agency if the booking came through one. It gets a link to
   send the patient the way it already sends the appointment.
2. **The patient pays.** One press is three transactions: the escrow is deployed,
   the schedule is committed to the policy contract and bound to that escrow, and
   the USDC is locked. Order matters — the promise is older than the deposit, and
   anyone can check that from the timestamps.
3. **Arrival is dual-confirmed.** The clinic marks the patient as arrived; the
   patient confirms from their own phone. Both, or nothing moves.
4. **The clinic withdraws in lira.** A firm SEP-38 quote, a SEP-6
   `withdraw-exchange`, and TRY lands in the clinic's bank account. The clinic
   sees a rate and an IBAN. It never touches crypto.

Arrival is seven transactions; a cancellation is six, and the patient signs
nothing after paying.

## Stellar integration

**Trustless Work holds custody** (SCF Integration List). Its single-release roles
map one to one onto the flow: patient = `approver`, clinic = `serviceProvider`
and `receiver`, Pacta = `releaseSigner` and, on a separate key, `disputeResolver`.
Without it there is no escrow — the integration is load-bearing, not decorative.

**What Pacta adds.** Trustless Work has no time trigger: every partial refund is
a distribution list the dispute resolver signs. Pacta is that resolver, so escrow
alone would make every refund Pacta's decision. The **Policy Commitment
Contract** (Soroban) closes that gap as far as composition allows:

- **Immutable terms.** One policy per escrow, committed before funding.
- **Public arithmetic.** `distribute(deal, reason, at, balance)` returns the exact
  `resolve-dispute` list — positive amounts, summing to the live balance. Anyone
  can call it and recompute the answer.
- **A recorded promise.** `settle` stores and emits the split once, before Pacta
  signs the payout, and rejects times before commitment or after the current
  ledger — so a cancellation cannot be moved into a cheaper tier.

This makes a deviation **provable, not impossible.** We say that plainly rather
than overclaiming; moving the resolver role into a contract is on the roadmap and
removes it entirely.

**Ecosystem value.** A TRY off-ramp with a real payment behind every withdrawal,
in a vertical with no Stellar payments project today. The policy contract is a
reusable primitive for any Trustless Work deployment that needs date-based
refunds.

## What runs today

| | |
|---|---|
| Policy Commitment Contract | [`CBH76LP7…P7V2`](https://stellar.expert/explorer/testnet/contract/CBH76LP7DYOMVUKXFKLQGDLLDVIFK6LM7S24BNQQMZ774EIR57TTP7V2) on testnet |
| Escrow | Trustless Work single-release, deployed per deal |
| Anchor | SEP-1/10/12/38/6 against a TRY anchor — verified 5 USDC → 242.15 TL, completed with a FAST bank reference |
| Tests | 19 policy-contract tests, 27 for the `upto` scheme, 23 TypeScript |

The refund math is written twice — once in the Soroban contract, once in the web
app — and the two share a parity vector in both test suites. If they ever
disagree, the app refuses to pay.

A clinic can write its own notice from the front desk. The schedule it enters is
validated against the same rules the contract enforces (`check_terms`), so a
policy the chain would reject is caught while it is still cheap — before the
clinic has quoted a patient. Notice links carry 128 bits of randomness, because
the link is the patient's only credential.

## Honest scope

| Real, on testnet | Simulated or next |
|---|---|
| Escrow custody, policy contract, USDC movement | The anchor's bank rail (sandbox) |
| SEP-38 quotes and SEP-6 withdrawal to TRY | Patient EUR → USDC on-ramp |
| Payouts to patient, clinic and agency per policy | Ministry of Health licence check — static list today |
| Trustless Work's 0.3% payout fee, measured and disclosed on the notice | Demo keys sign for every role server-side; the product gives the patient an embedded wallet |

Live escrows run at 1:100 scale (€800 → 8.70 USDC) because the sandbox anchor
caps single transfers. The math is identical; the tests run at full size.

## Business model

1–1.5% of the deposit, paid by the clinic. The patient pays nothing. The clinic's
alternatives are 2.5–4% card fees with chargeback exposure after the patient
flies home, or wires with no protection at all. Agencies stop holding deposits
but keep their commission out of the same escrow — which turns them into the
distribution channel rather than the obstacle.

## Where it goes

- **0–2 months:** pilot clinics in hair transplant and dental; letters of intent.
- **2–4 months:** patient embedded wallet, on-chain agency split as escrow
  receiver, licence registry check, security audit, mainnet.
- **SCF #46 Integration Track (8 November 2026):** on-chain commitments — deposit
  volume held in escrow and deals closed by release or refund, both countable
  from the policy contract's events.
- **Then:** the same product in the Thailand, Mexico and Hungary corridors. The
  only local part is the payout, and that is the anchor. Swap the anchor;
  everything else stays.

It is not only medical, either. It is a deposit, a date, and a refund schedule.

---

*Repository: [github.com/codekaya/pacta](https://github.com/codekaya/pacta) ·
Apache-2.0*
