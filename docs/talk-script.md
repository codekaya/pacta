# Pacta — talk script

Four minutes, spoken. Roughly 560 words at a calm pace, plus demo time. Cut marks
for a 3-minute slot and an expansion for 5 are at the end.

**Before you go up**
- Two browser windows side by side: the deposit notice `/d/d-8f3a91` (left, phone-width),
  the clinic desk `/clinic` (right). A third tab with the policy contract on stellar.expert.
- Deal restarted with **procedure in 20 days**, status "Deposit due". Clinic wallet holds USDC.
- `web/.env.local` has `TW_API_KEY`. Check the notice says "Live on Stellar testnet" before you start.
- Deck open on the shared screen; you switch to the browser at slide 4.

---

## 0:00 — Cover

> Six dental implants in Istanbul. Eight hundred euros, due before the patient
> gets on a plane. The clinic asks for a wire transfer, and the terms are
> "non-refundable".
>
> That is the normal way this money moves today, and both sides hate it.

*(beat — click to Problem)*

## 0:25 — The problem

> The patient is sending eight hundred euros to a clinic they found on Instagram,
> on a rail with no chargeback — wire, Western Union, MoneyGram. If anything goes
> wrong, they have an email address.
>
> The clinic is not the villain here. "Non-refundable" is its only defence against
> no-shows. So distrust is priced into every booking, and the clinic loses the
> patients who will not take that risk.
>
> Türkiye treated 1.4 million health tourists last year, three billion dollars of
> revenue. And the ticket is getting bigger: revenue per patient is up 39% in one
> year. Fewer patients, more money at risk in each deposit.

## 1:10 — What we built

*(click to the four steps, then switch to the browser)*

> Pacta holds that deposit until the patient physically walks into the clinic.
> Let me show you the real thing — this is Stellar testnet, every step is a
> transaction you can open.

**DEMO — arrival path (about 60 seconds)**

1. *Point at the notice.* > This is what the clinic sends. Licence number, procedure
   date, and the cancellation schedule — as calendar dates and euros, not percentages.
   The patient reads this **before** paying.
2. *Click Pay €800.* > Three transactions. The deposit is locked in a Trustless Work
   escrow, and the refund schedule is written to our policy contract, bound to that
   escrow. *(point at the receipts as they appear)*
3. *Switch to the clinic desk.* > The clinic sees eight hundred euros. It cannot
   touch it. The patient arrives, the front desk checks them in — *click* — and the
   patient confirms on their phone. *(back to notice, click "I am at the clinic")*
4. > Released. Clinic ninety percent, agency ten — the agency keeps its commission
   without ever holding the money.
5. *Clinic desk → Withdraw to TL.* > And the clinic takes lira. SEP-38 quote,
   SEP-6 withdrawal, real rate, money out to an IBAN. Five USDC, two hundred and
   forty-two lira, completed.

**DEMO — cancellation (about 20 seconds)**

*(click Restart → 10d, Pay, then Cancel this booking)*

> Now the other path. Same deposit, procedure ten days away, patient cancels.
> Nobody negotiates. The contract computes the split — fifty percent back to the
> patient — and the escrow pays exactly that.

## 2:30 — The part that matters

*(back to the deck: architecture, then the missing primitive slide)*

> Trustless Work holds the money — it is on the SCF Integration List, and its roles
> map one to one onto our flow.
>
> But an escrow cannot say "it depends on the date". In Trustless Work every refund
> is a list of amounts the dispute resolver signs. **We are that resolver.** So on
> its own, the refund would still be Pacta's decision — which is exactly the problem
> we claim to solve.
>
> So we wrote the one primitive the ecosystem was missing: a policy contract. Terms
> committed per escrow, before the money moves. The split computed at ledger time,
> so a cancellation cannot be back-dated into a cheaper tier. Recorded on-chain
> before we sign the payout, and the function is public, so anyone can recompute it.
>
> I want to be precise: this makes a deviation **provable**, not impossible. That is
> what composition buys you here, and we would rather say it than be asked.

## 3:10 — Honest scope

> What is real: escrow custody, the policy contract, USDC moving to three parties,
> anchor quotes and lira withdrawals. What is not: the anchor's bank rail is a
> sandbox, the licence check is a static list, and demo keys sign for every role —
> in the product the patient signs with their own embedded wallet. Trustless Work
> also takes 0.3% per payout; we measured it, and it is printed on the notice.

## 3:30 — Model and ask

> The clinic pays one to one and a half percent. Cards cost it two and a half to
> four, plus chargebacks after the patient flies home. The patient pays nothing.
>
> Next: pilot clinics, embedded wallets, the agency split on-chain, audit, mainnet —
> and SCF Integration Track in November, where our commitments are two numbers
> anyone can count from the contract's events: deposit volume held, and deals closed.
>
> We are looking for two pilot clinics and an introduction to the Integration Track.
> Clinics can stop saying "non-refundable". Patients can stop wiring blind.

---

## If the demo breaks

Say it plainly and keep moving; never debug on stage.

- **A step hangs:** > Testnet is having a moment — here is the same run from an hour
  ago. *(switch to the stellar.expert tab: the policy contract, then an escrow from
  the CLI run.)*
- **The API is down:** the site falls back to simulated mode and says so on the page.
  > The escrow calls are simulated right now; the arithmetic is the same code, and
  here are this morning's transactions on chain.
- **Withdrawal is slow:** talk over it — > the anchor is polling for the bank leg —
  and move to the cancellation path; come back to it at the end if it lands.

## 3-minute cut

Drop the market paragraph (1:10) to one sentence: *"1.4 million patients, three
billion dollars, and the ticket per patient is up 39% in a year."* Drop the
withdrawal step from the demo and mention it in one line during the architecture
slide. Keep the cancellation path — it is the product.

## 5-minute version

Add after "The part that matters":
> Two keys, not one: the key that releases and the key that resolves disputes are
> separate, because Trustless Work refuses a resolver that holds another role. And
> our release key can open a dispute — which is why a cancellation needs no
> signature from the patient at all. That is what lets the patient pay without ever
> setting up a wallet.

And after "Honest scope":
> The policy math exists twice — once in Rust on-chain, once in TypeScript in the
> app — and a shared test vector makes the two agree to the stroop. If they ever
> disagree, the app refuses to send the payout.

## Answers to keep ready

**"Why not just use Trustless Work?"** We do, for custody. It has no time trigger,
so a date-based refund is not expressible: every refund is whatever the resolver
signs. We added that piece and left the money where the ecosystem already solved it.

**"There are six funded escrow projects on Stellar."** None in a vertical. Our moat
is not escrow — it is the licence badge, the cancellation templates clinics
actually use, arrival confirmation, and the agency payout channel.

**"What is your value to the ecosystem?"** A lira off-ramp with a real payment
behind every withdrawal. In our September snapshot, none of the listed anchors
served TRY, and no health-tourism payments project was listed at all.

**"Regulation?"** The patient pays abroad, the money sits in a contract — Pacta
never takes custody — and the clinic receives lira from a licensed anchor. Being
non-custodial strengthens that position.

**"Can Pacta steal the deposit?"** Pacta signs the payout, so nothing stops a
deviation in the moment. What stops it is that the deviation is visible: terms and
split are on-chain, and anyone can recompute them. Our roadmap moves the resolver
role to a contract, which removes the discretion entirely.

**"Why 1:100 amounts on testnet?"** The sandbox anchor caps single transfers. The
policy math is identical at any scale; the parity tests run at full size.
