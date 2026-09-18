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



## What I built — one block per screenshot slide

Four slides, four presses. Each block is what you say while that screenshot is up.
The indented line under each is the plumbing — say it if the room is technical,
skip it if you're tight on time.

### Slide 1 — the notice

> So I built Pacta.
>
> The clinic sends a link instead of a bank account. The page has the licence
> number, the date, and what you get back if you cancel. Until the 13th you get
> all of it. After that half. Last week nothing. You read that before you pay.

*Nothing has touched the chain yet. This page is just the offer.*

### Slide 2 — the clinic desk

> Now you press pay. And that one press is three transactions.
>
> First it creates the escrow — that's a fresh contract for this one deal, with
> four addresses written into it: you, the clinic, and two of my keys.
>
> Second, it writes the cancellation terms into my contract, tied to that escrow.
> The dates and the percentages you just read. After that they can't be edited.
>
> Third, your money goes in. USDC, locked in that escrow.
>
> And here's the clinic's screen after that. Eight hundred euros, sitting there.
> Their wallet says zero. They can see it, they can't spend it.

*Order matters: the terms are committed before the money lands. So the promise is
older than the deposit — you can check that from the timestamps.*

### Slide 3 — the QR

> Then you fly in.
>
> The front desk presses "patient has arrived". That's one transaction, signed
> with the clinic's key, and it moves nothing — it just marks the escrow.
>
> The desk shows this QR, you scan it, and it opens your own page on your phone.
> You press confirm. That's three more: your confirmation, then my contract
> writing down the split before anyone gets paid, then the release.
>
> Both of you, or nothing moves. The clinic can't release on its own. And it can't
> be released against you.

*Seven transactions from pay to payout: create the escrow, commit the terms, lock
the money, check in, confirm, record the split, release.*

## Slide — the architecture

*(the diagram. This is where you tie the whole thing together.)*

> So here's the whole thing in one picture.
>
> Left is you. Right is the clinic. In the middle, two contracts: the escrow that
> holds the money, and my contract that holds the terms.
>
> Arrival is seven transactions, in this order.
>
> The escrow gets created. The cancellation terms get written into the contract,
> tied to that escrow. The money locks. Then the check-in. Then the confirmation.
> Then the contract records the split — who gets what, written down before
> anything moves. And then the money moves.
>
> Cancelling is six. Same first three. Then the cancellation opens, the contract
> works out the split from the terms and the date, and that's what gets paid.
>
> The order is the point. The split is always published before the money goes
> anywhere.
>
> And the last hop, bottom right. The clinic asks the anchor for a rate, gets a
> firm quote, sends the USDC, and lira lands in their bank account. They see a
> rate and an IBAN. They never touch crypto.
>
> Every step leaves a transaction, and the patient sees them on their own page as
> links. It's the chain, not my database.



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



## The seven transactions, if someone digs

Know this cold; don't read it out.


| #   | What                                                | Who signs          |
| --- | --------------------------------------------------- | ------------------ |
| 1   | Escrow created (roles written in)                   | service, automatic |
| 2   | Cancellation terms committed to the policy contract | service, automatic |
| 3   | USDC funded into the escrow                         | **Patient**        |
| 4   | Milestone marked "arrived"                          | **Clinic**         |
| 5   | Milestone approved                                  | **Patient**        |
| 6   | Split recorded on the policy contract               | service, automatic |
| 7   | Escrow released to the clinic                       | service, automatic |


Cancellation replaces 4–7 with three: the dispute is opened, the split is
recorded, the payout goes out. Six in total, and the patient signs nothing after
paying. The payout uses a second key, because Trustless Work refuses a dispute
resolver that holds any other role.

Steps 6 and 7 are the pair that matters: 7 moves the money, 6 publishes what 7
will be — always in that order. If a judge presses on who controls those keys,
the honest answer is Pacta does, and the answer to *that* is the policy contract:
the terms and the recorded split are public, so a payout that doesn't match them
is visible to anyone.

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