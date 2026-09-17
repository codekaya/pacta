# Pacta · anchor bacağı (USDC ⇄ TL)

Kliniğin serbest kalan kaporayı TL olarak banka hesabına çekmesi — PRD FR-21.
Stellar SEP standartlarıyla yazıldı; şu an testnet'teki
[TR Mock Anchor](https://tr-mock-anchor.fly.dev/sep)'a bağlı. Üretim anchor'ına
geçerken yalnızca `STELLAR_NETWORK` ve `ANCHOR_HOME_DOMAIN` değişir: endpoint'ler,
imza anahtarı ve USDC issuer'ı `stellar.toml`'dan keşfedilir, kodda sabit yok.

## Çalıştırma

```bash
cd anchor
npm install
npm run demo        # onramp + offramp, gerçek testnet işlemleriyle (~1 dk)
```

| Komut | Ne yapar |
|---|---|
| `npm run wallet` | Klinik cüzdanı: üretir (`.wallet.json`), Friendbot'la fonlar, USDC trustline açar |
| `npm run quote -- 25` | SEP-38: "bugün 25 USDC çekersen şu kadar TL" — girişsiz |
| `npm run onramp -- 200` | TL → USDC. Cüzdanı test USDC'siyle doldurur (escrow'dan gelecek parayı temsil eder) |
| `npm run offramp [-- 4]` | USDC → TL, kliniğin IBAN'ına. Tutar verilmezse tüm bakiye |
| `npm run history` | Anchor'daki SEP-6 işlem geçmişi |

Ayarlar `.env.example`'da. `CLINIC_IBAN` verilirse SEP-12 ile anchor'a iletilir
ve TL oraya ödenir; verilmezse anchor sandbox IBAN'ı kullanır.

## Klinik çekim akışı (offramp)

1. **SEP-1** — `stellar.toml` okunur; ağ parolası yapılandırmayla eşleşmezse durulur.
2. **SEP-10** — challenge alınır, anchor'ın `SIGNING_KEY`'i ile imzalandığı, alan adı
   ve zaman penceresi doğrulanır, klinik anahtarıyla imzalanıp JWT alınır.
3. **SEP-12** — klinik KYB'si ve ödeme IBAN'ı.
4. **SEP-38** — kesin kur teklifi (`quote_id`): panelde "bugün çekersen şu kadar TL".
5. **SEP-6** `withdraw-exchange` — teklif bağlanır; anchor treasury adresi + `memo id` döner.
6. **Stellar** — USDC, memo ile treasury'ye gönderilir.
7. **SEP-6** `transaction` — `completed` olana kadar izlenir; `external_transaction_id`
   FAST banka referansıdır.

## Kod

```
src/config.ts   ağ + anchor yapılandırması (FR-21: tek yerden değişir)
src/sep.ts      SEP-1/10/12/38/6 istemcisi — AnchorClient (girişsiz), AnchorSession (JWT)
src/chain.ts    Horizon: fonlama, trustline, bakiye, memo'lu ödeme
src/sandbox.ts  yalnızca testnet: "bankayı oyna" (üretimde karşılığı yok)
scripts/cli.ts  yukarıdaki komutlar
```

`src/` Node'a özgü API kullanmaz (`fetch`, `atob`), klinik paneli doğrudan
import edebilir. İmza `SignXdr` üzerinden soyutlandı: script'te `Keypair`,
tarayıcıda Freighter / Stellar Wallets Kit — anahtar cüzdandan çıkmaz.

## Gerçek olan / simüle olan

| Parça | |
|---|---|
| Stellar ödemeleri, trustline, memo eşleşmesi | Gerçek (testnet USDC) |
| SEP-10 imza doğrulaması, SEP-6/12/38 protokolü | Gerçek |
| USD/TRY kuru | Gerçek, gösterge (Reflector oracle + 50 bps spread) |
| Gelen TL havalesi | Simüle — `simulateBankTransfer` |
| IBAN'a TL ödemesi | Simüle FAST |
| KYB | Simüle — kişisel veri istenmez, her PUT onaylanır |

## PRD'den sapma: SEP-24 değil SEP-6

FR-21 SEP-24 (anchor'ın açtığı interaktif pencere) diyor; bu anchor yalnızca
SEP-6 (programatik) konuşuyor. Pacta zaten kendi klinik panelini kurduğu için
SEP-6 daha uygun: IBAN, kur ve durum ekranı panelin içinde kalır, klinik
üçüncü taraf bir pop-up görmez. Aynı SEP-6 akışı ileride otomatik günlük
mutabakatın da temeli (addendum A4'te "v1 dışı" duruyordu).

## Üretime geçiş

Değişen: ağ parolası (public), anchor alan adı, USDC issuer (toml'dan gelir),
gerçek KYB (SEP-12 alanları), gerçek banka rayı (`simulateBankTransfer` kalkar),
daha kısa ömürlü teklifler, 429/503 ve katman limitleri. Değişmeyen: bu kod.
Tek bağımlılık: hedef anchor'ın SEP-6 desteklemesi.
