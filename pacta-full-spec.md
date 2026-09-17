# Pacta — Sağlık Turizminde Kapora Escrow'u
**Uçtan uca proje dokümanı · v1 · Eylül 2026**

---

## 1. Tek cümle

Yurtdışından Türkiye'ye tedaviye gelen hastanın ödediği kaporayı, kliniğe gitmeden önce zincir üstü bir escrow sözleşmesinde tutan; önceden yazılmış iptal politikasına göre serbest bırakan veya iade eden; kliniğin parasını Stellar anchor'ı üzerinden TL olarak almasını sağlayan ödeme altyapısı.

---

## 2. Neden kapora, neden bakiye değil

Sağlık turizminde ödeme ikiye bölünüyor ve iki parçanın risk profili tamamen farklı.

**Kapora** toplamın tipik olarak %10-30'u, hasta daha uçağa binmeden ödeniyor, çoğunlukla havale / Western Union / MoneyGram üzerinden gidiyor ve neredeyse her zaman **iade edilmez** olarak sunuluyor. Hasta hiç görmediği bir kuruma, geri dönüşü olmayan bir rayla, iade garantisi olmadan para gönderiyor. Dolandırıcılık vakalarının klasik biçimi de tam bu: kaporayı al, iletişimi kes. Bu uyarıyı kliniklerin kendi web sitelerinde bile görmek mümkün.

**Bakiye** ise hasta Türkiye'ye geldikten sonra, klinikte, yüz yüze ödeniyor — büyük ölçüde nakit, ya da ek komisyonla kart. Burada hasta zaten yerinde, hizmeti görüyor, escrow'un ekleyeceği değer sınırlı.

Dolayısıyla ürünün hedefi net: **kapora.** Küçük tutarlı (€200-1.000), yüksek riskli, korumasız ve tekrarlayan bir akış.

Bu daralma aynı zamanda en sert itirazı da çözüyor. "Kart zaten chargeback ile escrow gibi çalışıyor" itirazı bakiye için geçerli olabilir; kapora için değil, çünkü kaporanın gittiği raylarda (havale, WU, MoneyGram) chargeback diye bir şey yok.

---

## 3. Kanıtlanmış problem

**Klinik tarafı — chargeback baskısı.** Temmuz 2026'da İzmir Barosu Sağlık Hukuku Komisyonu'ndan bir hukukçu, Türk klinikleri ve aracı kuruluşlarını uyardı: yabancı hasta tedaviyi tamamlayıp ülkesine döndükten sonra kart ödemesine itiraz ediyor ("bu hizmeti almadım" veya "ayıplı hizmet"), hastanın bankası Türk bankasından hizmetin verildiğinin ispatını istiyor. Sektöre verilen tavsiye: her aşamayı belgeleyin, onam formlarını saklayın. Yani bugünkü savunma bir üründen değil, arşivden ibaret.

*Not: bu tek bir hukukçunun açıklamasının çok sayıda kaynakta yayınlanmış hali; istatistiksel bir çalışma değil. İnsidans oranı bilinmiyor.*

**Hasta tarafı — kapora riski.** Hasta kliniği Instagram'da buluyor, WhatsApp'tan iletişim kuruyor, iade edilmez kaporayı havale veya WU ile yolluyor. Hiçbir aşamada tarafsız taraf yok.

**İkisinin ortak sonucu:** güvensizlik rezervasyon anında satışı öldürüyor, klinik ise kendini ancak "iade yok" diyerek koruyabiliyor — bu da hastayı daha da tedirgin ediyor. Kısır döngü.

---

## 4. Pazar

Hizmet İhracatçıları Birliği verileriyle: 2025'te 1.398.580 hasta, 3,02 milyar dolar gelir. 2026 ilk çeyrek: 302.487 hasta, 761,5 milyon dolar. Hasta sayısı yıllık %14,7 düşerken gelir %18,4 arttı; kişi başı gelir 1.815 dolardan 2.518 dolara çıktı (~%39).

**Kapora hacmi aritmetiği** (varsayım, tahmin değil): 3,02 milyar dolarlık ciroda ortalama %20 kapora oranı → yıllık ~600 milyon dolarlık kapora akışı. %1,5 komisyonla, %5 pazar payında ~450 bin dolar yıllık gelir; %20 payda ~1,8 milyon dolar. Bunlar TAM aritmetiği, gelir projeksiyonu değil — kapora oranı ve pazar payı doğrulanmamış varsayımlar.

**Trendin yönü lehte:** hasta sayısı düşerken işlem başına tutar yükseliyor. Yani her tekil ödemede riske atılan para büyüyor, escrow'un marjinal değeri artıyor.

**Segment sırası:** saç ekimi (en yüksek hacim, en standart paket, en çok Instagram/ajans trafiği) → diş → estetik cerrahi → tüp bebek. Saç ekimi ile başlanmalı çünkü ürün standart, fiyat şeffaf, işlem sayısı yüksek.

---

## 5. Kullanıcılar ve akış

### Hasta akışı
1. Kliniğin/ajansın gönderdiği Pacta ödeme linkine tıklar
2. Klinik doğrulama rozetini görür (Sağlık Bakanlığı yetki belgesi kaydı)
3. İptal politikasını **ödemeden önce** okur: hangi tarihte ne kadar iade
4. Kartla veya havaleyle euro öder → USDC'ye dönüşür → escrow'a kilitlenir
5. "€800'ünüz Pacta escrow'unda, klinikte onay verene kadar kliniğe geçmez" ekranı
6. Kliniğe vardığında QR okutur → kapora serbest bırakılır
7. İptal ederse politikaya göre otomatik iade

### Klinik akışı
1. Onboarding: yetki belgesi, vergi no, banka hesabı adı eşleşmesi, anchor KYC
2. Panelde bekleyen kaporaları görür ("€800 kilitli, varışta serbest")
3. Hasta geldiğinde QR ile onaylar
4. USDC hesabına düşer
5. Anchor üzerinden TL çeker, veya bir kısmını dolarda tutar

### Ajans akışı
Ajans hem hasta trafiğini getiriyor hem kaporayı bugün kendisi tutuyor. Pacta'da ajans **kaporayı tutmayı bırakıyor ama komisyonunu kaybetmiyor**: sözleşmede ajans komisyonu ayrı bir çıkış olarak tanımlanabilir ve serbest bırakma anında otomatik ödenir. Bu, ajansı rakip olmaktan çıkarıp dağıtım kanalına çevirir — ölçeklemenin anahtarı burada.

---

## 6. Teknik mimari

### 6.1 Bileşenler

| Katman | Ne | Teknoloji |
|---|---|---|
| Escrow çekirdeği | Kapora kilitleme, koşullu serbest bırakma, iade, itiraz | Soroban / Rust |
| Klinik kaydı | Doğrulanmış klinik listesi, yetki belgesi referansı | Soroban sözleşmesi + off-chain doğrulama |
| Ödeme girişi | Hasta EUR/GBP → USDC | Üçüncü taraf rampa / PSP (hackathonda simüle) |
| Yerel çıkış | Klinik USDC → TRY | Stellar Anchor (SEP-10/12/24/38) |
| Uygulama | Hasta ödeme sayfası, klinik paneli, QR onayı | Web, Stellar Wallets Kit |
| İndeksleme | Olay akışı, mutabakat, kanıt kaydı | Horizon + RPC event okuma |

### 6.2 Escrow sözleşmesi tasarımı

**Depolama modeli.** Anlaşma başına ayrı sözleşme deploy etmek yerine tek sözleşme + `persistent` storage'da `deal_id` anahtarlı kayıt. Sebep: deploy maliyeti, indeksleme kolaylığı, tek audit yüzeyi. Kayıtlar kısa ömürlü (haftalar) olduğu için TTL yönetimi kritik — açık anlaşmaların TTL'i her state geçişinde uzatılmalı, kapanan anlaşmalar arşive düşmeli.

**Deal state'leri:**

```
Created    → anlaşma oluşturuldu, para gelmedi
Funded     → kapora escrow'da, işlem tarihi bekleniyor
Released   → klinik (+ajans) ödendi
Refunded   → hastaya iade edildi (tam veya kısmi)
Disputed   → itiraz açık, hakem bekleniyor
Resolved   → hakem karar verdi, dağıtım yapıldı
Expired    → süre doldu, varsayılan kural işledi
```

**Kayıt alanları:** patient (Address), clinic (Address), agency (Option<Address>), agency_bps, token (SAC adresi), amount, procedure_date, funding_deadline, cancellation_policy, dispute_window, state, created_at.

**İptal politikası zincir üstünde.** Bugünkü "iade yok, bize güvenin" cümlesi yerine, ödemeden önce yazılmış ve kodda çalışan bir tablo:

```
procedure_date - 14 gün öncesine kadar iptal  → %100 iade
7-14 gün arası                                 → %50 iade
7 günden yakın                                 → %0 iade
Klinik iptal ederse / doğrulaması düşerse     → %100 iade, her zaman
```

Bu tek başına satılabilir bir özellik: klinik "iade yok" demek zorunda kalmadan kendini koruyor, hasta ise sözün kod olduğunu görüyor.

**Serbest bırakma tetikleyicisi — tasarımın en kritik kararı.**

Katmanlı model öneriyorum:

1. **Birincil: yerinde çift onay.** Hasta klinikte kliniğin QR'ını okutur, iki taraf da imzalar. En güçlü kanıt, çünkü hastanın fiziken orada olduğunu gösteriyor.
2. **Klinik koruması: zaman aşımı.** `procedure_date + N gün` sonra hasta hiçbir şey yapmamışsa (gelmemişse veya onay vermemişse) kapora politikaya göre kliniğe geçer. Bu olmazsa hasta parayı rehin alabilir ve klinik ürünü asla kullanmaz.
3. **Hasta koruması: itiraz penceresi.** Zaman aşımı işlemeden önce hasta "gittim, klinik beni kabul etmedi / klinik ortadan kayboldu" diyerek itiraz açabilir → `Disputed`.
4. **Hakem.** İlk aşamada Pacta, yayınlanmış kurallarla. Uzun vadede çok imzalı bir panel veya bağımsız hakem. Hakemin yetkisi **yalnızca** dağıtım oranını belirlemekle sınırlı; parayı kendine yönlendiremez (sözleşme kısıtı).

**Fonksiyon yüzeyi:**

```
create_deal(patient, clinic, agency, amount, procedure_date, policy) -> deal_id
fund(deal_id)                    // hasta imzası, token transfer
confirm_arrival(deal_id)         // hasta + klinik auth, → Released
cancel(deal_id)                  // hasta imzası, politikaya göre dağıtım
clinic_cancel(deal_id)           // klinik imzası, %100 iade
raise_dispute(deal_id, reason)   // hasta veya klinik, → Disputed
resolve(deal_id, split_bps)      // hakem, → Resolved
expire(deal_id)                  // izinsiz çağrılabilir, süre kontrolü zincirde
```

**Kritik tasarım kuralları:**
- Her state geçişi **event** yayınlar. Bu sadece indeksleme için değil: olay günlüğü, hukukçunun kliniklere "belgeleyin" dediği kaydın kendisi olur. Chargeback savunmasını manuel arşivden zincir üstü kanıta çeviriyorsunuz — ürünün gizli ikinci değer önerisi bu.
- `expire` fonksiyonu izinsiz (permissionless) olmalı; süre kontrolü ledger timestamp ile zincirde yapılır, dışarıdan kimse yanlış tetikleyemez.
- Soroban self-call'a izin vermiyor; token transferleri SAC üzerinden, state güncellemesi transfer öncesi (checks-effects-interactions).
- Tutarlar token biriminde (USDC 7 decimal), yuvarlama artıkları hastaya.
- Klinik adresi, kayıt sözleşmesinde `verified` değilse `fund` reddedilir.

### 6.3 Anchor entegrasyonu (SEP)

Klinik çıkışı ürünün anchor bacağı:
- **SEP-10** — klinik cüzdanıyla anchor'a kimlik doğrulama
- **SEP-12** — klinik KYB bilgilerinin anchor'a iletimi
- **SEP-24** — interaktif çekim: USDC → TRY, kliniğin banka hesabına
- **SEP-38** — kur teklifi; klinik panelde "bugün çekersen şu kadar TL" görür
- **SEP-6** — programatik çekim; ileride otomatik günlük mutabakat için

Hasta tarafındaki EUR → USDC girişi Türk anchor'ının kapsamı dışında. Üretimde AB tarafında bir rampa/PSP gerekir; hackathonda simüle edilir ve bu açıkça söylenir.

### 6.4 Doğrulama katmanı

Bu opsiyonel değil, ürünün meşruiyeti buna bağlı. "Kart alamayan klinikler zaten şüpheli, siz onları meşrulaştırıyorsunuz" itirazının tek cevabı:

- Sağlık Bakanlığı uluslararası sağlık turizmi **yetki belgesi** kaydının kontrolü
- Vergi numarası ve ticaret sicil doğrulaması
- Banka hesabı sahibi adının klinik tüzel kişiliğiyle eşleşmesi (şahsi hesaba ödeme kabul edilmez)
- Anchor'ın kendi KYB süreci (ikinci katman)
- Zincirde `verified` bayrağı; hasta ödeme sayfasında rozet olarak görünür

Doğrulaması düşen klinikte açık tüm anlaşmalar otomatik `%100 iade` yoluna girer.

---

## 7. Regülasyon konumu

- Hasta **yurtdışında** ödüyor; tahsilat Türkiye'de doğmuyor
- Escrow'da para **sözleşmede**, Pacta'da değil → saklama (custody) hizmeti sunulmuyor, KVHS lisans kapsamına girilmiyor
- Klinik parayı **TL olarak lisanslı anchor'dan** alıyor → yurtiçinde kripto ile hizmet bedeli ödenmiyor, 2021 yasağı tetiklenmiyor
- Kripto→TL dönüşümü SPK lisanslı tarafta gerçekleşiyor
- 2024 tarihli düzenleme ve süregelen MiCA uyumlulaştırması bu yolu tanımlı hale getirdi

**Açık hukuki soru:** hakem rolünün sorumluluğu. Pacta dağıtım kararına müdahil olduğu anda bir yükümlülük doğuyor mu? Avukat görüşü alınmalı; alternatif tasarım, hakemliği tamamen kural tabanlı ve otomatik yapıp insan kararını minimuma indirmek.

---

## 8. İş modeli

**Komisyon:** escrow'a giren kapora üzerinden %1-1,5, **klinik öder.** Kliniğin bugünkü alternatifi %2,5-4 kart komisyonu + chargeback riski + belgeleme yükü, ya da havale/nakit + no-show riski. Hasta hiçbir şey ödemez — ürünü kabul etmesinin önündeki sürtünme sıfır olmalı.

**İkincil gelirler (ileride):** ajans komisyon dağıtımı hizmeti, kliniğe dolarda tutma/hazine özelliği, doğrulama rozetinin pazarlama değeri.

**Kliniğin ekonomik gerekçesi tek cümlede:** kart komisyonundan ucuz, havaleden güvenli, ve "iade yok" demek zorunda kalmadığı için daha çok rezervasyon kapatıyor.

---

## 9. Rakipler ve konumlanma

| Kim | Ne yapıyor | Açığı |
|---|---|---|
| Havale / WU / MoneyGram | Kaporanın bugünkü rayı | Sıfır koruma, geri dönüşsüz |
| Kredi kartı | Bakiye ödemesinde, chargeback ile | Kaporada çoğunlukla yok; klinikte ek ücretli; kliniği savunmasız bırakıyor |
| Ajanslar | Kaporayı kendileri tutuyor | Tarafsız değil, kliniğin ödeme yaptığı taraf |
| Bookimed / Flymedi / Medigo | Hasta-klinik aracılığı | Parayı gerçekten tutuyorlar mı — **doğrulanmadı, kritik** |
| Genel escrow (Escrow.com vb.) | Escrow | Bu tutar ve hızda ekonomik değil, TL çıkışı yok |

**Kopyalanamazlık:** Tarafsızlık eklenebilir bir özellik değil, yapısal bir konum. Ajans tarafsız olamaz çünkü geliri klinikten. Kart ağı iki taraflı itiraz süreci kuramaz. Klinik kendi escrow'unu kuramaz çünkü mesele zaten kliniğe güvenilmemesi.

---

## 10. Hackathon kapsamı (36 saat)

**Yapılacak:**
1. Escrow sözleşmesi testnet'te: `create_deal`, `fund`, `confirm_arrival`, `cancel`, `expire` + iptal politikası + event yayını
2. Hasta ödeme sayfası: klinik rozeti, iptal politikası tablosu, ödeme
3. Klinik paneli: bekleyen kaporalar, QR üretimi, çekim başlatma
4. QR ile yerinde çift onay akışı
5. **Anchor entegrasyonu: SEP-24 ile USDC → TRY çekimi, gerçek işlem durumlarıyla**
6. Explorer linkleriyle her adımın doğrulanabilir olması

**Simüle edilecek ve bu açıkça söylenecek:** hastanın EUR → USDC girişi, Sağlık Bakanlığı kayıt sorgusu (statik liste), fiat mutabakatının tamamlanması.

**Yapılmayacak:** hakem arayüzü, çoklu klinik onboarding, mainnet.

**Demo anlatısı:** hasta €800 öder → escrow'da kilitlenir → klinik panelde görür ama dokunamaz → hasta gelir, QR okutur → serbest bırakılır → klinik anchor'dan TL çeker. Sonra ikinci senaryo: hasta 20 gün önce iptal eder → sözleşme otomatik %100 iade eder.

---

## 11. Hackathon sonrası yol haritası

**Faz 1 (0-2 ay):** 15-20 klinik ve ajans görüşmesi; kapora oranı, ödeme rayı ve iptal politikası verisi; 2-3 pilot klinik LOI'si.
**Faz 2 (2-4 ay):** doğrulama katmanı, gerçek anchor entegrasyonu, güvenlik denetimi, mainnet.
**Faz 3:** SCF Integration Track başvurusu (#46 son tarih 8 Kasım 2026) — zincir üstü metrik olarak escrow'a giren kapora hacmi ve tamamlanan anlaşma sayısı taahhüt edilir.
**Faz 4:** aynı ürün Tayland, Meksika, Macaristan koridorlarına; kapora escrow'u dünyanın her sağlık turizmi pazarında aynı problemi çözüyor.

---

## 12. Açık riskler

**Doğrulanmamış varsayımlar:**
- Kaporaların ne kadarı havale/WU ile ödeniyor, ne kadarı kartla? Hepsi buna bağlı.
- Hasta tanımadığı bir escrow'a €800 emanet eder mi? Havaleye karşı üstünlük net, ama "tanınmayan marka" engeli gerçek.
- Klinikler no-show korumasından vazgeçmeden iade politikası yazmayı kabul eder mi?
- Bookimed/Flymedi parayı zaten tutuyorsa konumlanma değişir.

**Yapısal riskler:**
- Hakem rolünün hukuki sorumluluğu netleşmedi
- Chargeback insidansı bilinmiyor → kliniğin ödeme isteği belirsiz
- Ajans direnci: kaporayı tutmak ajansın nakit akışı avantajı olabilir; komisyon otomasyonu bunu telafi etmezse kanal kapanır
- Ölçek klinik başına satışa bağlı; ajans kanalı çalışmazsa büyüme yavaş

**Ölüm senaryosu:** görüşmelerde klinikler "kaporayı kartla alıyoruz ve chargeback nadir" derse ürünün gerekçesi kalmaz. Bu durumda pivot yönü: kliniğin chargeback savunmasını otomatikleştiren zincir üstü kanıt/belgeleme ürünü.
