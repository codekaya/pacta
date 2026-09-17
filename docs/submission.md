# Pacta — Stellar Hackathon Pro 2026 submission

Fields in bracketed placeholders — `[…]` — need the team's input before submitting.

---

## Project name
Pacta

## Track
Scale Track

## One-liner
Health-tourism deposits held in a Trustless Work escrow until the patient arrives, with refund terms committed on-chain before payment and the clinic cashing out in Turkish lira through a SEP-6 anchor.

## Problem
Patients travelling to Türkiye for treatment pay a deposit of 10–30% of the price before they fly, typically by wire, Western Union or MoneyGram, to a clinic they found online. The deposit is almost always non-refundable, because that is the clinic's only defence against no-shows, and none of those rails offer a chargeback. The patient carries all the risk, the clinic loses bookings to that distrust, and nobody in between is neutral.

Türkiye treated 1,398,580 health tourists in 2025 for $3.02B; revenue per patient rose from $1,815 to $2,518 in Q1 2026 (source: Hizmet İhracatçıları Birliği). Fewer patients with larger tickets means more money at risk in every deposit.

## Solution
1. The clinic sends the patient a deposit notice: licence number, procedure, date, and a cancellation schedule shown as calendar dates and euro amounts.
2. The patient pays. USDC is locked in a Trustless Work single-release escrow, and the schedule is committed to the Pacta Policy Commitment Contract, bound to that escrow.
3. At the clinic, the front desk checks the patient in and the patient confirms from a QR. Pacta records the split on the policy contract and releases the escrow.
4. The clinic withdraws USDC to its TRY bank account through a SEP-6 anchor, at a rate locked by a SEP-38 quote.

If the patient cancels, Pacta opens a dispute with its release key (the patient signs nothing), the policy contract computes the split at ledger time, and Pacta's separate resolver key pays exactly that split out of the escrow.

## Stellar integration — which protocol and why it creates ecosystem value
**Trustless Work (SCF Integration List).** Trustless Work holds custody. Its single-release roles map one to one onto Pacta's flow: patient = `approver`, clinic = `serviceProvider` and `receiver`, Pacta = `releaseSigner` and, with a separate key, `disputeResolver`. Without it there is no escrow; the integration is load-bearing.

**What we added.** Trustless Work has no time trigger: every partial refund is a distribution list the dispute resolver signs. Pacta is that resolver, so escrow alone would make every refund Pacta's decision. The Policy Commitment Contract (Soroban) stores each escrow's terms immutably, exposes `distribute(deal, reason, at, balance)` publicly, and records the split once via `settle` before Pacta signs the payout, refusing back-dated or future times. A deviation from the policy becomes provable on-chain. We state plainly that it is provable, not impossible.

**Ecosystem value.** A TRY off-ramp with a real payment behind every withdrawal, in a vertical with no Stellar payments project today. The policy contract is a reusable primitive for any Trustless Work deployment that needs date-based refunds.

## Anchor / local payments
`anchor/` implements SEP-1, SEP-10, SEP-12, SEP-38 and SEP-6 against the TRY anchor (`tr-mock-anchor.fly.dev`). The clinic desk calls it directly: SEP-10 login with the clinic key, SEP-12 KYB with the payout IBAN, a firm SEP-38 quote, SEP-6 `withdraw-exchange`, the USDC payment with the anchor's memo, then status polling to `completed`. Verified on testnet: 5 USDC → 242.15 TL, completed with a FAST bank reference. The same client runs the reverse direction (TRY → USDC), which funded the demo wallets. Only the anchor's bank rail is simulated by the sandbox.

## Architecture
- Animated architecture page: https://claude.ai/artifact/KmXfdAwLqCYmu35c2Yxkip
- Diagram and role table: `README.md` § Architecture

## What is real and what is simulated
| Real, on Stellar testnet | Simulated or next |
|---|---|
| Escrow custody on Trustless Work | The anchor's bank rail (sandbox) |
| Policy contract: commit, distribute, settle, events | Patient EUR → USDC on-ramp |
| USDC payouts to patient, clinic and agency per policy | Ministry of Health licence check (static list) |
| SEP-38 quotes and SEP-6 withdrawal to TRY | Demo keys sign for every role server-side; the product uses an embedded wallet for patients |
| Trustless Work 0.3% payout fee, measured and disclosed on the notice | On arrival the agency share is recorded on-chain but paid by the clinic; an on-chain split receiver is next |

Live escrows run at 1:100 scale (€800 deposit → 8.70 USDC) because the sandbox anchor caps single transfers.

## Testnet evidence (17 September 2026)
- Policy Commitment Contract: `CBH76LP7DYOMVUKXFKLQGDLLDVIFK6LM7S24BNQQMZ774EIR57TTP7V2` — https://stellar.expert/explorer/testnet/contract/CBH76LP7DYOMVUKXFKLQGDLLDVIFK6LM7S24BNQQMZ774EIR57TTP7V2
- Arrival path from the web app: 7 transactions (deploy, commit, fund, check-in, confirm, settle, release).
- Cancellation 10 days out from the web app: 6 transactions; 50% refund, split 4.35 / 3.91 / 0.43 USDC.
- CLI runs: arrival escrow `CAZOOV4T6IBEQVRNDOJQYTPWAT7ULXDFN6LH5UHPSF3NRV57JNYMRFUM`, cancellation escrow `CCVTHJLSGL6PMU5SJHCT4IJDPV5QTUR3JQ6VEHL5KHZG3QAEAB3WNYGQ`.
- Tests: 19 policy contract tests (including a parity vector shared with `web/lib/policy.ts`), 15 TypeScript tests.

## How to run the demo
```bash
cd web && npm install
npm run tw -- wallets        # testnet keys; add TW_API_KEY and PACTA_POLICY_CONTRACT to web/.env.local
npm run dev                  # patient notice at /d/d-8f3a91, clinic desk at /clinic
```
Scenario A: pay → clinic desk "Patient has arrived" → patient "I am at the clinic" → clinic "Withdraw to TL".
Scenario B: "Restart, procedure in 10d" → pay → "Cancel this booking" → 50% refund split.

## Business model
1–1.5% of the deposit, paid by the clinic; the patient pays nothing. The clinic's alternatives are 2.5–4% card fees with chargeback exposure, or wires with no protection. Agencies stop holding deposits but keep their commission from the same escrow, which turns them into the distribution channel.

## Roadmap after the hackathon
- **0–2 months:** pilot clinics in hair transplant and dental; letters of intent.
- **2–4 months:** patient embedded wallet, on-chain agency split as escrow receiver, licence registry check, security audit, mainnet.
- **SCF #46 Integration Track (deadline 8 November 2026):** on-chain commitments — deposit volume held in escrow and deals closed by release or refund, both countable from the policy contract's events.
- **Then:** the same product in Thailand, Mexico and Hungary corridors.

## Links
- Repository: [repo URL]
- Pitch deck: https://claude.ai/artifact/5FUdzXSUJMuMUbZwKosK9C
- Architecture: https://claude.ai/artifact/KmXfdAwLqCYmu35c2Yxkip
- Demo video: [link]

## Skill files used
Confirm which of these the team actually used, and drop the rest.
- `~/.claude/skills/smart-contracts/SKILL.md` — policy contract (Soroban storage, TTL, events, auth)
- `~/.claude/skills/dapp/SKILL.md` — stellar-sdk clients, transaction signing, contract invocation
- `~/.claude/skills/standards/SKILL.md` — SEP-1/10/12/38/6 anchor flow
- `~/.claude/skills/assets/SKILL.md` — USDC trustlines and the SAC
- `~/.claude/skills/data/SKILL.md` — Horizon and RPC reads
- `~/.claude/skills/prd/SKILL.md` — PRD
- `~/.claude/skills/create-architecture/SKILL.md` — architecture document

## Team
[names, roles, contact]
