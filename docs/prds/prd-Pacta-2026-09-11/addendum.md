# Addendum — Pacta PRD

PRD'nin ana anlatısına girmeyen ama downstream (mimari, story'ler, SCF başvurusu) için gereken derinlik. Teknoloji seçimleri, reddedilen alternatifler ve mekanizma kararları burada.

---

## A1. Escrow çekirdeği: alternatifler matrisi

| Seçenek | Kilitleme | Tarih kademeli otomatik iade | Çok taraflı dağıtım | İzinsiz zaman aşımı | Uzun tutma (>7 gün) | Karar |
|---|---|---|---|---|---|---|
| **Kendi kontratımız, `upto` şablon** | ✅ devralınır | ✅ yazılacak | ✅ yazılacak | ✅ `reclaim` deseni devralınır | ✅ TTL yeniden tasarlanacak | **Seçildi** |
| `contracts/upto` olduğu gibi | ✅ | ❌ `settler` serbest belirliyor | ❌ tek `payee` | ✅ var | ❌ 7 gün sınırı | Elendi |
| Trustless Work EaaS | ✅ | ❌ zaman tetikleyicisi yok | ✅ dağıtım listesi | ❌ yok | ✅ | Elendi (bkz. A2) |
| Sıfırdan yeni kontrat | — | — | — | — | — | Gereksiz; `upto` güvenlik özellikleri bedava geliyor |

### `upto`'dan devralınacaklar

`contracts/upto/src/lib.rs` şu güvenlik özelliklerini zaten çözmüş ve test etmiş durumda; Pacta kontratı bunları yeniden üretmek yerine devralır:

- **Recipient binding.** Settle edilen fon yalnızca `payee`'ye gidebilir. Pacta'da klinik + ajans + Pacta komisyonu olarak genişletilecek.
- **Tek settlement.** Bir id en fazla bir kez settle edilir; `close_lock` + `mark_consumed` deseni.
- **Replay koruması.** Tüketilmiş id penceresi içinde canlandırılamaz.
- **Deterministik id türetimi.** `sha256(domain || contract_address || payload)`. Kontrat adresinin preimage'a girmesi id'yi başka deployment'a karşı anlamsız kılıyor; `deal_id` için aynı desen kullanılacak.
- **İzinsiz kurtarma deseni.** `reclaim` bilinçli olarak permissionless: fon yalnızca payer'a dönebildiği için herkesin tetiklemesine izin vermek, payer'ı işbirlikçi karşı tarafa bağımlı olmaktan kurtarıyor. Pacta'da FR-10 (Zaman Aşımı) ve FR-12 (doğrulama düşmesi) aynı gerekçeyle izinsiz olacak.
- **Checks-effects-interactions.** State güncellemesi token transferinden önce.
- **Sıfır settlement meşru.** `upto`'da "hiçbir şey döndürmeyen metered çağrı hiçbir şey borçlu değildir". Pacta'da %0 iade kademesinin karşılığı.

### `upto`'da yeniden tasarlanacaklar

**Tutma süresi.** `MAX_VALIDITY_WINDOW_SECONDS = 7 * 24 * 60 * 60`. Yorum bunun gerekçesini açıkça yazıyor: her storage TTL'ini ağın `max_entry_ttl` değerinin rahatça altında tutmak. Pacta'da kapora rezervasyondan işlem tarihine kadar tutulacak (FR-3, 180 güne kadar), yani TTL stratejisi baştan farklı kurulmalı — her state geçişinde uzatma (`extend_ttl`) ve `max_entry_ttl` sınırına dayanma senaryosunun ele alınması. **Bu, sabiti büyütmekle çözülmez; TTL yenileme mekanizması gerekir.** Sonradan değiştirmek storage migrasyonu demek, o yüzden baştan doğru yapılmalı.

**Dağıtım arity'si.** `upto` iki çıkışlı: `settled` → payee, `refunded` → payer. Pacta dörde çıkıyor: klinik, ajans, Pacta komisyonu, hasta iadesi. `disburse` fonksiyonu genelleştirilecek ve toplamın escrow tutarını aşmadığı invariant'ı test edilecek.

**Tutarı kim belirliyor.** `upto`'da `settler.require_auth()` ve `settled` 0..=max aralığında serbest. Pacta'da bu **kaldırılıyor**: tutar İptal Politikası kademelerinden ve ledger timestamp'inden hesaplanıyor. Bu tek değişiklik, ürünün Trustless Work'ten yapısal farkı.

**State machine.** `upto`'da iki durum var (lock açık / tüketilmiş). Pacta'da yedi durum (§4.1) ve İtiraz/Hakem yolu.

---

## A2. Trustless Work neden elendi

Araştırma: `docs.trustlesswork.com` yaşam döngüsü sayfası + REST API şemaları (2026-09-11).

Yaşam döngüsü beş fazdan oluşuyor — Initiation, Funding, Milestone Updates, Approval, Release — ve **hiçbirinde zaman tetikleyicisi yok.** Roller: Service Provider, Approver, Release Signer, Dispute Resolver, Receiver. Serbest bırakma Release Signer imzası, milestone onayı Approver imzası gerektiriyor.

Tam veya kısmi iadeye giden **tek** yol Dispute Resolution. Resolver, adres ve tutar çiftlerinden oluşan bir `distributions` listesi imzalıyor (`POST /escrow/multi-release/resolve-milestone-dispute`, V2: `/escrow/multi-release/v2/resolve-dispute`). Dokümantasyon bunu bir esneklik olarak sunuyor ("replaces the older binary system — partial refunds, multi-party settlements") ve teknik olarak öyle. Ama Pacta için sorun tam burada: **esneklik bir imzaya bağlı.**

API hata dizgileri modeli doğruluyor:
- `Only the dispute resolver can execute this function`
- `Milestone not in dispute`
- `All milestones must be released or dispute-resolved before withdrawing remaining funds`

Yani izinsiz zaman aşımı yok; artık fon çekimi bile Dispute Resolver istiyor.

**Pacta için sonuç.** Bu modelde Pacta, Dispute Resolver rolünü almak zorunda. O zaman:

1. İptal Politikası zincirde çalışmaz; Pacta off-chain hesaplar ve imzalar. Hasta "sözün kod olduğunu" görmez, "Pacta'nın imzasını" görür.
2. UJ-3'ün tüm anlamı kaybolur. Ürünün iddiası "iade bir müşteri hizmetleri konuşması değil, bir fonksiyon çağrısı" — Dispute Resolver modelinde iade tam olarak bir müşteri hizmetleri konuşmasıdır.
3. FR-10'daki kliniğin no-show koruması Pacta'nın imzasına bağlanır. Pacta çevrimdışıysa veya isteksizse klinik parasını alamaz.
4. §9'daki regülasyon konumu zayıflar: Pacta dağıtım kararına yapısal olarak müdahil hale gelir, ki §10 OQ-2 zaten bunun hukuki sorumluluğunu açık soru olarak işaretliyor. Hakemliği minimuma indirmek isterken tüm akışı hakemliğe bağlamış olurduk.
5. Ekonomi: platform komisyonu + Trustless Work komisyonu, Pacta'nın %1-1,5'inin üstüne biner. €200 kaporada bu marjı yer.

**Karşı argüman ve neden yetersiz.** Boundless tur 40'ta $110.000 ile Trustless Work üstüne kurdu ve bu emsal güçlü. Ama Boundless'ın ürünü milestone bazlı fon dağıtımı — yani insan onayının *zaten* doğal olduğu bir akış. Pacta'nın ürünü ise tam tersi: insan onayını akıştan çıkarmak. Aynı primitif, zıt gereksinim.

**Ne zaman yeniden değerlendirilir.** Trustless Work zaman tabanlı otomatik serbest bırakma/iade eklerse. O zaman kendi kontratımızı sürdürme maliyeti (denetim dahil) yeniden tartılır.

---

## A3. Anlaşma başına kontrat deploy edilmemesinin gerekçesi

Tek kontrat + `persistent` storage'da `deal_id` anahtarlı kayıt seçildi. Alternatif, anlaşma başına ayrı kontrat deploy etmekti.

- **Maliyet.** Kapora €200-1.000 bandında ve komisyon %1-1,5. Anlaşma başına deploy maliyeti bu marjda anlamsız.
- **İndeksleme.** Tek kontrat adresi, tek event akışı. FR-22'deki "bir anlaşmanın tüm geçmişi `deal_id` ile tek sorguda okunabilir" gereksinimi doğrudan bundan geliyor.
- **Denetim yüzeyi.** Tek kod, tek denetim. Mainnet öncesi bağımsız denetim zorunlu (§8) ve maliyeti kontrat sayısıyla değil kod büyüklüğüyle ölçülüyor.
- **Bedeli:** TTL yönetimi kritik hale geliyor (bkz. A1, tutma süresi). Kabul edildi.

---

## A4. Anchor SEP rol dağılımı

Kliniğin off-ramp bacağı için hangi SEP ne işe yarıyor:

| SEP | Rol | v1'de |
|---|---|---|
| SEP-10 | Klinik cüzdanının anchor'a kimlik doğrulaması | Test anchor'ı ile |
| SEP-12 | Klinik KYB bilgilerinin anchor'a iletimi | Simüle |
| SEP-24 | İnteraktif çekim: USDC → yerel para, banka hesabına | Test anchor'ı ile, FR-21 |
| SEP-38 | Kur teklifi — panelde "bugün çekersen şu kadar" | Test anchor'ı ile |
| SEP-6 | Programatik çekim, otomatik günlük mutabakat | v1 dışı, ileride |

Hasta tarafındaki EUR → USDC girişi anchor kapsamı dışında; AB tarafında rampa/PSP gerekir (OQ-7).

**Ekosistem kısıtı.** LumenLoop'taki 14 anchor'ın hiçbiri Türk değil ve hiçbiri TL desteklemiyor (`docs/pacta-rakip-haritasi.md` §5). FR-21 bu yüzden "üretim anchor'ı yapılandırma ile değiştirilebilir olmalı" koşulunu taşıyor — v1 test anchor'ına bağlanıp üretimde ortak bulunduğunda değiştirilecek.

---

## A5. TheXBank ortaklık izi

LumenLoop kaydındaki iddia: "fully licensed digital finance platform, same-day crypto-to-fiat payouts, multi-currency IBAN services, cross-border payments in 25+ currencies", Türkiye merkezli.

Doğrulanmamış olanlar:
- SCF fonu **yok** — ekosistemde fonlanmamış tek dikkat çekici Türk projesi.
- Electric Capital'ın 9.027 repoluk taksonomisinde **hiç repo kaydı yok** → teknik olgunluk ve açık kaynak ayak izi bilinmiyor.
- Stellar anchor'ı olarak SEP-24 uyguluyor mu, yoksa Stellar'ı yalnızca ray olarak mı kullanıyor — belirsiz. Anchor etiketi taşımıyor.

**Aksiyon:** teknik olgunluk ve ortaklık iştahı araştırılacak. v1'i bloke etmiyor (D-5).

---

## A6. Hasta tarafında kripto neden tamamen gizli

FR-15 hastadan cüzdan kurmasını istemiyor. Gerekçe ürünün karşılaştırma çubuğunda: hasta Pacta'yı başka bir escrow ürünüyle değil **havale ile** karşılaştırıyor. Havalenin UX'i "IBAN gir, gönder". Buna karşı cüzdan kurma, seed phrase saklama veya gas kavramı getiren bir akış yarışamaz.

Bunun bedeli: v1'de hasta adresi custodial veya türetilmiş olmak zorunda, ki bu §9'daki "Pacta custody sunmuyor" kısıtıyla gerilimde. Çözüm yönü — hasta adresinin kontrat tarafında yalnızca iade hedefi olarak bağlanması ve Pacta'nın o adres üzerinde harcama yetkisi olmaması — mimari adımında netleşmeli. **Bu, mimarinin çözmesi gereken en ince nokta.**
