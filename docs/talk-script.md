# Pacta — talk script

Casual, first person, about four minutes plus demo. Say it like you're explaining
it to someone at the table, not presenting at them. Short sentences. Where a line
feels like a slogan, drop it and say the plain version.

**Before you go up**
- Two windows side by side: the deposit notice `/d/d-8f3a91` (left, phone-width),
  the clinic desk `/clinic` (right). A third tab with the policy contract on stellar.expert.
- Deal restarted at **procedure in 20 days**, showing "Deposit due". Clinic wallet has USDC.
- `web/.env.local` has `TW_API_KEY`. The notice should say "Live on Stellar testnet".
- Deck on screen; you switch to the browser about a minute in.

---

## Opening

> Hi, I'm Yusuf. I met some of you yesterday. My project is called Pacta, and I'm
> working on payments for medical tourism.
>
> If you know Turkey, you probably know it's relatively cheap for medical treatment.
> Every year over 1.4 million people come for it, mostly hair transplants and
> dentistry — it's known as Turkish hairlines at this point. That's about three
> billion dollars a year. The numbers are from HİB, the services exporters'
> association, so it's official trade data, not my estimate.

## The problem

> So the problem. Let me tell it as a story, because that's how I ran into it.
>
> A guy in Russia, or Germany, or France is scrolling reels, and a Turkish clinic
> comes up. Before and after photos, price is a third of what it is at home, and
> there's a WhatsApp number. He messages, they send him a date. Then they ask for
> a deposit before he books the flight — usually ten to thirty percent.
>
> So now he's sending eight hundred euros by wire, or Western Union, to a clinic he
> found on Instagram. And the terms are non-refundable. Always.
>
> Once he hits send, that's it. There's no chargeback on those rails. If the clinic
> stops replying, what he has is a WhatsApp chat.
>
> And that happens a lot. I'll give you one I can actually point at: a woman in the
> UK, asking a clinic in Istanbul for eight hundred euros back. They stopped
> replying in October. She posted the review in January. Same amount as my demo,
> which I didn't plan.
>
> That one's public on Trustpilot. The rest live in Reddit threads and review sites,
> and the pattern is identical every time: take the deposit, stop answering.
>
> And Turkey knows. Last April the health ministry brought in a whole new medical
> tourism regulation — clinics need a licence to treat foreign patients, there are
> fines, they've shut down a lot of unlicensed places. But that regulates who is
> allowed to operate. Nobody's touched how the money moves. It's still a wire to a
> stranger.
>
> And the clinic isn't the bad guy either. They say non-refundable because people
> book and don't show up, and that's the only protection they have. So both sides
> are defending themselves and nobody trusts anybody.
>
> And it's getting more expensive to get wrong: patient numbers are down a bit, but
> revenue per patient is up about forty percent in a year. Bigger deposits, same
> WhatsApp trust.

## What I built

*(switch to the browser)*

> So I built the boring version of an escrow for exactly that deposit. Let me just
> show you — this is running on Stellar testnet, everything you see is a real
> transaction.

**Demo, arrival — about a minute**

1. *Point at the notice.* > This is the link the clinic sends. Their licence number,
   the procedure, the date, and the cancellation terms. And the terms are dates and
   euros, not percentages — until the 13th you get everything back, after that half,
   last week nothing. You read that before you pay, not after.
2. *Click Pay €800.* > Okay, so three transactions just happened. The money's locked
   in a Trustless Work escrow, and those cancellation terms got written to a contract
   I wrote, tied to that specific escrow. You can click any of these and see it.
3. *Switch to the clinic desk.* > This is the clinic side. They can see the eight
   hundred euros, they just can't touch it. Patient shows up, front desk checks them
   in — *click* — and then the patient confirms on their own phone.
   *(back to the notice, click "I am at the clinic")*
4. > Released. Clinic gets ninety percent, agency gets ten. The agency still gets
   paid, they just never hold the money — which, by the way, is how it works today,
   the agency holds it.
5. *Clinic desk → Withdraw to TL.* > And then the clinic takes lira out. Real quote,
   real rate, out to an IBAN. Five USDC, two hundred forty-two lira. That went through
   an anchor, so the clinic never touches crypto as far as they're concerned.

**Demo, cancellation — about twenty seconds**

*(Restart → 10d, Pay, then Cancel this booking)*

> And the other side. Same deposit, procedure in ten days, patient cancels. Nobody
> argues, nobody emails anyone. The contract works out the split — half back — and
> the escrow pays that out.

## The actual technical bit

*(back to the deck)*

> So, two things holding this up. Trustless Work holds the money — that's an escrow
> protocol already on Stellar, it's on the SCF integration list, and their roles
> happened to map onto mine almost exactly.
>
> But an escrow can't say "it depends on the date". In Trustless Work, a refund is
> just a list of amounts that the dispute resolver signs. And I'm the dispute
> resolver. So if I stopped there, the refund is still just me deciding — which is
> the exact thing I said I was fixing.
>
> So that's the one piece I wrote myself. A small contract that stores the terms
> before the money moves, works out the split using ledger time so I can't
> back-date a cancellation into a cheaper tier, and records it on-chain before I
> sign anything. The function's public, so anyone can run the numbers themselves.
>
> To be straight about it: that makes it provable if I cheat, not impossible. I'd
> rather say that than have someone find it.

## What's real, what isn't

> Quickly, so nobody's guessing. Real: the escrow, the contract, USDC actually
> moving to three different people, the anchor quotes, the lira withdrawal. Not
> real: the bank leg on the anchor is a sandbox, the clinic licence check is a
> static list right now, and demo keys are signing for everyone — in the real
> thing the patient signs with their own embedded wallet.
>
> Also Trustless Work takes 0.3% on payouts. I only found that by measuring it, so
> it's printed on the notice now.

## Where this goes

> Business side is simple. Clinic pays one to one and a half percent. Cards cost
> them two and a half to four plus chargebacks after the patient flies home. Patient
> pays nothing.
>
> Next is pilot clinics, embedded wallets so the patient doesn't think about any of
> this, agency split on-chain, audit, mainnet. And SCF Integration Track in November —
> the nice thing there is my metrics are just two numbers anyone can count off the
> contract: how much is held, and how many deals closed.
>
> What I actually need right now is two clinics willing to try it, and an intro for
> the Integration Track. That's it — happy to take questions.

---

## If the demo breaks

Say it, don't fix it.

- **A step hangs:** > Testnet's being slow — here's the same run from earlier.
  *(switch to the stellar.expert tab.)*
- **API down:** the site drops to simulated mode and says so on the page.
  > Escrow calls are simulated right now, the math is the same code — here are this
  morning's transactions.
- **Withdrawal is slow:** > it's waiting on the bank leg — and move to the cancel
  demo. Come back to it if it lands.

## If you only get three minutes

Keep the story, cut it to four sentences: scrolling reels → deposit before the
flight → wire, non-refundable → no chargeback. Cut the revenue-per-patient line and
the business model paragraph. Cut the lira
withdrawal from the demo and mention it in one sentence instead. Keep the
cancellation demo — that's the whole product.

## If you get five

After the technical bit:
> Small thing I liked: I need two separate keys, because Trustless Work won't let the
> dispute resolver hold any other role. And the key that releases can also open a
> dispute — which means when a patient cancels, they don't sign anything at all.
> That's what lets someone pay without ever setting up a wallet.

And after what's real:
> The refund math exists twice, once in Rust on-chain and once in TypeScript in the
> app, with a shared test vector so they agree exactly. If they ever disagree, the
> app refuses to send the payout.

## Sources for the problem section

Keep these straight in case someone asks where it comes from.

- **1.4M patients, $3.02B, +39% per patient:** HİB (Hizmet İhracatçıları Birliği,
  the services exporters' association), 2025 full year and Q1 2026.
- **The €800 case:** Trustpilot review of corprocare.com by Monica Infante (GB),
  1 star, 20 January 2026 — "they have refused to refund the 800 euros"; she says
  communication stopped in October 2025. Overall 3.4/5 across 18 reviews, and
  Trustpilot notes the company has not replied to negative reviews.
  https://ca.trustpilot.com/review/corprocare.com
- **The regulation:** Regulation on International Health Tourism and Tourist Health,
  published in the Official Gazette on 26 April 2025; licensing, inspection and
  penalties for unlicensed practice. Say "last April" and leave it there unless asked.
- **"Shut down a lot of unlicensed places":** reported by industry and legal
  commentary as hundreds in recent years — no official figure I could verify, so do
  not put a number on it.
- Deposits themselves are openly standard: clinics advertise fixed deposits (some
  have a "$300 deposit" page) and normally state they are non-refundable.

If you find a stronger case before you present — a news story, or a friend's — use
that instead. First-hand beats a review every time.

## Questions you'll probably get

**"Why not just use Trustless Work?"** I do, for holding the money. It has no time
trigger, so date-based refunds aren't expressible — a refund is whatever the
resolver signs. I added that piece and left custody where the ecosystem already
solved it.

**"There are already escrow projects on Stellar."** Yeah, six funded ones. None of
them are in a vertical. My moat isn't escrow — it's the licence badge, cancellation
templates clinics actually use, arrival confirmation, and the agency payout.

**"What's the value to the ecosystem?"** A lira off-ramp with real payments behind
it. When I checked in September, none of the listed anchors did TRY, and there was
no health tourism payments project at all.

**"Regulation?"** Patient pays from abroad, money sits in a contract so I never hold
it, clinic gets lira from a licensed anchor. Being non-custodial is what makes that
work.

**"Can you steal the deposit?"** In the moment, nothing stops me signing the wrong
split. What stops me is that it's visible — the terms and the split are on-chain and
anyone can recompute them. Moving the resolver role into a contract is on the
roadmap, and that removes it entirely.

**"Why are the amounts so small on testnet?"** Sandbox anchor caps transfers, so the
demo runs at one hundredth scale. The math is identical, and the tests run at full
size.
