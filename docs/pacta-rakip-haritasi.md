# Pacta — Stellar Rakip Haritası
**Kaynak: LumenLoop ekosistem veritabanı (728 proje) + Electric Capital repo taksonomisi (9.027 repo) · Eylül 2026**

> Not: Bu rapor paketle gelen **yerel anlık görüntüden** üretildi. SCF tur numaraları ve ödül tutarları snapshot tarihine ait; canlı doğrulama için Raven MCP girişi yapılıp tekrar çalıştırılmalı.

---

## 1. Tek cümlelik sonuç

**Escrow primitifi Stellar'da doymuş durumda ve Trustless Work etrafında konsolide oluyor; ama sağlık turizmi dikeyi tamamen boş ve TL off-ramp'i ekosistemde hiç yok.** Pacta'nın rekabet avantajı escrow kontratını yazmakta değil, dikeye özgü katmanda.

---

## 2. Escrow oyuncuları — SCF ödülüne göre

| Proje | Kategori | SCF (tur) | Repo aktivitesi | Ne yapıyor | Pacta ile örtüşme |
|---|---|---|---|---|---|
| **Trustless Work** | Developer Tooling | **$150.000** (31, 41) | **18 repo** — `escrow-lab`, `escrow-viewer`, `clonable-backoffice`, EVM'e genişliyor; 3. parti entegrasyonları var | Soroban üstünde Escrow-as-a-Service, API ile tüketilir | **Yüksek** — Pacta'nın ihtiyaç duyduğu primitifin ta kendisi |
| **Eascrow** | Financial Protocols | $147.950 (23, 32) | **1 repo** | Web3 escrow platformu, freelancer/cross-border odaklı | Orta — jenerik escrow, dikey yok |
| **Mica** | Applications | $138.700 (16) | **1 repo** (`escrow_api`) | Escrow API | Orta — tur 16, eski |
| **The Signal** | End-User Application | $121.001 (42) | Repo listelenmemiş | ServiceFi escrow, milestone onayında serbest bırakma | Orta — B2B hizmet pazarı |
| **Centiiv** | Applications | $51.300 (36) | 1 repo | Fatura/ödeme protokolü, escrow bileşeni | Düşük |
| **Pakana.Net** | Applications | $45.200 (21) | 3 repo | Multisig P2P escrow + doküman otomasyonu (avukat/müteahhit) | Düşük-orta |
| **Boundless** | Applications | $110.000 (40) | 4 repo | Milestone bazlı fon dağıtımı — **Trustless Work API'sini kullanıyor** | Düşük (emsal olarak önemli) |

### Okuma

Altı SCF-fonlu escrow projesi var, yani kategori **doymuş** — SCF bu alana defalarca para vermiş. Ama dağılım eşit değil: Trustless Work 18 aktif repoyla açık ara önde ve etrafında bir entegrasyon ekosistemi oluşmuş (`ScaffoldRust/Ecommerce-TrustlessWork-Integration`, bağımsız POC'lar). Eascrow ve Mica ise yüksek fon almış ama tek repoluk bir görünürlükleri var — ya kapalı kaynak ya duraksamış.

Electric Capital'da "escrow" geçen 48 repo var; gürültü filtresinden sonra kalanların ezici çoğunluğu öğrenci/hackathon projesi (`freelanceEscrow`, `Escrow-dApp`, `stellar-job-escrow`...). **Freelance escrow, Stellar'da varsayılan hackathon projesi.** Bu da şunu söylüyor: jenerik escrow anlatısıyla SCF'ye gitmek zayıf bir konum.

---

## 3. En önemli bulgu: Boundless emsali

Boundless, tur 40'ta **$110.000** aldı ve kendi escrow'unu yazmadı — Trustless Work API'sini kullandı. Yani SCF, "mevcut primitifin üstüne dikey inşa eden" projeyi fonluyor. Pacta için doğrudan uygulanabilir emsal bu.

---

## 4. Boş alanlar

**Sağlık turizmi dikeyi tamamen boş.** 728 projede sağlık + ödeme kesişiminde tek kayıt `SecuRx` ($42.400, tur 27) ve o da reçete güvenliği — ödeme değil. Hiçbir escrow projesi klinik, rezervasyon, iptal politikası veya tedavi kelimelerine dokunmuyor.

**En yakın dikey emsali `Sentinel`** (SCF fonu yok): Soroban üstünde parametrik sigorta, ilk dikeyi uçuş rötarı. Seyahat dikeyinde koşullu ödemenin çalıştığını gösteren bir emsal — ama fonlanmamış olması bu anlatının SCF'de otomatik kazanmadığını da gösteriyor.

---

## 5. En büyük risk: TL anchor'ı yok

Ekosistemde **14 anchor** var ve **hiçbiri Türk, hiçbiri TL desteklemiyor**:

Anclap (Arjantin, $572k), MYKOBO (EUR, $269k), PHP Anchor SDK (Romanya), Kulipa (UK), Pactta, idOS, Silicore, Paystreme, Usher, Outbounder, Glo Dollar, Apay, Freelii, Stellarport.

`pacta-full-spec.md` "klinik parasını Stellar anchor'ı üzerinden TL olarak alır" diyor — **bu bağımlılığın karşılığı ekosistemde mevcut değil.** Spec'in en kırılgan varsayımı bu, ve rakip analizinden çıkan en önemli aksiyon.

**Tek aday: TheXBank** (Türkiye merkezli, SCF fonu **yok**, ekosistem DB'sinde listeli): "fully licensed digital finance platform, same-day crypto-to-fiat payouts, multi-currency IBAN, 25+ para birimi." Escrow rakibi değil, **potansiyel off-ramp ortağı**. Electric Capital'da repo kaydı yok — teknik olgunluğu doğrulanmalı.

---

## 6. Türkiye sinyali — SCF lehte

SCF, Türk ekipleri düzenli fonluyor. DB'deki Türkiye merkezli fonlu projeler:

SoroSplits ($153.700), Unstoppable Wallet ($128.900), Digibank/SDP ($99.000), Noether ($86.200), Blux ($81.000), Fluxity ($68.000), Rango ($60.000), Sorodrop ($48.000), Wagent ($43.400), Soroban ELK ($35.000), The Starship Soroban ($10.000).

Türkiye merkezli ve fonlanmamış tek dikkat çekici isim TheXBank — yani TL/off-ramp anlatısı SCF'de henüz kimse tarafından kazanılmamış.

---

## 7. Farklılaşma önerisi

Üç katmanlı bir konumlanma öneriyorum:

**Escrow primitifini yazma, tüket.** Trustless Work'ün API'si üstüne kur. Boundless'ın tur 40'ta $110k ile yaptığı tam olarak bu. Kendi escrow'unu yazmak seni altı fonlu projeyle aynı kulvara sokar; onların üstüne inşa etmek seni tek başına bırakır. `contracts/upto` mevcut kontratın escrow yerine **iptal politikası state machine'i** olarak konumlanabilir.

**Gerçek moat dikeye özgü katmanda:** Sağlık Bakanlığı yetki belgesi doğrulaması (klinik rozeti), sağlık turizmine özel iptal politikası şablonları, QR ile varışta serbest bırakma akışı ve ajans/klinik dağıtım kanalı. Bunların hiçbiri Trustless Work'te yok ve hiçbir rakip dokunmuyor.

**TL off-ramp'i ürünün kritik yolundan çıkar.** Bu bağımlılığın karşılığı ekosistemde yok. İki seçenek: ya TheXBank ile ortaklık görüşmesi yapıp bunu SCF anlatısının parçası haline getir, ya da v1'i USDC teslimatıyla sınırlayıp TL'yi yol haritasına at. Doğrulanmamış bir anchor bağımlılığı üstüne v1 kurmak en büyük teslim riski.

---

## 8. Sıradaki adım

- [ ] Raven MCP girişi yapıp bu raporu canlı veriyle tekrar doğrula (SCF turları güncel mi, yeni escrow projesi girmiş mi)
- [ ] Trustless Work API'sini teknik olarak değerlendir: iptal politikası / kısmi iade Pacta'nın ihtiyacını karşılıyor mu, yoksa kendi kontratı şart mı
- [ ] TheXBank'ın teknik olgunluğunu ve ortaklık iştahını araştır
- [ ] Bu bulgularla PRD'ye geç (`prd` skill'i / Nicole)
