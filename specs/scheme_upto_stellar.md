# `upto` scheme — Stellar

**Status:** draft · **Scheme:** `upto` · **Networks:** `stellar`, `stellar-testnet`
**Reference implementation:** [`contracts/upto`](../contracts/upto) (Apache-2.0)

## Abstract

The `exact` scheme covers payments whose price is known before the request is
served. Metered services break that assumption: an agent calling an inference
endpoint knows its budget, not its bill. `upto` closes the gap — the client
authorizes a ceiling, the resource server settles what was actually consumed,
and the difference returns to the client.

This document specifies `upto` on Stellar. It is the Stellar counterpart to the
existing EVM and SVM `upto` specifications and follows their structure so
facilitators can treat the three networks uniformly at the HTTP layer.

## Motivation: why a contract is required

On EVM, `upto` is expressed with a signed authorization that a facilitator
redeems for an amount at or below the signed maximum. Stellar has no equivalent
primitive at the token layer. SEP-41 offers `approve`, and it is insufficient on
three counts:

1. **No recipient binding.** An allowance names a *spender*, not a destination.
   The spender may call `transfer_from` toward any address, so a compromised or
   dishonest facilitator can redirect a client's funds.
2. **No single-settlement guarantee.** An allowance remains drainable up to its
   limit until it is explicitly reduced. Nothing confines one authorization to
   one settlement, which is exactly the property a metered session needs.
3. **No binding to the paid-for resource.** An allowance carries no commitment
   to *what* was purchased, so a client and a server cannot prove they agreed on
   the same payment requirements.

A Soroban contract supplies all three. The remainder of this document defines
the payload, the contract interface, and the facilitator behaviour that together
constitute the scheme.

## Terminology

| Term | Meaning |
|---|---|
| payer | Account funding the payment. The x402 client. |
| payee | Sole account that may receive settled funds. Corresponds to `payTo`. |
| settler | Account authorized to name the settled amount: the resource server, or a facilitator acting for it. |
| escrow contract | The `upto` contract deployment named in `extra.contract`. |
| cap | `maxAmount`, the ceiling the payer commits to. |
| authorization id | `sha256(domain ‖ contract ‖ payload)`, the scheme's unique handle for one authorization. |

## Payment requirements

A resource server advertises `upto` in its `402` response like any other scheme.
`maxAmountRequired` is the cap the client is asked to authorize, not the price.

```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "upto",
      "network": "stellar-testnet",
      "maxAmountRequired": "5000000",
      "resource": "https://api.example.com/v1/completions",
      "description": "Metered inference, billed per 1K tokens",
      "mimeType": "application/json",
      "payTo": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
      "maxTimeoutSeconds": 600,
      "asset": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
      "extra": {
        "contract": "CCVCXH2P4UOSFCXA6HK2X4CIVXWEXKB6HNPB2Y6HUKQ7ZSQNQ7XJTFYS",
        "settler": "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        "decimals": 7
      }
    }
  ]
}
```

`extra` is mandatory for this scheme:

- **`contract`** — address of the `upto` escrow contract the payer must
  authorize against. Clients must reject requirements without it, since the
  authorization id is bound to this address.
- **`settler`** — the account that will submit settlement. Set it to `payTo` when
  the resource server settles for itself.
- **`decimals`** — decimals of `asset`, so clients can render the cap without an
  extra RPC round trip.

## Payment payload

The `X-PAYMENT` header carries base64-encoded JSON of the following shape.

```json
{
  "x402Version": 1,
  "scheme": "upto",
  "network": "stellar-testnet",
  "payload": {
    "contract": "CCVCXH2P4UOSFCXA6HK2X4CIVXWEXKB6HNPB2Y6HUKQ7ZSQNQ7XJTFYS",
    "authorization": {
      "payer": "GDUY7J7A33TQWOSOQGDO776GGLM3UQERL4J3SPT56F6YS4ID7MLDERI4",
      "payee": "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
      "settler": "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      "token": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
      "maxAmount": "5000000",
      "validAfter": "1700000000",
      "validBefore": "1700000600",
      "nonce": "9c1185a5c5e9fc54612808977ee8f548b2258d31ddadef4e1f1e2f0a1d4e4b7c",
      "resource": "4bf6e6dbd1f4b2a1c3d5e7f9a0b2c4d6e8fa0c1e3f5a7b9d1c3e5f7a9b0d2c4e"
    },
    "signature": "AAAAAQAAAAAAAAAA..."
  }
}
```

### `authorization`

Field names map one-to-one onto the contract's `UptoAuthorization` type.
`maxAmount`, `validAfter` and `validBefore` are decimal strings to survive
JSON's 53-bit integer limit; `nonce` and `resource` are 32-byte hex without a
`0x` prefix.

`resource` is a commitment to what is being paid for. Clients set it to
`sha256` of the canonical JSON of the selected `accepts` entry. The contract
does not interpret it — it only guarantees payer and settler agreed on the same
value, which is what lets a dispute be resolved against the advertised terms.

`nonce` is payer-chosen and makes otherwise identical authorizations distinct.

### `signature`

Base64 XDR of a `SorobanAuthorizationEntry` signed by the payer. This is where
Stellar diverges most from the EVM specification, and the divergence is
load-bearing: the entry is a protocol-level object, so the payer's key never
signs a raw scheme-defined digest, and smart-contract accounts (passkey wallets,
policy-gated accounts implementing `__check_auth`) work with no scheme changes.

The entry's invocation tree must be exactly:

```
root:  { contract: <extra.contract>, function: "settle_signed", args: [authorization] }
  └─   { contract: <token>,          function: "transfer",      args: [payer, <extra.contract>, maxAmount] }
```

Two properties of this tree are what make `upto` work on Stellar:

- **The settled amount is absent from the root args.** The contract calls
  `require_auth_for_args` with the payload alone, so one signature stays valid
  for any outcome within the cap. Had the payer signed the real invocation args,
  the amount would have been fixed at signing time and the scheme would collapse
  into `exact`.
- **The nested transfer commits to `maxAmount`, and to the escrow contract as
  destination.** Only the cap is knowable when the payer signs, so the cap is
  what moves; the contract then splits it. The payee never appears in the
  transfer args, which is why the payload signature — not the transfer — is what
  binds the recipient.

Note the two independent nonces. `authorization.nonce` is scheme-level and feeds
the authorization id. The `SorobanAddressCredentials` inside the entry carries
its own protocol-level nonce and `signatureExpirationLedger`, enforced by the
network. Facilitators should set `signatureExpirationLedger` to roughly
`validBefore`, so an entry cannot outlive the window it was written for.

## Authorization id

```
id = sha256( "x402-upto-stellar-v1" ‖ xdr(contract_address) ‖ xdr(authorization) )
```

`xdr(authorization)` is the XDR encoding of the Soroban map representation of
the payload, so the derivation is canonical without a separately specified
serialization. Including the contract address means an id has no meaning against
another deployment; the network passphrase is already covered by the signed
authorization entry.

Clients and facilitators should obtain ids from the contract's
`authorization_id` view function rather than reimplementing the hash.

## Contract interface

```rust
fn authorization_id(authorization: UptoAuthorization) -> BytesN<32>;

// one-shot path — the HTTP flow
fn settle_signed(authorization: UptoAuthorization, settled: i128) -> Result<Settlement, Error>;

// session path — escrow now, settle later
fn lock(authorization: UptoAuthorization) -> Result<BytesN<32>, Error>;
fn settle(id: BytesN<32>, settled: i128) -> Result<Settlement, Error>;
fn reclaim(id: BytesN<32>) -> Result<i128, Error>;

// views
fn lock_of(id: BytesN<32>) -> Option<Lock>;
fn is_consumed(id: BytesN<32>) -> bool;
```

`settled = 0` is valid and means the payer is made whole: a metered call that
produced nothing owes nothing.

### One-shot path

Used for a single HTTP request. The payer never submits a transaction.

1. Client selects an `accepts` entry, builds the authorization, signs the entry,
   and sends it in `X-PAYMENT`.
2. Resource server serves the request and measures usage.
3. Facilitator submits `settle_signed(authorization, settled)`, attaching the
   payer's signed entry and its own signature as settler.
4. In one transaction the contract consumes the id, pulls `maxAmount` into
   escrow, pays `settled` to the payee, and refunds the remainder.

The escrow round trip costs two extra token calls versus a direct transfer. That
is the price of never asking the payer to sign for more than a ceiling, and it
leaves no residue: the contract's balance returns to zero within the same
transaction.

### Session path

Used when one budget covers many metered calls — the common shape for an agent
working through a task.

1. Payer submits `lock(authorization)`, escrowing the cap. The resource server
   can now treat the budget as funded without trusting the payer to stay solvent.
2. Calls proceed against the id; the server meters cumulatively.
3. Settler submits `settle(id, total)` before `validBefore`.
4. If settlement never happens, anyone may call `reclaim(id)` after
   `validBefore` to return the cap. It is permissionless because the funds can
   only go back to the payer, so the payer never depends on a cooperative
   counterparty.

## Facilitator behaviour

### `/verify`

Return `isValid: false` with the corresponding `invalidReason` when any of the
following holds. Checks are ordered cheapest-first so a facilitator can reject
malformed payloads without touching the network.

| Check | `invalidReason` |
|---|---|
| `scheme` is not `upto`, or `network` is unsupported | `unsupported_scheme` |
| `payload.contract` differs from `extra.contract` | `invalid_payment_requirements` |
| `payee` differs from `payTo`, or `token` differs from `asset` | `invalid_payment_requirements` |
| `maxAmount` below `maxAmountRequired` | `insufficient_funds` |
| `resource` does not match the advertised requirements | `invalid_payment_requirements` |
| Ledger time outside `[validAfter, validBefore)` | `invalid_timing` |
| `signature` is not a well-formed entry matching the required tree | `invalid_signature` |
| `is_consumed(id)` is true | `invalid_payment` |
| Payer's `token` balance below `maxAmount` | `insufficient_funds` |
| Simulation of `settle_signed(authorization, 0)` fails | `invalid_payment` |

Simulating with `settled = 0` verifies authorization, escrow solvency and
replay state without committing to a price, which is the whole point of
verifying before the work is done.

### `/settle`

Submit `settle_signed(authorization, settled)` with `settled ≤ maxAmount`.
Return `txHash` on success. On failure map the contract error to
`errorReason`:

| Contract error | `errorReason` |
|---|---|
| `AlreadyConsumed` | `invalid_payment` |
| `Expired`, `NotYetValid` | `invalid_timing` |
| `AmountOutOfRange` | `invalid_amount` |
| `InvalidMaxAmount`, `InvalidValidityWindow`, `ValidityWindowTooLong`, `PayerIsPayee` | `invalid_payment_requirements` |
| host authorization failure | `invalid_signature` |
| token `transfer` failure | `insufficient_funds` |

A facilitator must never retry a failed settlement with a different `settled`
value: the first successful call consumes the id permanently, so a retry either
duplicates a charge attempt on a live id or fails on a consumed one.

## Security considerations

**Recipient binding.** Settled funds can only reach `payee`, because the payee
is part of the payload the payer authorized and the contract reads the
destination from that payload. A facilitator that substitutes a payee produces a
payload the payer's entry does not cover, and the host rejects the call.

**Single settlement.** The id is consumed before any token call. In the session
path the lock entry is removed at the same point, so a second `settle` fails
with `LockNotFound`. There is no ordering in which two settlements can occur.

**Replay.** Consumed ids are recorded in Soroban temporary storage with a TTL
covering the validity window. Temporary storage is sufficient rather than
sloppy: an id only needs remembering until `validBefore`, after which the window
check rejects it regardless. The contract caps windows at seven days, which
bounds both the TTL and how long a payer's funds can sit escrowed.

**Settler trust.** The settler decides the final amount within the cap, so the
payer's exposure is the cap, and the cap alone. This is the same trust boundary
as any metered service: the client bounds the loss, the meter is the server's.
Clients should therefore size caps per request, not per relationship.

**Rent and eviction.** Locks are persistent (funds are at stake) and are removed
on settlement or reclaim, returning their rent. Replay markers are temporary and
expire on their own. A completed authorization leaves no permanent footprint.

**Token assumptions.** The contract calls SEP-41 `transfer` and holds no
balance between transactions. It does not defend against tokens with transfer
hooks or non-standard accounting; facilitators should restrict `asset` to
audited tokens, in practice Stellar Asset Contracts.

## Open questions for the TSC

1. **Field naming.** This draft uses `settler` for the amount-naming party.
   EVM's `upto` has no equivalent because a signed amount needs no such role.
   Should the field be lifted into the shared scheme vocabulary?
2. **Session path in the HTTP layer.** `lock` / `settle` has no representation
   in the current x402 request flow. Is a multi-request session worth a scheme
   extension, or should it stay a contract-level capability?
3. **Window ceiling.** Seven days is an implementation choice, not a protocol
   constant. Should the scheme mandate a bound?
4. **Discovery.** Should `extra.contract` be replaced by a Bazaar-published
   registry entry, so clients discover the deployment rather than trust the
   resource server's response?
