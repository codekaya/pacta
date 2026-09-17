/**
 * Politika Taahhüt Kontratı'nı testnet'e yükler ve kurar.
 *
 *   cargo build -p pacta-policy --target wasm32v1-none --release
 *   npm run deploy:policy
 *
 * Operatör = pactaRelease anahtarı (web/.tw-wallets.json). Kontrat adresini
 * .env.local'a PACTA_POLICY_CONTRACT olarak yazar.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { Address, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder, hash, rpc, xdr } from '@stellar/stellar-sdk';

const WASM = new URL('../../target/wasm32v1-none/release/pacta_policy.wasm', import.meta.url);
const WALLETS = new URL('../.tw-wallets.json', import.meta.url);
const ENV_FILE = new URL('../.env.local', import.meta.url);
const RPC_URL = 'https://soroban-testnet.stellar.org';

const server = new rpc.Server(RPC_URL);
const operator = Keypair.fromSecret(JSON.parse(readFileSync(WALLETS, 'utf8')).pactaRelease);

async function submit(op: xdr.Operation): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const source = await server.getAccount(operator.publicKey());
  const built = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(op)
    .setTimeout(60)
    .build();
  const tx = await server.prepareTransaction(built);
  tx.sign(operator);
  const sent = await server.sendTransaction(tx);
  if (sent.status === 'ERROR') throw new Error(`send failed: ${JSON.stringify(sent.errorResult)}`);
  const done = await server.pollTransaction(sent.hash, { attempts: 30 });
  if (done.status !== rpc.Api.GetTransactionStatus.SUCCESS) throw new Error(`tx ${sent.hash} ${done.status}`);
  return done as rpc.Api.GetSuccessfulTransactionResponse;
}

const wasm = readFileSync(WASM);
console.log(`▸ upload ${wasm.length} bytes`);
await submit(Operation.uploadContractWasm({ wasm }));

console.log(`▸ create, operator ${operator.publicKey()}`);
const created = await submit(
  Operation.createCustomContract({
    address: new Address(operator.publicKey()),
    wasmHash: hash(wasm),
    salt: randomBytes(32),
    constructorArgs: [new Address(operator.publicKey()).toScVal()],
  }),
);
const contractId = Address.fromScVal(created.returnValue!).toString();
console.log(`✓ ${contractId}\n  https://stellar.expert/explorer/testnet/contract/${contractId}`);

const env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
if (!env.includes('PACTA_POLICY_CONTRACT=')) {
  appendFileSync(ENV_FILE, `${env && !env.endsWith('\n') ? '\n' : ''}PACTA_POLICY_CONTRACT=${contractId}\n`);
  console.log('  → web/.env.local');
}
