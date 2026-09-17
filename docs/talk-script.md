# Pacta — talk script

Casual, first person. About four minutes of talking, one minute of screen — fits a
five-minute slot with room. Say it like you're explaining it to someone at the
table, not presenting at them. Where a line feels like a slogan, say the plain
version instead.

**The demo is pre-run.** You are showing what already happened, not waiting for
transactions on stage. Do this before you go up:

```bash
cd web
npm run tw -- topup                # or: npm run tw -- fund 1500
npm run tw -- cancel 5 10          # the cancellation, on chain, ~40s
```

Keep the escrow address that command prints — that's your cancellation tab.

Then, in the browser, run the arrival path once so the notice ends in its
finished state: Restart → 20d, Pay, clinic desk → Patient has arrived, notice →
I am at the clinic, clinic desk → Withdraw to TL.

**Four tabs, in this order:**

1. The notice `/d/d-8f3a91`, showing the released deal and its receipts.
2. The clinic desk `/clinic`, showing the withdrawal row.
3. stellar.expert on the cancellation escrow from the CLI run — its payments tab,
   three payments visible.
4. stellar.expert on the policy contract, in case someone asks.

Check the notice says **Live on Stellar testnet** in small type. Deck on the
shared screen; you switch to the browser about ninety seconds in.

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

> So the problem. 
>
> the story i s 
>
> A guy in Russia, or Germany, or France is scrolling reels, and a Turkish clinic comes up.  Price is a third of what it is at home, and there's a WhatsApp number. He messages, they send him a date. Then they ask for a deposit before he books the flight — usually ten to thirty percent.
>
> So now he's sending eight hundred euros by wire, or Western Union, to a clinic he
> found on Instagram. And the terms are non-refundable. Always.
>
> Once he hits send, There's no chargeback. If the clinic stops replying, what he has is a WhatsApp chat.



---

//////

> And that happens a lot. You can see with just one quick trustpilot search and reddit threads and review sites  
> and the pattern is identical every time: take the deposit, stop answering.
>
>
> And Turkey knows. Last April the health ministry brought in a whole new medical tourism regulation, but that didnot stopped the complains
>
>

## What I built

*(switch to the browser)*

> So I built it. It's a working proof of concept on Stellar testnet, and I ran the
> whole thing this morning — so I'm not going to make you watch transactions
> confirm. Everything on this screen already happened, and you can click any of it.

**Walkthrough, about a minute. Nothing to wait for.**

1. *Notice tab.* > This is the link the clinic sends the patient. Licence number,
   procedure, date, and the cancellation terms — as dates and euros, not
   percentages. Until the 13th you get everything back, after that half, last week
   nothing. The patient reads this before paying.
2. *Scroll to the receipt list.* > When the patient pays, this is what happens.
   Escrow deployed, cancellation terms written to my contract, money locked. Three
   transactions. Every line here is a link.
3. *Click one — the explorer tab opens.* > That's it on chain. Not my database.
4. *Clinic desk tab.* > Clinic side. They can see the eight hundred euros, they
   can't touch it. When the patient arrives, front desk checks them in, patient
   confirms on their phone, and only then does it release. Clinic ninety percent,
   agency ten — the agency still gets paid, it just never holds the money, which
   is how it works today.
5. *Point at the withdrawal row.* > And this is the clinic taking lira out. Five
   USDC, two hundred forty-two lira, through an anchor. The clinic never thinks
   about crypto.
6. *Cancellation tab — the explorer, three payments.* > And the other path. Same
   deposit, procedure ten days away, patient cancels. Nobody emails anyone. The
   contract worked out the split — half back to the patient — and the escrow paid
   exactly that. Three payments, one transaction.

*(If you have spare time and nerve: click Cancel live instead of showing the tab.
It takes about thirty seconds. Talk over it — the next section fills exactly that
gap. If you are at all tight, don't.)*

## The actual technical bit

*(back to the deck — the architecture slide)*

> Two pieces. Trustless Work holds the money — that's an escrow protocol already on
> Stellar, SCF has funded them several times, they're on the integration list. I
> didn't rebuild that.
>
> But their escrow doesn't know what day it is. When someone cancels, somebody has
> to tell it "send this much to the patient, this much to the clinic" and sign it.
> And that somebody is me.
>
> So if I stopped there, I'd have moved the problem, not fixed it. Before, you had
> to trust the clinic. Now you'd have to trust me.
>
> So I wrote one small contract, and its whole job is to keep me honest. Three
> things. Before the patient pays, it stores the refund terms — and they can't be
> edited after. When someone cancels, the contract works out the split itself,
> using the chain's clock, so I can't pretend the cancellation happened earlier to
> pay out less. And I have to write down what I'm about to pay, on chain, before I
> pay it.
>
> So if I send something different from what the contract says, the two don't
> match, and anyone can see it. It doesn't make cheating impossible. It makes it
> obvious. I'd rather tell you that than have you find it.

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

> So where this is right now. I've listed over a hundred clinics, and this week I'm
> cold DMing every one of them to find the first pilot. Nothing signed yet — I'd
> rather say that than dress it up. What I'm looking for is one clinic that will
> run real deposits through it.
>
> The money side is simple. Clinic pays one to one and a half percent. Cards cost
> them two and a half to four, plus chargebacks after the patient flies home. The
> patient pays nothing.
>
> And none of this is specific to hair transplants. It's a deposit, a date, and a
> refund schedule. Dental, IVF, aesthetic surgery — same product, same contract, I
> just change the tiers. The clinic writes its own policy; I don't decide it.
>
> It's not specific to Turkey either. Thailand, Mexico, Hungary — same pattern: a
> patient paying a stranger abroad, before they travel, on a rail with no recourse.
> Turkey is the biggest one, and the one I know. The lira off-ramp is the part
> that's country-specific, and that's exactly what the anchor handles — different
> country, different anchor, everything above it stays.
>
> And honestly it's bigger than medical. Anything where someone pays a deposit up
> front, to someone they've never met, against a date in the future. That's the
> primitive I've built. I'm starting with the version I understand.
>
> What I need right now is two clinics willing to try it, and an intro for the SCF
> Integration Track in November. That's it — happy to take questions.

---



## If the demo breaks

Say it, don't fix it.

Nothing runs live, so there is not much to break. What's left:

- **A tab didn't load, or the dev server died:** > the site's local, give me a
  second — *(switch to the stellar.expert tab)* — but here's the chain, which is
  the part that matters.
- **You chose to cancel live and it hangs:** > testnet's being slow, this normally
  takes half a minute — *(switch to tab 3)* — here's the same thing from this
  morning.
- **Someone asks to see it live:** say yes, and start the cancel while you answer
  the next question. It takes about thirty seconds.



## If you only get three minutes

Keep the story, cut it to four sentences: scrolling reels → deposit before the
flight → wire, non-refundable → no chargeback. Cut the revenue-per-patient line and
the business model paragraph. In the walkthrough, cut steps 3 and 5 — the explorer
click and the lira row — and mention lira in one sentence. Keep the cancellation
tab: that's the whole product.

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
[https://ca.trustpilot.com/review/corprocare.com](https://ca.trustpilot.com/review/corprocare.com)
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