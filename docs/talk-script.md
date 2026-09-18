# Pacta — talk script

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

> And that happens a lot. You can see with just one quick trustpilot search   
> or at reddit threads and review sites  
> and the pattern is same every time: take the deposit, stop answering.
>
> And it is also known in turkey. Last April the health ministry brought in a whole new medical tourism regulation, but that didnot stopped the complains

## What I built — one slide at a time

Four slides, one screenshot each. Under each one: what you say, and what is
actually happening behind that click if you want to go deeper. Say the plain
version first, always. The indented lines are optional depth — use them if the
room is technical or someone asks.

### Slide 1 — the notice

> So I built Pacta.
>
> The clinic sends a link instead of a bank account. The page has the licence
> number, the date, and what you get back if you cancel. Real dates, real euros.
> Until the 13th you get all of it. After that half. Last week nothing. You read
> that before you pay.

*Deeper, if asked:* nothing is on chain yet at this point. The page is just the
offer. The terms only become permanent at the moment of payment — which is the
next slide, and that ordering is the whole design.

### Slide 2 — the clinic desk

> You pay, and the money goes into an escrow on Stellar. The clinic doesn't get
> it. They can see it — eight hundred euros, right there. Their wallet says zero.
> They can't spend it.
>
> And that one click is three transactions.
>
> First, an escrow gets deployed — its own contract, for this one deposit, with
> the roles fixed: you approve, the clinic provides, I can release but I'm not the
> receiver.
>
> Second, the cancellation terms go into my contract, tied to that escrow. That's
> before the money moves. The terms are locked before anyone can touch anything.
>
> Third, your USDC goes in. That one you sign.

*Deeper, if asked:* the order matters. Deploy, commit the policy, then fund. If
the policy went in afterwards I could wait to see whether you cancel and then
write terms that suit me. And the contract only accepts one policy per escrow, so
there is no second version of the truth.

### Slide 3 — the QR

> Then you fly in. The front desk marks you as arrived — that's one transaction,
> signed by the clinic, and it moves no money. Then you confirm on your phone.
> Both of you, or nothing moves.
>
> When you confirm, three things happen: your approval goes on chain, my contract
> reads the live escrow balance and records who gets what, and then the escrow
> pays out.
>
> Clinic gets ninety percent, agency ten. The agency still gets paid. They just
> don't hold the money any more. Today they do.

*Deeper, if asked:* the split is recorded before the payout, not after. So the
promise is on chain first and the money follows it — that's the ordering that
makes it checkable.

### Slide 4 — the receipts

> Every step leaves a line here, and every line is a transaction you can open.
> Escrow deployed, policy committed, money locked, clinic marked arrival. It's the
> chain, not my database.
>
> And cancelling is the same shape. I open the cancellation with my own key, so
> you don't sign anything — you already left. My contract works out the split from
> the terms and the chain's clock. I compare it to what my server calculated, and
> if those two disagree the payout doesn't go out at all. Then the escrow pays
> three people in one transaction: you, the clinic, the agency.
>
> Then the clinic takes lira out through a Stellar anchor, straight to their bank
> account. They log in with their key, the anchor locks a rate, the USDC goes
> across, the lira lands. They never touch crypto.
>
> And if you cancel, nobody argues with you. You get what the page said.

*Deeper, if asked:* the lira side is five standard Stellar protocols in a row —
login, KYC, a firm quote, the withdrawal, then the payment with the anchor's memo
on it. That's why swapping countries is swapping one anchor, not rewriting
anything.

## Why there are two contracts

*(the "escrow alone" slide)*

> Two parts. The money sits in Trustless Work. That's an escrow protocol already on
> Stellar, SCF funded them a few times, they're on the integration list. 
>
> But an escrow doesn't know what day it is. When someone cancels, somebody has to tell it who gets what, and sign it.
>
> So I needed to wrote a second contract.  It does three things. It saves the refund terms before you pay, and they can't be edited after. When someone cancels, it calculates the split itself, off the chain's clock, so I can't pretend the cancellation came earlier than it did. And I have to publish what I'm about to pay before I pay it.
>
> So if I pay something else, anyone can put the two side by side and see it. I can
> still cheat. Not quietly.

## What actually ran

> This runs. It's on Stellar testnet.
>
> Patient pays, terms get saved, money locks, clinic checks them in, patient
> confirms, split gets recorded, money releases. Seven transactions. All public.
>
> Cancelling is six. Ten days out, the patient got half back. The contract worked
> out the number and I paid that number.
>
> The lira works too. Five USDC through the anchor came back as two hundred forty
> two lira, with a bank reference. The bank transfer itself is sandbox — that's the
> anchor's side, not mine.
>
> One thing I only found by testing. Trustless Work takes 0.3 percent when it pays
> out. So a full refund is really 99.7. It's written on the patient's page now.

## What isn't finished

> Two things. The licence check is a static list, I don't query the ministry yet.
> And in the demo my keys sign for everybody. In the real thing the patient has
> their own wallet and I only hold the key that releases. That's a wallet
> integration, not a rewrite.

## Where this goes

> Right now I have a list of over a hundred clinics and I'm messaging all of them
> this week, looking for the first pilot. Nothing signed yet.
>
> The money side is simple. Clinic pays one to one and a half percent. Cards cost
> them two and a half to four, plus chargebacks after the patient flies home.
> Patient pays nothing.
>
> And this isn't only hair transplants. It's a deposit, a date, and a refund
> schedule. Dental, IVF, surgery. Same contract, the clinic picks its own numbers.
>
> It isn't only Turkey either. Thailand, Mexico, Hungary, same story. The only
> local part is the payout, and that's the anchor. Swap the anchor, everything else
> stays.
>
> It's not even only medical. Anyone paying a deposit to a stranger, for a date in
> the future. That's what I built. I started with the one I know.
>
> What I need is two clinics to try it, and an intro for the SCF Integration Track
> in November. That's it.

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

> One detail I liked. Trustless Work won't let the same key resolve disputes and do
> anything else, so I run two. And the key that releases can also open a dispute.
> Which means when a patient cancels, they don't sign anything. That's what lets
> someone pay without ever setting up a wallet.

And after what's real:

> The refund math is written twice. Once in the contract, once in the app. They
> share a test, so they have to agree exactly. If they ever don't, the app refuses
> to pay.

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