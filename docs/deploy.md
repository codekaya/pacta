# Deploying the demo to Vercel

Testnet only. Everything below assumes throwaway keys — never put a mainnet
secret in an environment variable.

## Before you start

The demo signs for every role from the server, so the host needs the same two
secrets your laptop has, plus somewhere to keep deal state between requests.
That last one matters: on Vercel each request can land on a different instance,
so the in-memory store would lose a deal between "Pay" and "I am at the clinic".

## 1. A shared store (2 minutes)

In the Vercel dashboard: **Storage → Marketplace → Upstash (Redis) → Create**,
then connect it to the project. It sets `KV_REST_API_URL` and
`KV_REST_API_TOKEN` for you. Any Upstash database works — the code also reads
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

Skip it and the site still runs, but a deal can vanish mid-flow. Don't present
without it.

## 2. Import the project

**Add New → Project →** pick the repository, then:

| Setting | Value |
|---|---|
| Root Directory | `web` |
| Include files outside the root directory | **on** — `web` depends on `../anchor` |
| Framework | Next.js (detected) |
| Build / install command | leave as detected |

## 3. Environment variables

Add these for Production and Preview:

| Name | Where it comes from |
|---|---|
| `TW_API_KEY` | dapp.trustlesswork.com → Settings → API Keys |
| `PACTA_POLICY_CONTRACT` | `CBH76LP7DYOMVUKXFKLQGDLLDVIFK6LM7S24BNQQMZ774EIR57TTP7V2` |
| `PACTA_WALLETS` | the whole contents of `web/.tw-wallets.json`, on one line |
| `CLINIC_IBAN` | optional; blank uses the anchor's sandbox account |

`KV_REST_API_URL` and `KV_REST_API_TOKEN` are already there if you connected
Upstash in step 1.

To copy the wallets in one go:

```bash
cd web && cat .tw-wallets.json | tr -d '\n'
```

Without `PACTA_WALLETS` the site falls back to simulated escrow and says so on
the page — which is a safe failure, not a crash.

## 4. Deploy, then check three things

1. The notice at `/d/d-8f3a91` says **Live on Stellar testnet** in small type
   under the button. If it says simulated, an env var is missing.
2. The clinic desk at `/clinic` shows a rate under "Today's rate" — that means
   the anchor is reachable from the host.
3. Pay once, then open `/clinic` in a different browser. The deposit shows as
   held there too. If it doesn't, the shared store is not connected.

## Before each demo

```bash
cd web
npm run tw -- topup          # recycle USDC from clinic and agency to the patient
npm run tw -- fund 1500      # or buy more through the anchor, ~30 USDC per run
```

Then hit **Restart, procedure in 20d** on the notice. The patient needs 8.70
USDC per run at the 1:100 testnet scale.

## Known limits on a host

- **Cold starts.** The first click after idle takes a few seconds longer. Open
  the page once before you go on stage.
- **Long steps.** The TRY withdrawal polls the anchor until the payment
  completes, which can approach the Vercel function timeout on the free plan.
  If it times out, the withdrawal still completes at the anchor — the page just
  stops showing it. The laptop has no such limit.
- **State is shared, not private.** Anyone opening the link sees the same deal.
  That is fine for a demo; it is not multi-tenant.

## Running the demo locally instead

More reliable on stage: no cold starts, no timeouts. `npm run dev`, two windows,
done. Use the Vercel URL for judges to click afterwards.
