# Pacta — talk script

Casual, first person, no live demo. About four and a half minutes; fits a
five-minute slot. Say it like you're explaining it to someone at the table, not
presenting at them. Where a line feels like a slogan, say the plain version.

**Before you go up**

- Deck on the shared screen. That's the only thing you drive.
- Two tabs open but not shown, in case a judge asks afterwards: the policy
  contract on stellar.expert, and an escrow from a run with its three payments.
- Know these four numbers cold: 7 transactions on the arrival path, 6 on a
  cancellation, 242 lira for 5 USDC, 0.3% Trustless Work fee.

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
> And Turkey knows. Last April the health ministry brought in a whole new medical tourism regulation, but that didnot stopped the complains

## What I built

*(architecture slide)*

> So that's the problem I picked. Here's what I built for it, and I'll be straight
> with you about which parts are real.
>
> The clinic sends the patient a link instead of an IBAN. On that page: the
> clinic's licence number, the date, and the cancellation terms — written as dates
> and euros, not percentages. Until this date you get everything back, after that
> half, last week nothing. The patient reads it before paying, not after.
>
> The patient pays, and the money goes into an escrow on Stellar. Not to the
> clinic. The clinic can see it sitting there and can't touch it.
>
> When the patient shows up, the front desk checks them in, the patient confirms
> from their phone, and only then does the escrow release — both sides, or it
> doesn't move. Clinic gets ninety percent, agency ten. The agency still gets paid,
> it just never holds the money, which is how it works today.
>
> And then the clinic takes lira out through a Stellar anchor, at a locked rate,
> straight to a bank account. As far as the clinic is concerned it never touched
> crypto.
>
> If the patient cancels instead, nobody emails anyone. The refund is whatever the
> schedule said on the day they booked.

## Why there are two contracts

*(the "escrow alone" slide)*

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

## What actually ran

> And this isn't a mockup. I ran the whole thing on Stellar testnet.
>
> The arrival path — pay, commit the terms, lock the money, check in, confirm,
> record the split, release — is seven transactions, and they're all on chain. A
> cancellation ten days out is six, and the patient got exactly half back: the
> contract worked out the split, I paid that, and both are public.
>
> The lira side is real too. Five USDC out through the anchor came back as two
> hundred forty-two lira, with a bank reference. The only simulated part is the
> bank wire itself, because that's the sandbox anchor — in production that's the
> anchor's job, not mine.
>
> One thing I only found by measuring: Trustless Work takes 0.3% on payouts. So a
> hundred percent refund actually lands as 99.7. It's printed on the patient's page
> now, because they should see it before they pay.

## What isn't finished

> What's not finished, so nobody has to guess. The clinic licence check is a
> static list right now, not a live registry call. And in the demo my own keys sign
> for everyone — in the real thing the patient signs with their own embedded
> wallet, and I only ever hold the release key. That's the next piece of work, and
> it's a wallet integration, not a rewrite.

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

## If someone asks to see it

You have no demo to break, which is the point. If a judge wants proof:

- Open the escrow tab: three payments, one transaction, the amounts the schedule
  said. "That's a cancellation, on chain, this morning."
- Or the contract tab: the terms and the recorded split.
- Or offer it after: "I can run one end to end for you in about a minute, it's all
  on testnet." Say that to a judge who is genuinely interested — it's a better
  conversation than a stage demo anyway.

## If you only get three minutes

Keep the story, cut it to four sentences: scrolling reels → deposit before the
flight → wire, non-refundable → no chargeback. Cut the business model paragraph.
In "What I built", cut the agency sentence and the lira paragraph, and in "What
actually ran" keep only the cancellation numbers. Never cut the line about being
the dispute resolver — that's the one that makes the rest credible.

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