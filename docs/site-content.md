# Pacta — Site içeriği, taslak v1

Sitenin tüm metni burada; henüz hiçbir şey kodlanmadı. Onaylandığında sayfaya
olduğu gibi aktarılacak.

**Kararlar (2026-10-13):** EN + TR · iletişim yalnızca WhatsApp · kurallar sade
dille ve sözlükle · animasyon: hero'da yaşayan bildirim kartı.

**Nasıl okunur:**
- Her blokta önce İngilizce, sonra Türkçe metin var.
- `[ÖNERİ]` henüz verilmemiş bir ürün kararını işaretler. Bir varsayılan
  öneriyorum, sen onaylar ya da değiştirirsin. Tam liste §6'da.
- `{WHATSAPP}` WhatsApp Business numarası; henüz gelmedi.

---

## 0. Tüm sitede ortak

### Menü
| EN | TR |
|---|---|
| How it works | Nasıl çalışır |
| Clinics | Klinikler |
| Agencies | Ajanslar |
| Patients | Hastalar |
| Pricing | Ücretler |
| Rules | Kurallar |
| **Join the pilot** (buton) | **Pilota katıl** (buton) |
| EN · TR (dil seçici) | EN · TR |

### WhatsApp
- Her sayfada sağ altta sabit buton. Etiket: **Chat on WhatsApp** / **WhatsApp'tan yazın**
- Hazır mesaj:
  - EN: "Hi Pacta, I'd like to learn more about the pilot."
  - TR: "Merhaba Pacta, pilot hakkında bilgi almak istiyorum."

### Footer
- EN: Medical-travel deposits, held in escrow until the patient walks in.
- TR: Sağlık turizmi kaporaları, hasta kliniğe gelene kadar escrow'da.
- Sütunlar: Product (How it works, Clinics, Agencies, Patients, Pricing) · Rules (Plain rules, Glossary) · Demo (Clinic desk, Patient notice, Source code)
- En alt satır: © 2026 Pacta · Built on Stellar · Running on testnet

---

## 1. Ana sayfa

### 1.1 Hero
**EN**
- Küçük etiket: Deposit escrow for medical travel
- Başlık: The deposit stays put *until your patient walks in.*
- Metin: Patients pay the deposit into escrow, not into your account. The refund rules are fixed before they pay, and you're paid in Turkish lira when they arrive.
- Butonlar: **Join the pilot** · Chat on WhatsApp
- Güven satırı: Running on Stellar testnet · Escrow by Trustless Work · Open source

**TR**
- Küçük etiket: Sağlık turizmi için kapora escrow'u
- Başlık: Kapora, *hastanız kliniğe gelene kadar* güvende kalır.
- Metin: Hasta kaporayı sizin hesabınıza değil, escrow'a öder. İade kuralları ödemeden önce sabitlenir. Hasta geldiğinde ödemeniz Türk lirası olarak hesabınıza geçer.
- Butonlar: **Pilota katıl** · WhatsApp'tan yazın
- Güven satırı: Stellar testnet'te çalışıyor · Escrow: Trustless Work · Açık kaynak

### 1.2 Yaşayan kart (animasyon A)
Kart 4 durum arasında kendiliğinden geçer, her biri yaklaşık 3 saniye. Altında 4 parçalı bir ilerleme çubuğu var; üzerine gelince durur. "Hareketi azalt" ayarı açık kullanıcılar 2. durumda sabit bir kart görür.

| # | EN | TR |
|---|---|---|
| 1 | Deposit due · €800 · "Refund if you cancel: shown below" | Kapora bekleniyor · €800 · "İptal ederseniz iade: aşağıda" |
| 2 | Held in escrow 🔒 · "Refund rules written on-chain" | Escrow'da 🔒 · "İade kuralları zincire yazıldı" |
| 3 | Patient checked in ✓ · "Confirmed by clinic and patient" | Hasta giriş yaptı ✓ · "Klinik ve hasta onayladı" |
| 4 | Paid to the clinic · ₺42,113.27 · "To IBAN, at a locked rate" | Kliniğe ödendi · ₺42.113,27 · "IBAN'a, sabitlenmiş kurla" |

### 1.3 Siz kimsiniz? (üç kart)
| EN | TR |
|---|---|
| **I run a clinic** — Take deposits patients aren't afraid to send. → | **Kliniğim var** — Hastaların göndermekten çekinmediği kaporalar alın. → |
| **I run an agency** — Keep your commission without holding the money. → | **Ajansım var** — Parayı tutmadan komisyonunuzu alın. → |
| **I'm a patient** — See what you get back before you pay. → | **Hastayım** — Ödemeden önce ne kadar geri alacağınızı görün. → |

### 1.4 Sorun
**EN**
- Etiket: The problem
- Başlık: The deposit is *where trust breaks.*
- Metin: 1.4 million people travelled to Türkiye for treatment in 2025. Most were asked to pay 10–30% up front, by bank transfer, to a clinic they found online. It's non-refundable, there's no chargeback, and nobody stands in between. Patients hesitate, and clinics lose bookings.
- Rakamlar:
  - **1.4M** — health tourists in Türkiye, 2025
  - **$3.02B** — spent on treatment
  - **10–30%** — paid up front as a deposit
- Kaynak: HİB (Turkish Services Exporters' Association), 2025

**TR**
- Etiket: Sorun
- Başlık: Güven *kaporada kırılıyor.*
- Metin: 2025'te 1,4 milyon kişi tedavi için Türkiye'ye geldi. Çoğundan, internette bulduğu bir kliniğe havaleyle %10–30 kapora göndermesi istendi. Kapora iade edilmiyor, itiraz (chargeback) hakkı yok, arada tarafsız kimse yok. Hasta tereddüt ediyor, klinik rezervasyon kaybediyor.
- Rakamlar:
  - **1,4 milyon** — 2025'te Türkiye'ye gelen sağlık turisti
  - **3,02 milyar $** — tedaviye harcanan
  - **%10–30** — önden istenen kapora
- Kaynak: Hizmet İhracatçıları Birliği (HİB), 2025

### 1.5 Nasıl çalışır (4 adım)
| # | EN | TR |
|---|---|---|
| 1 | **Send a link.** Write the notice: procedure, date, amount and refund schedule. Send it on WhatsApp like any appointment. | **Link gönderin.** Bildirimi yazın: işlem, tarih, tutar ve iade takvimi. Randevu gönderir gibi WhatsApp'tan iletin. |
| 2 | **The patient pays into escrow.** The refund schedule is written on-chain first, then the deposit is locked. You can see it, but you can't spend it yet. | **Hasta escrow'a öder.** Önce iade takvimi zincire yazılır, sonra kapora kilitlenir. Siz görürsünüz ama henüz harcayamazsınız. |
| 3 | **Check in.** When the patient arrives, your desk taps "arrived" and the patient confirms on their phone. | **Giriş onayı.** Hasta geldiğinde resepsiyon "geldi" der, hasta telefonundan onaylar. |
| 4 | **Get paid in lira.** The deposit is released to you in Turkish lira, at a rate locked before the transfer. | **Lira olarak tahsil edin.** Kapora, transferden önce sabitlenen kurla Türk lirası olarak hesabınıza geçer. |

### 1.6 Klinikler için
**EN**
- Başlık: More bookings. *No "non-refundable" small print.*
- Metin: Patients pay faster when they can see the refund rules. You still decide those rules, and once the patient pays, nobody can change them.
- Maddeler:
  - Every deposit is visible the day it's paid
  - One tap to check a patient in
  - Paid to your IBAN in lira, so your team never touches crypto
  - A late cancellation follows the schedule you set
- Buton: See the clinic desk →

**TR**
- Başlık: Daha çok rezervasyon. *"İade edilmez" ibaresi olmadan.*
- Metin: İade kurallarını gören hasta daha hızlı öder. Kuralları yine siz belirlersiniz, hasta ödedikten sonra kimse değiştiremez.
- Maddeler:
  - Her kaporayı ödendiği gün görürsünüz
  - Tek dokunuşla hasta girişi
  - Ödeme IBAN'ınıza lira olarak gelir, ekibiniz kriptoya hiç dokunmaz
  - Geç iptalde sizin belirlediğiniz takvim geçerli olur
- Buton: Klinik ekranını görün →

### 1.7 Ajanslar için
**EN**
- Başlık: Keep your commission. *Stop holding the money.*
- Metin: Today agencies carry the trust for every deposit without being paid for it. With Pacta the deposit sits in escrow, and your share is written into the deal from the first day.
- Maddeler:
  - Your commission is part of every notice
  - The same rules and the same link across all your clinics
  - No more moving deposits between accounts
- Not (küçük yazı): On arrival your share is recorded on-chain and paid by the clinic. Paying it straight from escrow is next on our list.

**TR**
- Başlık: Komisyonunuzu alın. *Parayı tutmayı bırakın.*
- Metin: Bugün ajanslar her kaporanın güven yükünü taşıyor ama bunun karşılığını almıyor. Pacta'da kapora escrow'da durur ve sizin payınız ilk günden anlaşmaya yazılır.
- Maddeler:
  - Komisyonunuz her bildirimin parçası
  - Tüm klinikleriniz için aynı kurallar, aynı link
  - Hesaplar arası kapora transferine son
- Not (küçük yazı): Hasta geldiğinde payınız zincire kaydedilir ve klinik tarafından ödenir. Doğrudan escrow'dan ödenmesi sıradaki geliştirmemiz.

### 1.8 Hastalar için
**EN**
- Başlık: Know what you get back *before you pay.*
- Maddeler:
  - Your deposit is held in escrow, not by the clinic
  - The refund for every date is shown before you pay, and it can't be changed afterwards
  - If the clinic cancels, you get everything back
  - No account, no crypto wallet: just the link the clinic sent you
- Buton: See an example notice →

**TR**
- Başlık: Ödemeden önce *ne kadar geri alacağınızı bilin.*
- Maddeler:
  - Kaporanız klinikte değil, escrow'da tutulur
  - Her tarih için iade tutarı ödemeden önce gösterilir ve sonradan değiştirilemez
  - Klinik iptal ederse tamamını geri alırsınız
  - Hesap ya da kripto cüzdan gerekmez, kliniğin gönderdiği link yeterli
- Buton: Örnek bildirimi görün →

### 1.9 İade simülatörü (olduğu gibi kalıyor)
- EN: Refunds *anyone can check.* — Pick a schedule and move the cancellation day.
- TR: Herkesin kontrol edebildiği *iade kuralları.* — Bir takvim seçin, iptal gününü değiştirin.

### 1.10 Ücretler
**EN**
- Başlık: 1–1.5% per deposit. *Free for patients.*
- Altında: No fees during the pilot. `[ÖNERİ]`
- Kartlar: Bank transfer / Western Union · Card (2.5–4% + chargebacks) · **Pacta 1–1.5%**

**TR**
- Başlık: Kapora başına %1–1,5. *Hastaya ücretsiz.*
- Altında: Pilot süresince ücret yok. `[ÖNERİ]`
- Kartlar: Havale / Western Union · Kart (%2,5–4 + chargeback) · **Pacta %1–1,5**

### 1.11 Altyapı (kısa)
- EN: Built on Stellar. *Held by a contract, not by us.* — Escrow (Trustless Work) · Refund rules (policy contract) · Lira payout (anchor). Link: "Read the plain rules →"
- TR: Stellar üzerinde. *Parayı biz değil, kontrat tutar.* — Escrow (Trustless Work) · İade kuralları (politika kontratı) · Lira ödemesi (anchor). Link: "Kuralları okuyun →"

### 1.12 SSS (5 soru; ayrıntılar §3'te)
| EN | TR |
|---|---|
| Do we need to handle crypto? — No. You see euros, a rate and your IBAN. | Kripto ile uğraşmamız gerekiyor mu? — Hayır. Euro, kur ve IBAN görürsünüz. |
| Does the patient need a wallet? — No. The link is enough. | Hastanın cüzdanı olması gerekiyor mu? — Hayır, link yeterli. |
| Who decides a refund? — The schedule you wrote, enforced by the contract. | İadeye kim karar veriyor? — Sizin yazdığınız takvim; kontrat uygular. |
| What if the clinic cancels? — The patient gets everything back. | Klinik iptal ederse? — Hasta tamamını geri alır. |
| Is it live? — On testnet, with real transactions and no real money. Mainnet after the pilots and an audit. | Canlı mı? — Testnet'te: işlemler gerçek, para gerçek değil. Mainnet pilotlar ve güvenlik denetiminden sonra. |

### 1.13 Kapanış çağrısı
**EN**
- Başlık: Join the pilot.
- Metin: We're onboarding our first agency and clinic in İstanbul, starting with hair transplant and dental. Setup takes one 20-minute call.
- Butonlar: **Join the pilot** · Chat on WhatsApp

**TR**
- Başlık: Pilota katılın.
- Metin: İstanbul'da ilk ajans ve kliniğimizi alıyoruz; saç ekimi ve diş ile başlıyoruz. Kurulum 20 dakikalık tek bir görüşme.
- Butonlar: **Pilota katıl** · WhatsApp'tan yazın

---

## 2. Pilot sayfası (`/pilot`)

### 2.1 Giriş
**EN**
- Başlık: Join the Pacta pilot
- Metin: Four short steps, about 3 minutes. Your answers also help us understand how deposits really work in medical travel.
- Kutu, "Pilot nedir":
  - Runs on Stellar testnet, so no real money moves
  - Your own procedures and refund schedules
  - A clinic desk your team can use
  - No fees during the pilot `[ÖNERİ]`

**TR**
- Başlık: Pacta pilotuna katılın
- Metin: 4 kısa adım, yaklaşık 3 dakika. Cevaplarınız, sağlık turizminde kaporanın gerçekte nasıl işlediğini anlamamıza da yardım ediyor.
- Kutu, "Pilot nedir":
  - Stellar testnet'te çalışır, gerçek para hareket etmez
  - Kendi işlemleriniz ve iade takvimleriniz
  - Ekibinizin kullanacağı klinik ekranı
  - Pilot süresince ücret yok `[ÖNERİ]`

### 2.2 Form

**Adım 1 — About you / Siz kimsiniz**
| Alan | EN | TR | Tür |
|---|---|---|---|
| role | You are… Clinic · Agency · Other | Siz… Klinik · Ajans · Diğer | tek seçim |
| org | Clinic or agency name | Klinik veya ajans adı | metin |
| city | City and country | Şehir ve ülke | metin |
| treatments | Treatments: Hair · Dental · Aesthetic · IVF · Other | İşlemler: Saç · Diş · Estetik · Tüp bebek · Diğer | çoklu seçim |
| web | Website or Instagram | Web sitesi veya Instagram | metin, opsiyonel |
| clinics | (agencies only) How many clinics do you work with? 1–5 · 6–20 · 20+ | (ajanslar için) Kaç klinikle çalışıyorsunuz? | tek seçim |

**Adım 2 — Deposits today / Bugün kapora**

Saha planındaki standart sorular.

| Alan | EN | TR |
|---|---|---|
| method | How do patients pay the deposit? Bank transfer · Western Union / MoneyGram · Card · Cash on arrival · Other | Hasta kaporayı nasıl ödüyor? Havale · Western Union / MoneyGram · Kart · Gelince nakit · Diğer |
| share | Typical deposit: Under 10% · 10–20% · 20–30% · Over 30% | Tipik kapora: %10 altı · %10–20 · %20–30 · %30 üstü |
| volume | Foreign patients per month: Under 20 · 20–50 · 50–150 · 150+ | Aylık yabancı hasta: 20 altı · 20–50 · 50–150 · 150+ |
| refund | Do you refund deposits? Never · Case by case · Written policy | Kapora iade ediyor musunuz? Hiç · Duruma göre · Yazılı politika var |
| chargeback | Card disputes (chargebacks) in the last 12 months: None · 1–2 · 3+ · Not sure | Son 12 ayda kart itirazı: Yok · 1–2 · 3+ · Emin değilim |
| lost | Do you lose bookings because patients won't pay up front? Often · Sometimes · Rarely | Hasta önden ödemek istemediği için rezervasyon kaybediyor musunuz? Sık · Bazen · Nadiren |

**Adım 3 — Contact / İletişim**
| Alan | EN | TR |
|---|---|---|
| name | Your name | Adınız |
| title | Your role (e.g. patient coordinator) | Göreviniz (ör. hasta koordinatörü) |
| whatsapp | WhatsApp number | WhatsApp numarası |
| email | Email (optional) | E-posta (opsiyonel) |
| lang | Preferred language: English · Türkçe · Other | Tercih edilen dil: English · Türkçe · Diğer |
| consent | ☐ Pacta may contact me on WhatsApp about the pilot and store these answers to plan it. | ☐ Pacta pilot hakkında benimle WhatsApp'tan iletişime geçebilir ve bu cevapları pilot planlaması için saklayabilir. |

**Adım 4 — Review and submit / Kontrol ve gönder**: cevapların özeti, ardından **Send application** / **Başvuruyu gönder** butonu.

Veri nereye gider: projede zaten kurulu olan Upstash KV'ye. Üçüncü taraf bir form servisine hiçbir şey gitmez.

### 2.3 Gönderdikten sonra
**EN**
- Başlık: Thanks, {name}. You're on the list.
- Sonraki adımlar:
  1. We'll message you on WhatsApp within one working day.
  2. A 20-minute call about how you take deposits today.
  3. We set up your clinic desk with your procedures and refund schedule.
  4. You send your first notice and walk a check-in through with us.
- Buton: Chat on WhatsApp now

**TR**
- Başlık: Teşekkürler {name}, listedesiniz.
- Sonraki adımlar:
  1. Bir iş günü içinde WhatsApp'tan yazacağız.
  2. Bugün kaporayı nasıl aldığınıza dair 20 dakikalık bir görüşme.
  3. Klinik ekranınızı kendi işlemleriniz ve iade takviminizle kuruyoruz.
  4. İlk bildiriminizi gönderiyor, bir giriş onayını birlikte deniyoruz.
- Buton: Hemen WhatsApp'tan yazın

---

## 3. Sade kurallar (`/rules`)

Yerleşim: solda içindekiler, sağda kurallar. Her başlık bir bağlantı.

**Üst not**
- EN: These rules explain how Pacta works in plain words. They are not yet a legal contract; formal terms will be published before Pacta handles real money.
- TR: Bu kurallar Pacta'nın nasıl çalıştığını sade bir dille anlatır. Henüz hukuki bir sözleşme değildir; Pacta gerçek parayla çalışmadan önce resmi koşullar yayımlanacaktır.

### 3.1 Who's who / Taraflar
**EN**
- **Patient**: pays the deposit and confirms arrival.
- **Clinic**: writes the notice, sets the refund schedule, checks the patient in, receives the deposit.
- **Agency** (optional): brought the booking; its share is written into the notice.
- **Escrow**: a contract on Stellar (built by Trustless Work) that holds the deposit. Neither the clinic nor Pacta holds the money.
- **Policy contract**: Pacta's contract that stores the refund schedule and records each payout.
- **Pacta**: runs the service, sends the payouts the contract computes, and handles support.

**TR**
- **Hasta**: kaporayı öder, gelişini onaylar.
- **Klinik**: bildirimi yazar, iade takvimini belirler, hastanın girişini yapar, kaporayı alır.
- **Ajans** (opsiyonel): rezervasyonu getiren taraf; payı bildirime yazılır.
- **Escrow**: kaporayı tutan, Stellar üzerindeki kontrat (Trustless Work altyapısı). Parayı ne klinik ne Pacta tutar.
- **Politika kontratı**: iade takvimini saklayan ve her ödemeyi kaydeden Pacta kontratı.
- **Pacta**: hizmeti işletir, kontratın hesapladığı ödemeleri gönderir, destek verir.

### 3.2 The deposit notice / Kapora bildirimi
- EN: The notice shows the clinic, its health-tourism licence number, the procedure, the date, the deposit and the refund for every date. What the patient sees is exactly what is committed: the notice and the contract can't differ.
- TR: Bildirimde klinik, sağlık turizmi yetki belgesi numarası, işlem, tarih, kapora tutarı ve her tarih için iade tutarı yer alır. Hastanın gördüğü, zincire yazılanın aynısıdır; bildirim ile kontrat farklı olamaz.

### 3.3 Paying the deposit / Kaporanın ödenmesi
- EN: When the patient pays, three things happen in order: an escrow is created for this booking, the refund schedule is written to the policy contract, and the deposit is locked. The rules always exist before the money does.
- TR: Hasta ödediğinde sırasıyla üç şey olur: bu rezervasyon için bir escrow açılır, iade takvimi politika kontratına yazılır, kapora kilitlenir. Kurallar her zaman paradan önce vardır.

### 3.4 Refund schedule / İade takvimi
- EN: The clinic picks how much is refunded depending on how many days before the procedure the patient cancels (for example: 14+ days, 100%; 7–14 days, 50%; under 7 days, 0%). The date of cancellation is taken from the blockchain's clock, not from anyone's say-so. Once the deposit is paid, nobody can change the schedule, the clinic and Pacta included.
- TR: Klinik, hastanın işlemden kaç gün önce iptal ettiğine göre ne kadar iade edileceğini belirler (ör. 14+ gün %100, 7–14 gün %50, 7 günden az %0). İptal tarihi kimsenin beyanına göre değil, blokzincirin saatine göre alınır. Kapora ödendikten sonra takvimi klinik ve Pacta dahil kimse değiştiremez.

### 3.5 If the clinic cancels / Klinik iptal ederse
- EN: If the clinic cancels, or its health-tourism licence lapses, the patient gets the whole deposit back, whatever the date. This rule is on every notice and can't be removed.
- TR: Klinik iptal ederse ya da sağlık turizmi yetki belgesi düşerse hasta, tarih ne olursa olsun kaporanın tamamını geri alır. Bu kural her bildirimde yer alır ve kaldırılamaz.

### 3.6 Arrival and release / Varış ve ödeme
- EN: When the patient arrives, the clinic marks the arrival and the patient confirms from their own phone. Only with both confirmations is the deposit released to the clinic. No refund applies after arrival.
- TR: Hasta geldiğinde klinik girişi işaretler, hasta da kendi telefonundan onaylar. Kapora ancak iki onay birden olduğunda kliniğe geçer. Varıştan sonra iade uygulanmaz.

### 3.7 If the patient doesn't show up / Hasta gelmezse `[ÖNERİ]`
- EN: If the patient neither arrives nor cancels, the deposit goes to the clinic 7 days after the procedure date, as the last row of the schedule says. If the clinic has marked the arrival and the patient doesn't confirm or object within 48 hours, the deposit is released to the clinic.
- TR: Hasta ne gelir ne iptal ederse, kapora işlem tarihinden 7 gün sonra takvimin son satırına göre kliniğe geçer. Klinik girişi işaretlediyse ve hasta 48 saat içinde onaylamaz ya da itiraz etmezse kapora kliniğe geçer.
- ⚠️ Bugün kodda yok. İki kuralın da kontrat ya da servis özelliği olarak yazılması gerekiyor.

### 3.8 Date changes / Tarih değişikliği `[ÖNERİ]`
- EN: During the pilot, a date change works like this: the clinic cancels the current notice (the patient is refunded in full) and sends a new one with the new date.
- TR: Pilot süresince tarih değişikliği şöyle işler: klinik mevcut bildirimi iptal eder (hastaya tam iade yapılır) ve yeni tarihle yeni bir bildirim gönderir.

### 3.9 Disputes / Anlaşmazlıklar `[ÖNERİ]`
- EN: Cancellations follow the schedule automatically. For anything the schedule doesn't cover (for example, the patient arrives and the clinic refuses treatment), either side writes to us on WhatsApp within 7 days. We review both sides and decide within 5 working days. Every decision and payout is recorded on-chain.
- TR: İptaller takvime göre otomatik işler. Takvimin kapsamadığı durumlarda (ör. hasta geldi, klinik tedaviyi reddetti) taraflardan biri 7 gün içinde WhatsApp'tan bize yazar. İki tarafı dinleyip 5 iş günü içinde karar veririz. Her karar ve ödeme zincire kaydedilir.

### 3.10 Fees / Ücretler `[ÖNERİ]`
- EN: The clinic pays 1–1.5% of each deposit. The patient pays nothing. The escrow provider (Trustless Work) charges 0.3% per payout, which Pacta covers. No fees during the pilot.
- TR: Klinik her kaporanın %1–1,5'ini öder. Hasta hiçbir ücret ödemez. Escrow sağlayıcısının (Trustless Work) ödeme başına %0,3 ücretini Pacta karşılar. Pilot süresince ücret alınmaz.
- ⚠️ Bugün %0,3 ücret ödemeden düşülüyor (tam iade %99,7 olarak ulaşıyor). "Pacta karşılar" istiyorsan kodun değişmesi gerekiyor.

### 3.11 Currency / Para birimi `[ÖNERİ]`
- EN: The deposit is shown in euros and held in USDC, a digital dollar. The amount is fixed in USDC at the moment of payment, and refunds are paid back in USDC. Converting back to euros may differ slightly with the exchange rate.
- TR: Kapora euro olarak gösterilir, dijital bir dolar olan USDC olarak tutulur. Tutar ödeme anında USDC olarak sabitlenir ve iadeler USDC olarak yapılır. Euro'ya geri çevrildiğinde kur farkı nedeniyle küçük farklar olabilir.

### 3.12 Payout in lira / Lira ödemesi
- EN: The clinic withdraws through a licensed exchange partner (a Stellar "anchor"). It sees a firm rate before anything moves, and the lira arrives in its bank account by bank transfer. The clinic never has to hold or manage crypto.
- TR: Klinik ödemesini lisanslı bir çevrim ortağı (Stellar "anchor"u) üzerinden çeker. Hiçbir şey hareket etmeden önce kesin kuru görür; lira banka hesabına havaleyle gelir. Klinik hiçbir zaman kripto tutmak ya da yönetmek zorunda kalmaz.

### 3.13 Your data / Verileriniz
- EN: On the public blockchain: wallet addresses, amounts in USDC, dates and refund percentages. Never on the blockchain: names, phone numbers or medical details. Today the escrow record also carries the clinic name and the procedure; we're removing them before handling real patients.
- TR: Herkese açık blokzincirde: cüzdan adresleri, USDC tutarları, tarihler ve iade yüzdeleri. Blokzincire asla yazılmaz: isimler, telefon numaraları, tıbbi bilgiler. Bugün escrow kaydında klinik adı ve işlem de yer alıyor; gerçek hastalarla çalışmadan önce bunları kaldırıyoruz.

### 3.14 The pilot / Pilot `[ÖNERİ]`
- EN: The pilot runs on Stellar testnet: transactions are real, the money isn't. It's free. Either side can stop at any time. We'll ask for your feedback and, if it works for you, a short letter of intent for the next step.
- TR: Pilot Stellar testnet'te çalışır: işlemler gerçek, para değil. Ücretsizdir ve iki taraf da istediği zaman bırakabilir. Görüşlerinizi isteriz; işinize yararsa bir sonraki adım için kısa bir niyet mektubu (LOI) rica ederiz.

---

## 4. Sözlük (`/rules#glossary`)

| Terim | EN | TR |
|---|---|---|
| Deposit / Kapora | Part of the price paid before the trip to hold the booking. | Rezervasyonu tutmak için yolculuktan önce ödenen tutar. |
| Deposit notice / Kapora bildirimi | The page the patient opens: clinic, date, amount, refund rules. | Hastanın açtığı sayfa: klinik, tarih, tutar, iade kuralları. |
| Escrow | A neutral holder: the money waits there until the agreed condition is met. | Tarafsız emanet: para, şart yerine gelene kadar orada bekler. |
| Refund schedule / İade takvimi | How much comes back, depending on the cancellation date. | İptal tarihine göre ne kadarın geri döneceği. |
| Policy contract / Politika kontratı | Pacta's contract that fixes the refund schedule and records payouts. | İade takvimini sabitleyen ve ödemeleri kaydeden Pacta kontratı. |
| Check-in / Giriş onayı | Clinic and patient both confirming the patient arrived. | Klinik ve hastanın gelişi birlikte onaylaması. |
| Release / Serbest bırakma | The escrow paying the deposit to the clinic. | Escrow'un kaporayı kliniğe ödemesi. |
| Stellar | The public blockchain Pacta runs on. Fast and low-cost. | Pacta'nın çalıştığı açık blokzincir. Hızlı ve düşük maliyetli. |
| Testnet / Mainnet | Testnet: the test network, no real money. Mainnet: the live network. | Testnet: gerçek paranın olmadığı test ağı. Mainnet: canlı ağ. |
| USDC | A digital dollar: one USDC is worth one US dollar. | Dijital dolar: 1 USDC = 1 ABD doları. |
| Anchor | A licensed partner that converts digital dollars to lira and pays your bank. | Dijital doları liraya çevirip bankanıza ödeyen lisanslı ortak. |
| Firm quote / Kesin kur | A rate locked before the money moves. | Para hareket etmeden önce sabitlenen kur. |
| Trustless Work | The escrow infrastructure Pacta uses. | Pacta'nın kullandığı escrow altyapısı. |
| Chargeback | A card payment reversed after a dispute. | İtiraz sonrası kart ödemesinin geri alınması. |
| Agency share / Ajans payı | The agency's commission, written into the notice. | Bildirime yazılan ajans komisyonu. |
| Transaction / İşlem (hash) | A recorded step on the blockchain; anyone can look it up. | Blokzincirdeki kayıtlı adım; herkes görüntüleyebilir. |

---

## 5. Animasyon A — yaşayan kart (teknik not)
- Hero'daki bildirim kartı 4 durum arasında (§1.2) yaklaşık 3'er saniyede, yumuşak geçişlerle değişir.
- Altında 4 parçalı ilerleme çubuğu var. Üzerine gelince ya da odaklanınca durur; bir parçaya tıklayınca o duruma atlar.
- `prefers-reduced-motion` açıksa kart 2. durumda sabit kalır.
- framer-motion gerekmez; React state ve CSS geçişleri yeterli.

---

## 6. Senden beklediğim kararlar
| # | Konu | Önerim |
|---|---|---|
| 1 | WhatsApp Business numarası | `{WHATSAPP}` — numarayı bekliyorum |
| 2 | Hasta gelmezse (§3.7) | İşlem tarihinden 7 gün sonra kliniğe geçer. Klinik girişi işaretlediyse ve hasta 48 saat sessiz kalırsa kapora serbest bırakılır. |
| 3 | Tarih değişikliği (§3.8) | Pilotta: tam iadeyle iptal, ardından yeni bildirim |
| 4 | Anlaşmazlık (§3.9) | 7 gün içinde WhatsApp'tan bildirim; Pacta 5 iş günü içinde karar verir |
| 5 | Trustless Work %0,3 ücreti (§3.10) | Pacta karşılar (kod değişikliği gerekir) — yoksa "ödemeden düşülür" mü? |
| 6 | İade para birimi (§3.11) | İade USDC olarak; kur farkı açıkça yazılır |
| 7 | Pilot ücreti (§1.10, §2.1, §3.14) | Pilot süresince ücret yok |
| 8 | "Scale Track winner" satırı | Onayla ya da kaldıralım |
