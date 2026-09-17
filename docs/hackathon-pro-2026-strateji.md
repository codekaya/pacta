# Pro Hackathon 2026 — Pacta / Scale Track Stratejisi
**19-20 Eylül 2026 · Grand Pera, Beyoğlu · Rise In x Stellar**
**Analiz tarihi: 12 Eylül 2026 (etkinliğe 7 gün) · Veri: LumenLoop yerel anlık görüntüsü (728 proje, 29 token, SCF turları) + Electric Capital repo taksonomisi**

> Raven MCP canlı sorgusu denendi, endpoint OAuth istedi (`HTTP 401`, `www-authenticate: Bearer realm="OAuth"`). Bu rapor Raven'ın beslediği yerel snapshot üzerinden üretildi. Canlı doğrulama için: `claude mcp add --transport http stellar-raven "https://raven.stellar.buzz/mcp"` (veya Cursor MCP ayarlarından aynı endpoint) ve ardından §7'deki kontrol listesi tekrar çalıştırılmalı.

---

## 1. Tek cümlelik sonuç

**Pacta bugünkü spesifikasyonuyla jürinin puanladığı üç şartın ikisini karşılamıyor** — ne listedeki bir ekosistem protokolüne entegrasyonu var, ne gerçek TL anchor bacağı. İkisi de PRD'de bilinçli olarak alınmış ve SCF için doğru olan kararlar; ama bu rubrik için yanlış. Ürünü değiştirmeye gerek yok, **teknik şekli ve takvimi** değiştirmek gerekiyor. Bu iki açık kapatılırsa Pacta Scale Track'te güçlü bir aday: anchor bacağı sonradan yapıştırılmış değil, ürünün doğal parçası ve saha verisi diğer Scale ekiplerinin çoğunda olmayacak bir traction anlatısı veriyor.

---

## 2. Rubrik eşlemesi — nerede duruyoruz

Handbook her iki track'i aynı üç şarta göre yargılıyor. Pacta'nın mevcut durumu:

| Şart | Handbook ne istiyor | Pacta'nın bugünkü hali | Durum |
|---|---|---|---|
| **Integration** | Eligible Integration Partners (veya tam SCF Integration List) içinden bir protokolün üstüne inşa | PRD §4.1: escrow çekirdeği kendi kontratımız; Trustless Work elendi (OQ-1). Listedeki hiçbir protokole dokunulmuyor | **KARŞILANMIYOR** |
| **Anchor / Local Payments** | "kullanıcı gerçek TL yatırıp kullanılabilir bakiye alabilmeli, ya da tersi" | PRD §4.9: v1 USDC teslimatında bitiyor, TL test anchor'ıyla **simüle** ediliyor | **KARŞILANMIYOR** |
| **Core Feature** | Entegrasyon yük taşıyıcı olmalı, ürünün yaptığı şeyin parçası | Escrow serbest bırakma → TL çıkışı ürünün belkemiği; yukarıdaki ikisi gerçek olursa otomatik karşılanır | Koşullu ✅ |

Bunun üstüne Scale Track'in iki ek teslimatı var: **mimari diyagram** ve **SCF/InstAward yol haritası**. İkisinin de hammaddesi elimizde (`docs/architecture.md` başlatıldı, `pacta-full-spec.md` §11 Faz 1-4), ama sunulabilir hale getirilmedi.

Ayrıca Scale eligibility metni açıkça şunu istiyor: *"The team should briefly state which Stellar protocol they plan to integrate with and why it creates ecosystem value."* Yani entegrasyon sadece puan değil, **başvuru koşulu.** Entegrasyonsuz bir Pacta, Scale jürisinin önünde "Genesis şeklinde bir proje" olarak okunur — kategorinin en pahalı hatası bu.

---

## 3. Neden PRD böyle karar verdi ve bu kararı nasıl koruyacağız

OQ-1 (Trustless Work) araştırması sağlam ve jüri sorusuna hazır bir cevap: Trustless Work'ün yaşam döngüsünde zaman tetikleyicisi yok, her iade Dispute Resolver imzasından geçiyor, dolayısıyla Pacta'nın İptal Politikası o modelde zincirde çalışamaz. Bu doğru ve `addendum.md` A2'de API hata dizgileriyle belgelenmiş.

Sorun kararda değil, **çerçevede.** "Kendi kontratımızı yazdık" cümlesi Scale jürisine anti-Scale duyulur. Doğru çerçeve şu:

> Kompozisyon doğru olan her yerde ekosistemi tükettik — anchor, yield, cüzdan. Kendi kontratımızı yalnızca tek bir primitifte yazdık, çünkü ekosistemin baskın escrow sağlayıcısı bizim mekaniğimizi **yapısal olarak** ifade edemiyor; işte API kanıtı. Operatörünün bile tutarı seçemediği escrow, ekosistemde yok.

Bu çerçeve tutması için §4'teki entegrasyonların gerçekten kodda olması şart. Yoksa aynı cümle bahane gibi duyulur.

Yan not: `contracts/upto` bir x402 `upto` şeması referans implementasyonu ve Workshop #1'in konusu tam olarak bu (x402 / MPP). Escrow çekirdeği zaten `upto`'dan devralınıyor (addendum A1) — bu soy bağını sunumda ve submission'da açıkça söylemek bedava puan: hem Soroban derinliği kanıtı, hem etkinliğin ana temasıyla temas.

---

## 4. Hangi entegrasyon — sıralanmış karar

Eligible listeyi Pacta'nın gerçek ihtiyaçlarına göre sıraladım. Snapshot'tan SCF geçmişleri:

| Aday | Snapshot verisi | Pacta'da yük taşıyıcı olabileceği yer | Efor | Risk |
|---|---|---|---|---|
| **DeFindex** | Şili, Financial Protocols, SCF tur 28+32, **$150.000**, "wallet'lara tasarruf hesabı" | Kapora haftalar-aylar bekliyor (FR-3'te üst sınır 180 gün) — **atıl sermaye ürünün doğasında.** Getiri Pacta komisyonunu sübvanse eder (klinik ~0 öder) veya hasta tarafı garantiyi finanse eder | Orta / Yüksek | Orta / Yüksek |
| **Privy** | Infrastructure & Services, SCF yok, "120M+ hesap, embedded wallet, Stellar Tier 2" | FR-15'in tam karşılığı: hasta e-posta ile giriyor, seed phrase görmüyor. **Addendum A6'daki "mimarinin çözmesi gereken en ince nokta"yı** (hasta adresinin custody gerilimi) çözüyor — hasta anahtarı kendi tutuyor, Pacta'nın harcama yetkisi yok, §9 regülasyon konumu güçleniyor | Düşük | Düşük |
| **Stellar Wallets Kit** | Toolkit | Klinik paneli cüzdan bağlantısı | Çok düşük | Yok |
| **Soroswap / Stellar Broker** | Soroswap: SCF 15/17/21 + Liquidity Award, **$346.750** | Yalnızca TL anchor'ının varlığı TRY-pegli bir asset ise anlamlı: USDC → TRYx yönlendirmesi çıkış bacağının parçası olur | Düşük-orta | Anchor'a bağlı |
| **Blend v2** | Financial Protocols, ABD, $50.000 (Liquidity Award) | Kliniğe kilitli kapora karşılığı avans — cazip ama escrow'un teminat olmadığı için mekanik zorlanıyor | Yüksek | Yüksek |
| **CCTP / Near Intents / Allbridge** | Allbridge SCF 20/23, $150.000 | Hastanın başka zincirden USDC ödemesi — hoş, ama kritik yolda değil | Orta | Orta |

### Karar önerisi: iki katmanlı, biri garanti biri iddialı

**Katman 1 — garanti (Cuma-Pazartesi arası, hackathon öncesi bitir): Privy + Stellar Wallets Kit.**
Frontend SDK işi, kontrata dokunmuyor, hasta akışını (UJ-1) gerçekten mümkün kılıyor ve PRD'nin kendi işaret ettiği en zayıf noktayı kapatıyor. Jüriye "yük taşıyıcı" olarak savunulur: hasta cüzdan kurmadan ödeyebiliyorsa ürünün tamamı bunun üstünde duruyor.

**Katman 2 — iddialı, iki varyantı var: DeFindex.**

- **Varyant A (önerilen, hackathonda yapılabilir): klinik hazine bacağı.** Serbest kalan USDC kliniğin hesabına düşüyor; klinik paneli "TL'ye çevir" (anchor) veya "DeFindex vault'ta tut, getiri kazan" seçeneği sunuyor. Bu zaten `pacta-full-spec.md` §5'te var: *"veya bir kısmını dolarda tutar."* DeFindex o cümleyi getiriye çeviriyor. Normal hesaptan TS SDK ile vault deposit — **kontrat-kontrat çağrısı yok**, yarım günlük iş, anchor çekimiyle aynı ekranda duruyor.
- **Varyant B (yol haritasına): escrow anaparasının kendisi vault'ta.** Escrow kontratı vault share tutar, serbest bırakma/iade anında redeem eder. Değeri çok yüksek (komisyonu sübvanse eder) ama escrow invariant'ıyla (anapara her koşulda tam geri dönebilmeli) 36 saatte oynanacak bir iş değil. SCF #46 anlatısında "Faz 2" olarak sunulur.

**Anchor bacağı pazarlık konusu değil.** Puanlanan şart, ürünün doğal parçası ve Pacta'nın en güçlü farklılaşması: hasta EUR yatırıyor, **klinik TL çekiyor** — handbook'un "ya da tersi" dediği yön birebir bu. Diğer ekiplerin çoğu anchor'ı sonradan yapıştıracak, Pacta'da zaten belkemiği.

---

## 5. TL anchor'ı — en kritik bilinmeyen

Snapshot'ta **14 anchor var, hiçbiri Türk, hiçbiri TL desteklemiyor.** Türkiye merkezli tek on/off-ramp **TheXBank** (SCF fonu yok, anchor etiketi taşımıyor, Electric Capital'da repo kaydı yok). Token registry'de TRY-pegli hiçbir asset yok (`USTRY` var ama o Etherfuse'ın ABD hazine tahvili tokenı, Türk lirası değil). SDF'nin `testanchor.stellar.org` test anchor'ı SEP-24 sunuyor ama varlıkları SRT/USDC/XLM — TRY yok.

Yani handbook'un Workshop #3'te anlattığı "TRY anchor" **ekosistem verisinde görünmüyor**; organizatörler etkinliğe özel bir anchor getiriyor (metinde adı geçmiyor). Sonuç:

- **Bu, sadece bizim değil, tüm salonun tek darboğazı.** "Kaç ekip anchor entegrasyonu shipledi" resmen takip edilen metrik ve muhtemelen az ekip başaracak. Erken hazırlanan burada tek başına kalır.
- **Aksiyon (bugün):** organizatörlere yaz — hangi anchor, testnet/sandbox erişimi var mı, `stellar.toml`, TRY currency kodu, SEP-24 mi SEP-6 mı, KYB gerekiyor mu. Workshop 12:40'ta başlıyor; anchor'ı Cumartesi öğlen öğrenip 36 saatin yarısını kaybetmek en pahalı senaryo.
- **Yedek plan:** anchor gelmezse/erişim çıkmazsa, `testanchor.stellar.org` üzerinde gerçek SEP-10 + SEP-24 + SEP-38 akışını çalıştır (gerçek interaktif akış, gerçek durum geçişleri, sadece varlık TRY değil) ve sunumda "üretim anchor'ı config ile değişiyor" diye göster — FR-21 bu koşulu zaten taşıyor. Simülasyondan çok daha güçlü, gerçek TL'den zayıf.

---

## 6. En büyük teslim riski: takvim, kod değil

Bugün 12 Eylül. Repoda **yalnızca `contracts/upto` var** (976 satır, testli) — Pacta kontratı yok, frontend yok, klinik paneli yok. `pacta-10-gun-saha-plani.md` 10 günün tamamını sahaya veriyor ve "Hackathon (19-20 Eylül): Kod" diyor. Yani plan, 7 durumlu escrow kontratını + iki arayüzü + entegrasyonları + anchor'ı 36 saate sıkıştırıyor.

**Genesis için bu doğru olabilir, Scale için yanlış.** Genesis "net-new product, built from scratch" diyor; Scale ise "teams past the first-prototype stage" ve "compose on top of what the ecosystem already has". Scale'de hackathon öncesi kod meşru ve **beklenen.** Dolayısıyla:

| Pencere | Ne yapılmalı |
|---|---|
| **12-18 Eylül (7 gün)** | Escrow kontratı (kapsamı §6.1'e göre kısılmış) + testler + testnet deploy; hasta ödeme sayfası ve klinik panelinin iskeleti; Privy/Wallets Kit bağlantısı; anchor sandbox erişimi. Saha çalışması paralel devam eder — mesajlaşma toplu iş, görüşmeler öğleden sonra. |
| **19-20 Eylül (36 saat)** | Anchor SEP-10/24/38 bacağı, DeFindex (Varyant A), QR çift onay akışı, demo senaryolarının provası, mimari diyagram, SCF yol haritası slaytı, submission. |

Bu takas yapılmazsa en olası sonuç şu: gece 03:00'te kontrat yazılıyor, anchor bacağı yetişmiyor, yani **ödülü belirleyen şart teslim edilemiyor.**

### 6.1 Kontrat kapsam kesintisi (7 günde bitmesi için)

- **Durumlar:** `Created` → `Funded` → (`Released` | `Refunded` | `Expired`). `Disputed`/`Resolved` hackathon dışı — PRD §6.2 zaten hakem arayüzünü MVP dışında tutuyor; kontratta da erteleyip "tasarımı bitmiş, yeri hazır" diye sunmak tutarlı.
- **Fonksiyonlar:** `create_deal`, `fund`, `confirm_arrival` (çift auth), `cancel` (politika zincirde), `expire` (permissionless). Beş fonksiyon, dört durum.
- **Dağıtım:** klinik + ajans + Pacta komisyonu + hasta artığı, toplamın escrow'u aşmadığı invariant testiyle (addendum A1, dağıtım arity'si).
- **TTL:** 180 güne göre baştan tasarla. Addendum A1 bunun sonradan değiştirilemeyeceğini (storage migrasyonu) açıkça yazıyor — hackathon aceleciliğine kurban edilecek yer burası değil.
- **Doğrulama:** statik `verified` listesi. Devre kesici (FR-12) hackathon dışı.

---

## 7. Hackathon öncesi doğrulama listesi

- [ ] **Organizatör sorusu:** TRY anchor kim, testnet erişimi/`stellar.toml`/currency kodu, KYB gerekiyor mu (§5)
- [ ] **Organizatör sorusu:** submission'da **birden fazla track seçilebiliyor mu** ("track(s) you are applying to" çoğul yazılmış). Scale davetlisiysek Genesis'e de girebiliyorsak ödül matematiği değişir
- [ ] **Privy'nin Stellar desteği** hangi seviyede — snapshot "Stellar Tier 2" diyor; embedded wallet + Soroban imzalama gerçekten çalışıyor mu, testnet'te doğrula
- [ ] **DeFindex testnet vault'u** var mı, `@defindex/sdk` ile deposit/withdraw testnet'te dönüyor mu
- [ ] **Resmî skill dosyalarını kur** — submission "hangi skill dosyalarını kullandınız, path ile belirtin" istiyor. Yerelde `anchors`, `defindex`, `soroswap` skill'leri **yok**: `CheesecakeLabs/stellar-anchor-skill`, DeFindex SDK ve Soroswap SDK skill'leri `skills.stellar.org`'dan çekilmeli. Kullanılan yolları baştan bir listede tut (`skills/anchors/SKILL.md`, `skills/smart-contracts/SKILL.md`, `skills/dapp/SKILL.md`, `skills/standards/SKILL.md`, `skills/agentic-payments/SKILL.md`)
- [ ] **Raven MCP'yi bağla** ve `docs/pacta-rakip-haritasi.md` ile bu raporu canlı veriyle tazele (SCF turları, yeni escrow projesi, anchor listesi)
- [ ] **Sunum şablonunun kopyasını** al ve slaytları 18 Eylül'de hazır et (jüri format tutarlılığı arıyor)

---

## 8. Lounge Day konumlanması

Scale Track'in ödülü aslında para değil: SDF ekibi + davetli VC/kurucu odası, SCF/InstAward'a sıcak giriş, Rise In referansı. Sunumun bu odaya göre kurulması gerekiyor.

**Açılışı kontrat değil saha verisi yapar.** `pacta-10-gun-saha-plani.md`'deki cümle ("son on günde 200 klinik ve ajansa ulaştık, 25'iyle konuştuk, Türkiye'de yayınlanmamış bir veri seti çıkardık") bu odada en güçlü varlık. Handbook'un "traction" tanımı da tam bu: çalışan entegrasyon + hackathon sonrası yol haritası + ürünü anlatabilen kurucu.

**Takip edilen metriklerden biri "onboarded real users."** Pacta B2B ve klinik satış döngüsü uzun; ama 36 saat içinde **gerçek bir kliniğin testnet'te gerçek bir anlaşma açması** mümkün ve bu tek hareket ekibi ayırır. En sıcak 5 klinik görüşmesinden birini bunun için ayır (saha planı Gün 8-9 zaten bu turu içeriyor).

**Hazır olması gereken jüri cevapları:**
- *"Neden Trustless Work'ün üstüne kurmadınız?"* — OQ-1 / addendum A2, API kanıtıyla. Bu soru gelecek ve cevabı elimizde belgeli.
- *"Ekosisteme değeriniz ne?"* — TL off-ramp anlatısını SCF'de henüz kimse kazanmadı; snapshot'ta Türkiye merkezli 11 fonlu proje var ama tek on/off-ramp adayı (TheXBank) fonsuz. Sağlık turizmi dikeyinde 728 projede tek kayıt `SecuRx` ve o da ödeme değil.
- *"Escrow'da altı fonlu proje var, siz neden farklısınız?"* — dikey + operatörün bile tutarı seçemediği politika-icra eden escrow. Boundless emsali (tur 40, $110.000, Trustless Work üstüne dikey) SCF'nin bu şekli fonladığını gösteriyor.
- *"Regülasyon?"* — `pacta-full-spec.md` §7 üç sütunu; Privy entegrasyonu bunu daha da sağlamlaştırıyor (hasta anahtarını kendi tutuyor).

**SCF yol haritası slaytı:** SCF #46 Integration Track, son tarih 8 Kasım 2026. Zincir üstü taahhüt metrikleri PRD §7'den birebir alınır (SM-1 escrow'a giren kapora hacmi, SM-2 tamamlanan anlaşma sayısı).

---

## 9. Değerlendirilen alternatif yollar

| Yol | Lehinde | Aleyhinde | Karar |
|---|---|---|---|
| **Pacta, mevcut PRD'yle** | Ürün anlatısı hazır, PRD/addendum derin | Puanlanan iki şart karşılanmıyor; Scale jürisine Genesis şeklinde görünüyor | **Hayır** |
| **Pacta + gerçek anchor + eligible entegrasyon** | Anchor bacağı doğal; saha verisi traction; SCF yolu net | 7 günde ön inşa şart, takvim disiplini gerektiriyor | **Öneri** |
| **Agentic payments'a pivot (`upto` üstüne x402/MPP)** | Kod var ve testli, spec yazılı, Workshop #1'in tam konusu, SDF'nin ilgi alanı | Eligible listede entegrasyon yine yok; TL anchor şartı yapıştırma olur ("agent bütçesi TL ile dolduruluyor"); saha verisi/traction anlatısı sıfır; Lounge Day'de zayıf | Hayır — ama `upto` soy bağını Pacta'da öne çıkar |
| **Genesis Track'e geç** | Daha tanıdık rubrik, 4 ödül | Ödül havuzu aynı ($7.500) ama katılım çok daha kalabalık; Lounge Day erişimi kaybedilir — asıl değer orada | Hayır (birden fazla track seçilebiliyorsa yeniden değerlendir, §7) |
| **Dikeyi bırak, jenerik escrow** | Daha geniş pazar hikâyesi | Altı SCF-fonlu escrow projesiyle aynı kulvar; rakip haritasının ana bulgusu tam tersini söylüyor | Hayır |

---

## 10. Özet — kazanır mı?

Scale Track davetli ve dar bir alan; ödül matematiği (3.500 / 2.500 / 1.500) ilk üçe girme olasılığını Genesis'ten yüksek tutuyor. Pacta'nın iki yapısal avantajı var: **anchor bacağı ürünün doğasında** (çoğu ekipte yapıştırma olacak) ve **saha verisi** (çoğu ekipte hiç olmayacak). İki yapısal riski var ve ikisi de bizim elimizde:

1. Puanlanan iki şart (eligible entegrasyon + gerçek TL anchor) kodda değil → §4 ve §5 ile kapanır.
2. Demo edilecek kod yok ve 36 saate her şey sığmıyor → §6 takvim takası ile kapanır.

Bu iki risk kapanırsa ilk üç gerçekçi, birincilik ulaşılabilir. Kapanmazsa jüri Pacta'yı "güzel anlatılmış, şartları karşılamayan proje" olarak sınıflar — ve bu, elimizdeki PRD derinliği düşünüldüğünde en can sıkıcı kaybediş biçimi olur.
