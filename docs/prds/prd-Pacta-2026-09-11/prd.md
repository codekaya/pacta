---
title: Pacta
status: draft
created: 2026-09-11
updated: 2026-09-11
---

# PRD: Pacta — Sağlık Turizminde Kapora Escrow'u
*Çalışma adı — onaylanmalı.*

## 0. Dokümanın amacı

Bu PRD, Pacta'nın v1 kapsamını ürün gereksinimi düzeyinde tanımlar ve downstream akışlara (mimari, epic & story, SCF başvurusu) sabit referanslar verir. Sözlük (§3) terimleri bağlayıcıdır: FR, UJ ve SM maddeleri bu terimleri birebir kullanır. Mevcut iki girdi üstüne kuruludur ve onları tekrarlamaz: ürün vizyonu, pazar aritmetiği ve teknik tasarım taslağı `pacta-full-spec.md`'de; rakip konumlanması ve ekosistem bulguları `docs/pacta-rakip-haritasi.md`'de. Teknoloji seçimleri ve reddedilen alternatifler bu dokümanda değil, `addendum.md`'de tutulur.

Fast path ile yazıldı: çıkarım yapılan her karar satır içinde `[VARSAYIM]` etiketiyle işaretlendi ve §9'da indeksledi. Onaylanmadan downstream'e geçilmemesi gereken varsayımlar §9'da ayrıca işaretli.

## 1. Vizyon

Sağlık turizminde ödemenin ilk parçası kapora, ve tam olarak korumasız olan parça o. Hasta hiç görmediği bir kliniğe, çoğu zaman Instagram'da bulup WhatsApp'tan konuştuğu bir kuruma, €200-1.000 arası bir tutarı havale veya Western Union ile gönderiyor — geri dönüşü olmayan bir rayla ve neredeyse her zaman "iade edilmez" koşuluyla. Dolandırıcılığın klasik biçimi de bu: kaporayı al, iletişimi kes.

Pacta kaporayı kliniğe değil, zincir üstü bir escrow'a alıyor. Para, hasta kliniğe fiziken varıp onay verene kadar kimseye geçmiyor; hasta iptal ederse ödemeden önce okuduğu iptal politikası kodda çalışıyor ve iadeyi kimsenin onayına bakmadan yapıyor. Klinik ise kendini "iade yok" diyerek savunmak zorunda kalmıyor — tarih kademeli bir politika yazıp hem no-show riskini kapatıyor hem hastaya güvenilir görünüyor.

Ürünün ikinci ve daha az görünür değeri kanıt kaydı. Her state geçişi zincire event olarak yazılıyor. Bugün kliniklere verilen tavsiye "her aşamayı belgeleyin, onam formlarını saklayın" — yani chargeback savunması bir üründen değil, arşivden ibaret. Pacta o arşivi doğrulanabilir bir zincir kaydına çeviriyor.

## 2. Hedef kullanıcı

### 2.1 Birincil persona

**Hasta — yurtdışından tedaviye gelen.** Saç ekimi için Türkiye'ye gelmeye karar vermiş, 28-45 yaş, Avrupa'da yaşıyor. Kliniği sosyal medyada buldu, fiyat ve paket bilgisini WhatsApp'tan aldı. Kripto kullanıcısı değil ve olmak zorunda da değil. Tek derdi şu: parayı gönderdikten sonra bu insanlar kaybolursa ne yaparım. Karşılaştırma yaptığı alternatif bir rakip ürün değil, **havale** — yani çubuk çok düşük.

### 2.2 İkincil persona

**Klinik — uluslararası hasta kabul eden.** Yetki belgesi var, ayda 30-200 yabancı hasta görüyor. İki derdi var: rezervasyonun iptal olması (no-show) ve hasta ülkesine döndükten sonra kart ödemesine itiraz etmesi. Bugünkü savunması "iade yok" demek, ama bu rezervasyon kapatmasını zorlaştırıyor. Kart komisyonu %2,5-4 ve chargeback riski üstüne biniyor.

### 2.3 v1'de kapsam dışı kullanıcılar

- **Bakiye ödemesi yapan hasta.** Bakiye klinikte, yüz yüze, çoğunlukla nakit ödeniyor; hasta zaten yerinde ve hizmeti görüyor. Escrow'un marjinal değeri düşük.
- **Kripto yerlisi kullanıcı.** Ürün cüzdan kurmayı, seed phrase saklamayı veya zincir bilgisi gerektirmeyi hedeflemiyor. Hasta tarafında kripto tamamen gizli.
- **Sağlık turizmi dışı escrow ihtiyacı.** Freelance, e-ticaret, emlak — bunlar ekosistemde altı fonlu projenin zaten yarıştığı alan (`docs/pacta-rakip-haritasi.md` §2). Pacta dikeye bağlı kalır.

### 2.4 Kullanıcı yolculukları

- **UJ-1. Marcus kaporayı gönderiyor ama kimseye vermiyor.**
  > Marcus, Berlin'de yaşıyor, saç ekimi için İzmir'de bir klinikle anlaştı. Kliniğin WhatsApp'tan gönderdiği Pacta ödeme linkine tıklıyor — hesap açmıyor, cüzdan kurmuyor. Sayfada üç şey görüyor: kliniğin doğrulama rozeti (yetki belgesi kaydı), tarih kademeli iptal politikası tablosu, ve €800 tutar. Politikayı **ödemeden önce** okuyor: 14 günden erken iptalde tam iade. Kartıyla ödüyor. Ekranda "€800'ünüz escrow'da, klinikte onay verene kadar kliniğe geçmez" yazıyor ve yanında zincir kaydına giden bir explorer linki var. **Değerin geldiği an:** parayı gönderdi ama kimseye vermedi, ve bunu kendi gözüyle doğrulayabiliyor. **Kaldığı durum:** anlaşma `Funded`, işlem tarihi bekleniyor.

- **UJ-2. Marcus klinikte QR okutuyor, para o an serbest kalıyor.**
  > Marcus İzmir'e geldi, klinikte. Resepsiyon panelden anlaşmanın QR'ını gösteriyor, Marcus telefonuyla okutuyor ve onaylıyor; klinik de kendi tarafından imzalıyor. Çift imza tamamlanınca kontrat kaporayı kliniğe (ve varsa ajans komisyonunu ajansa) aktarıyor. **Değerin geldiği an:** klinik parayı hasta fiziken oradayken alıyor — no-show riski sıfır, chargeback iddiası karşısında zincirde çift imzalı kanıt var. **Kenar durum:** Marcus telefonunu kaybettiyse klinik panelden manuel onay talebi açar, hasta e-posta bağlantısıyla imzalar.

- **UJ-3. Marcus 20 gün önce iptal ediyor, iade kimsenin onayına bakmıyor.**
  > Marcus'un işi çıktı, gelemeyecek. Ödeme sayfasındaki bağlantıdan iptal ediyor. İşlem tarihine 20 gün var, politika 14 günden erken iptalde tam iade diyor, kontrat bunu zincirde hesaplıyor ve €800'ü Marcus'a geri gönderiyor. Klinikten onay istenmiyor, Pacta'dan onay istenmiyor. **Değerin geldiği an:** iade bir müşteri hizmetleri konuşması değil, bir fonksiyon çağrısı. **Kenar durum:** 10 gün kalmışken iptal ederse aynı akış %50 iade üretir ve kalan %50 kliniğe geçer — hasta bunu iptal ekranında ödemeden önceki tabloyla aynı sayılarla görür.

- **UJ-4. Klinik parayı yerel hesabına çekiyor.**
  > Klinik muhasebesi panelde serbest kalmış kaporaları görüyor. Çekim başlatıyor; anchor akışı kur teklifini gösteriyor ve tutar banka hesabına geçiyor. **Kaldığı durum:** anlaşma kapanmış, mutabakat kaydı panelde. **v1 notu:** bu yolculuk v1'de USDC teslimatıyla bitiyor; TL bacağı §4.9'a bakınız.

- **UJ-5. Kliniğin doğrulaması düşüyor, açık kaporalar otomatik korunuyor.**
  > Kliniğin yetki belgesi kaydı geçersizleşiyor. Pacta zincirdeki `verified` bayrağını düşürüyor. O kliniğe bağlı tüm açık anlaşmalar tam iade yoluna giriyor ve yeni anlaşma fonlanamıyor. **Değerin geldiği an:** hasta hiçbir şey yapmadan korunuyor; doğrulama bir pazarlama rozeti değil, çalışan bir devre kesici.

- **UJ-6. Ajans kaporayı tutmayı bırakıyor ama komisyonunu kaybetmiyor.**
  > Ajans hasta trafiğini getiriyor ve bugün kaporayı kendisi tutuyor. Pacta'da anlaşma oluşturulurken ajans komisyonu ayrı bir çıkış olarak tanımlanıyor ve serbest bırakma anında otomatik ödeniyor. **Değerin geldiği an:** ajans nakit tutma avantajını kaybediyor ama tahsilat riskini ve komisyon takibini de kaybediyor; rakip olmaktan çıkıp dağıtım kanalına dönüşüyor.

## 3. Sözlük

- **Kapora** — Tedavi bedelinin hasta gelmeden önce ödenen parçası; tipik olarak toplamın %10-30'u, €200-1.000 bandında. Pacta'nın tek konusu. Bakiye kapsam dışıdır.
- **Anlaşma** — Bir hasta, bir klinik, opsiyonel bir ajans ve bir kapora tutarı arasındaki tek kayıt. Zincirde `deal_id` ile anahtarlanır. Bir anlaşma bir kapora tutar; kardinalite 1:1.
- **Escrow** — Kaporanın, hiçbir tarafın tek başına erişemediği, kontrat adresinde tutulduğu durum. Pacta escrow'da parayı **tutmaz**; kontrat tutar.
- **İptal Politikası** — İşlem tarihine kalan güne göre iade oranını belirleyen, anlaşma oluşturulurken sabitlenen ve zincirde saklanan tarih kademeleri tablosu. Hasta ödemeden önce görür; sonradan değiştirilemez.
- **Serbest Bırakma** — Kaporanın kliniğe (ve varsa ajansa) aktarılması. Üç yolla olur: Varışta Çift Onay, Zaman Aşımı, veya Hakem kararı.
- **Varışta Çift Onay** — Hasta ve kliniğin klinikte, QR üzerinden, aynı anlaşma için imza vermesi. Serbest Bırakma'nın birincil yolu ve en güçlü kanıtı.
- **Zaman Aşımı** — İşlem tarihinden N gün sonra hasta hiçbir işlem yapmamışsa İptal Politikası'na göre otomatik dağıtım. Kliniğin no-show koruması.
- **İtiraz** — Hasta veya kliniğin anlaşmayı `Disputed` durumuna taşıması; Zaman Aşımı'nı durdurur.
- **Hakem** — İtiraz'ı çözen ve yalnızca dağıtım oranını belirleyebilen rol. Parayı kendisine yönlendiremez; bu bir kontrat kısıtıdır, politika değil.
- **Klinik Rozeti** — Kliniğin zincirdeki `verified` bayrağının hasta ödeme sayfasındaki görünümü. Yetki belgesi, vergi no, banka hesabı adı eşleşmesi ve anchor KYB'sinden beslenir.
- **Ajans Komisyonu** — Anlaşmada `agency_bps` ile tanımlanan, Serbest Bırakma anında ajansa giden pay.
- **Anchor** — Stellar üstünde SEP-6/10/12/24/38 uygulayan, kripto ile yerel para arasında köprü kuran lisanslı kuruluş.
- **Off-ramp** — Kliniğin USDC'yi yerel paraya (TL) çevirme bacağı. Anchor üzerinden yapılır.
- **Kanıt Kaydı** — Bir anlaşmanın tüm state geçişlerinin zincirdeki event dizisi. Chargeback savunmasının ve mutabakatın kaynağı.

## 4. Özellikler

### 4.1 Anlaşma yaşam döngüsü (escrow çekirdeği)

**Tanım.** Tek kontrat, anlaşma başına `persistent` storage kaydı. Anlaşma başına kontrat deploy etmek reddedildi; gerekçe `addendum.md`'de. Durumlar: `Created` → `Funded` → (`Released` | `Refunded` | `Disputed` → `Resolved` | `Expired`). Her geçiş event yayınlar ve checks-effects-interactions sırasına uyar: state güncellemesi token transferinden önce.

Escrow çekirdeği **kendi kontratımız** olarak yazılır, mevcut `contracts/upto` şablon alınarak. `upto` kilitleme, kısmi dağıtım, artığın iadesi, izinsiz `reclaim`, recipient binding ve replay koruması özelliklerini test edilmiş biçimde veriyor; ama `MAX_VALIDITY_WINDOW_SECONDS` 7 gün ile sınırlı (kapora haftalar-aylar tutulacak), tek `payee` destekliyor (Ajans Komisyonu ayrı çıkış gerektiriyor), `settled` tutarını `settler` serbestçe belirliyor (İptal Politikası zincirde olmalı) ve İtiraz durumları yok.

> ⚠️ **17 Eylül 2026 — bu bölüm revize edildi.** Aşağıdaki teknik bulgu geçerli, **sonucu değişti.** Scale Track kısıtları (entegrasyon bir başvuru koşulu, escrow kontratı hâlâ 0 satır, ön inşa penceresi 1,5 güne indi) altında **hibrit** yola dönüldü: Trustless Work Single-Release escrow parayı tutar, Pacta yalnızca bir **Politika Taahhüt Kontratı** yazar (fon tutmaz, iptal kademelerini değiştirilemez saklar, hak edilen dağıtımı hesaplar). Gerekçe, rol eşlemesi ve etkilenen FR'ler: karar günlüğü D-10 ve `docs/pacta-yapilacaklar.md` §2. Trustless Work'ün eligible listede olması koşuluna bağlı.

Trustless Work (ekosistemin baskın EaaS sağlayıcısı) araştırıldı: yaşam döngüsünde zaman tabanlı faz yok ve tam/kısmi her iade yolu bir Dispute Resolver imzasından geçiyor. Pacta'nın İptal Politikası o modelde **kendi başına** zincirde çalışamaz; Pacta Dispute Resolver olmak zorunda kalır. D-10'da bu taviz açıkça kabul edildi: politika artık "ihlal edilemez" değil, **"ihlal edildiği kanıtlanabilir"** — Politika Taahhüt Kontratı sayesinde Pacta'nın gönderdiği dağıtımın zincirdeki kademelerle eşleşip eşleşmediği herkes tarafından doğrulanabiliyor.

**Fonksiyonel gereksinimler:**

#### FR-1: Anlaşma oluşturma
Klinik veya ajans, hasta adresi, klinik adresi, opsiyonel ajans adresi ve komisyon oranı, tutar, işlem tarihi ve İptal Politikası ile bir Anlaşma oluşturabilir. UJ-1'i gerçekleştirir.

**Sonuçlar (test edilebilir):**
- Anlaşma `Created` durumunda oluşur ve `deal_id` döner.
- Kliniğin `verified` bayrağı düşükse çağrı reddedilir.
- `agency_bps` tanımlıysa ve 0 değilse ajans adresi zorunludur; aksi halde reddedilir.
- İşlem tarihi geçmişte olamaz.
- İptal Politikası kademeleri azalan sırada ve 0-10000 bps aralığında olmak zorundadır.

#### FR-2: Fonlama
Hasta, `Created` durumdaki bir Anlaşma'yı kapora tutarıyla fonlayabilir; tutar Escrow'a geçer. UJ-1'i gerçekleştirir.

**Sonuçlar:**
- Yalnızca hasta imzasıyla çağrılabilir.
- Başarıda durum `Funded` olur ve `Funded` eventi yayınlanır.
- Fonlama son tarihi geçmişse reddedilir.
- Kliniğin `verified` bayrağı fonlama anında tekrar kontrol edilir; düşükse reddedilir.
- Aynı Anlaşma iki kez fonlanamaz.

#### FR-3: Kayıt ömrü yönetimi
Sistem, açık Anlaşma kayıtlarının işlem tarihinden itibaren gerekli süre boyunca erişilebilir kalmasını sağlar.

**Sonuçlar:**
- Her state geçişinde açık anlaşmanın storage TTL'i uzatılır.
- Kapanan anlaşmanın `persistent` kaydı silinir, replay işareti kalır.
- Rezervasyondan işlem tarihine 180 güne kadar tutma desteklenir. `[VARSAYIM]` 180 gün üst sınır olarak alındı; sağlık turizminde tipik rezervasyon ufkuna dair veri yok (§8 OQ-4).

#### FR-4: Yuvarlama artığı
Dağıtımda oluşan yuvarlama artığı hastaya gider.

**Sonuçlar:**
- Klinik + ajans + Pacta komisyonu toplamı, escrow'daki tutarı hiçbir durumda aşamaz.
- Artık pozitifse hastaya transfer edilir ve dağıtım eventinde ayrı alan olarak görünür.

### 4.2 Zincir üstü iptal politikası

**Tanım.** Bugünkü "iade yok, bize güvenin" cümlesinin yerini alan, ödemeden önce yazılmış ve kodda çalışan tarih kademeleri. Politika Anlaşma oluşturulurken sabitlenir ve sonradan değiştirilemez — değiştirilebilir olması ürünün tüm anlamını yok eder.

`[VARSAYIM]` Politika **tamamen zincirde** yaşar: kademeler kontratta saklanır ve iade oranını ledger timestamp'ine göre kontrat hesaplar. Hiçbir taraf — Pacta dahil — tutarı keyfi olarak belirleyemez. `upto`'daki serbest `settler` modeli bilinçli olarak reddedildi.

**Fonksiyonel gereksinimler:**

#### FR-5: Hasta iptali
Hasta, `Funded` durumdaki bir Anlaşma'yı iptal edebilir; dağıtım İptal Politikası'na göre zincirde hesaplanır. UJ-3'ü gerçekleştirir.

**Sonuçlar:**
- Yalnızca hasta imzasıyla çağrılabilir.
- İade oranı, `procedure_date - now` değerinin denk geldiği kademeden okunur.
- İade tutarı hastaya, kalan kliniğe ve (varsa) ajansa aktarılır.
- Durum `Refunded` olur; event iade oranını ve uygulanan kademeyi içerir.
- İşlem tarihi geçmişse bu fonksiyon reddedilir; Zaman Aşımı yolu geçerlidir.

#### FR-6: Klinik iptali
Klinik, `Funded` durumdaki bir Anlaşma'yı iptal edebilir; sonuç her zaman tam iadedir.

**Sonuçlar:**
- Yalnızca klinik imzasıyla çağrılabilir.
- İptal Politikası kademelerine bakılmaz; iade %100'dür.
- Durum `Refunded` olur.

#### FR-7: Politika görünürlüğü
Hasta, ödeme yapmadan önce kendisine uygulanacak İptal Politikası'nı tarih ve tutar olarak görür. UJ-1'i gerçekleştirir.

**Sonuçlar:**
- Ödeme sayfası her kademeyi takvim tarihi ve euro tutarı olarak gösterir; yalnızca yüzde olarak göstermek yeterli değildir.
- Gösterilen değerler zincirdeki politika kaydından okunur, ayrı bir kaynaktan değil.
- İptal ekranındaki sayılar ödeme ekranındakiyle birebir aynı olmak zorundadır.

### 4.3 Varışta çift onay

**Tanım.** Serbest Bırakma'nın birincil yolu ve ürünün kanıt gücünün kaynağı: hasta klinikte, kliniğin ürettiği QR'ı okutur, iki taraf da aynı `deal_id` için imza verir.

**Fonksiyonel gereksinimler:**

#### FR-8: Çift imzalı serbest bırakma
Hasta ve klinik birlikte imza verdiğinde kapora kliniğe ve varsa ajansa aktarılır. UJ-2'yi gerçekleştirir.

**Sonuçlar:**
- Her iki imza olmadan çağrı reddedilir.
- Durum `Released` olur; event her iki imzacıyı ve dağıtım kalemlerini içerir.
- `Disputed` durumdaki anlaşma bu yolla serbest bırakılamaz.

#### FR-9: QR üretimi ve bağlanması
Klinik, bir Anlaşma için tek kullanımlık, süreli bir onay QR'ı üretebilir. UJ-2'yi gerçekleştirir.

**Sonuçlar:**
- QR yalnızca tek `deal_id`'ye bağlıdır ve başka anlaşma için kullanılamaz.
- QR'ın geçerlilik süresi vardır ve süresi geçmiş QR reddedilir.
- QR ekran görüntüsüyle paylaşılmış olsa bile hasta imzası olmadan serbest bırakma gerçekleşmez.

#### FR-10: Zaman aşımı ile serbest bırakma
İşlem tarihinden N gün sonra hasta hiçbir işlem yapmamışsa dağıtım İptal Politikası'na göre otomatik yapılır.

**Sonuçlar:**
- Fonksiyon izinsiz (permissionless) çağrılabilir; süre kontrolü ledger timestamp ile zincirde yapılır.
- `Disputed` durumdaki anlaşmada çağrı reddedilir.
- Durum `Expired` olur; event tetikleyeni ve uygulanan oranı içerir.
- `[VARSAYIM]` N = 7 gün alındı; klinik nakit akışı ihtiyacı ile hasta itiraz penceresi arasındaki denge doğrulanmadı (§8 OQ-5).

### 4.4 Klinik doğrulama ve rozet

**Tanım.** Opsiyonel bir özellik değil, ürünün meşruiyet koşulu. "Kart alamayan klinikler zaten şüpheli, siz onları meşrulaştırıyorsunuz" itirazının tek cevabı çalışan bir doğrulama katmanı ve düştüğünde devreye giren bir devre kesici.

**Fonksiyonel gereksinimler:**

#### FR-11: Doğrulama kayıt defteri
Sistem, klinik adreslerini `verified` bayrağı ile zincirde tutar. UJ-1, UJ-5'i gerçekleştirir.

**Sonuçlar:**
- Bayrak yalnızca yetkili Pacta adresi tarafından değiştirilebilir.
- Her bayrak değişimi event yayınlar ve kim değiştirdiğini kaydeder.
- Doğrulama girdileri: Sağlık Bakanlığı uluslararası sağlık turizmi yetki belgesi kaydı, vergi numarası, ticaret sicil, banka hesabı sahibi adının klinik tüzel kişiliğiyle eşleşmesi. Şahsi hesaba ödeme kabul edilmez.
- `[VARSAYIM]` v1'de Bakanlık kaydı statik liste üzerinden kontrol edilir; canlı sorgu arayüzünün varlığı doğrulanmadı (§8 OQ-6).

#### FR-12: Doğrulama düşünce devre kesici
Bir kliniğin `verified` bayrağı düştüğünde o kliniğe bağlı açık Anlaşmalar tam iade yoluna girer ve yeni fonlama engellenir. UJ-5'i gerçekleştirir.

**Sonuçlar:**
- Bayrak düştükten sonra FR-2 çağrıları reddedilir.
- Açık `Funded` anlaşmalar için tam iade çağrılabilir hale gelir ve bu çağrı izinsizdir.
- Bayrak düşmesi hastaya bildirilir.

#### FR-13: Rozetin hastaya görünümü
Hasta, ödeme sayfasında kliniğin doğrulama durumunu ve neye dayandığını görür. UJ-1'i gerçekleştirir.

**Sonuçlar:**
- Rozet, zincirdeki bayraktan okunur.
- Rozete tıklandığında hangi kayıtların doğrulandığı listelenir; rozet açıklamasız bir güven işareti olarak gösterilemez.

### 4.5 Ajans komisyon dağıtımı

**Tanım.** Ajansı rakip olmaktan çıkarıp dağıtım kanalına çeviren mekanizma. Ölçeklemenin anahtarı burada: ajans kaporayı tutmayı bırakıyor ama komisyonunu otomatik alıyor.

**Fonksiyonel gereksinimler:**

#### FR-14: Çok taraflı dağıtım
Serbest Bırakma anında kapora klinik, ajans ve Pacta komisyonu arasında `agency_bps` ve komisyon oranına göre tek işlemde bölünür. UJ-6'yı gerçekleştirir.

**Sonuçlar:**
- Ajans tanımlı değilse dağıtım iki kalemli olur (klinik + Pacta).
- Dağıtım kalemleri toplamı escrow tutarını aşamaz.
- Her kalem dağıtım eventinde ayrı ayrı görünür.
- İade senaryolarında ajans komisyonu ödenmez; iade edilmeyen kısım varsa oransal olarak bölünür.

### 4.6 Hasta ödeme sayfası

**Tanım.** Hastanın kripto gördüğü tek yer: hiçbir yer. Hesap açmıyor, cüzdan kurmuyor, seed phrase saklamıyor.

**Fonksiyonel gereksinimler:**

#### FR-15: Cüzdansız ödeme akışı
Hasta, kripto bilgisi olmadan kartla veya havaleyle ödeme yapıp Anlaşma'yı fonlayabilir. UJ-1'i gerçekleştirir.

**Sonuçlar:**
- Akışın hiçbir adımı hastadan cüzdan kurmasını istemez.
- Hasta ödeme sonrası escrow durumunu doğrulanabilir bir explorer bağlantısıyla görebilir.
- `[VARSAYIM]` v1'de hastanın EUR → USDC girişi simüle edilir ve demoda bu açıkça söylenir. Üretimde AB tarafında bir rampa/PSP gerekir (§8 OQ-7).

#### FR-16: İptal erişimi
Hasta, ödeme sonrası aldığı bağlantı üzerinden hesap açmadan iptal başlatabilir. UJ-3'ü gerçekleştirir.

**Sonuçlar:**
- Bağlantı yalnızca ilgili Anlaşma'ya erişim verir.
- İptal ekranı uygulanacak iade oranını ve tutarı işlem öncesi gösterir.

### 4.7 Klinik paneli

**Fonksiyonel gereksinimler:**

#### FR-17: Bekleyen kaporalar görünümü
Klinik, kendisine bağlı Anlaşmaları durum ve tutarla görebilir. UJ-2, UJ-4'ü gerçekleştirir.

**Sonuçlar:**
- Her anlaşma için durum, tutar, işlem tarihi ve uygulanacak İptal Politikası görünür.
- Klinik, `Funded` durumdaki bir tutara panel üzerinden erişemez; "kilitli" durumu açıkça gösterilir.

#### FR-18: Onay ve çekim başlatma
Klinik, QR üretebilir ve serbest kalmış tutar için çekim başlatabilir. UJ-2, UJ-4'ü gerçekleştirir.

### 4.8 İtiraz ve hakem

**Tanım.** Zaman Aşımı'nın hastayı savunmasız bırakmaması için gereken denge. Hakemin yetkisi bilinçli olarak dar: yalnızca dağıtım oranı.

**Fonksiyonel gereksinimler:**

#### FR-19: İtiraz açma
Hasta veya klinik, `Funded` durumdaki bir Anlaşma için İtiraz açabilir.

**Sonuçlar:**
- Durum `Disputed` olur ve Zaman Aşımı durur.
- İtiraz gerekçesi event olarak kaydedilir.
- İtiraz yalnızca işlem tarihinden Zaman Aşımı'na kadarki pencerede açılabilir.

#### FR-20: Hakem çözümü
Hakem, `Disputed` bir Anlaşma için dağıtım oranı belirleyebilir.

**Sonuçlar:**
- Hakem yalnızca oran belirler; hedef adresleri değiştiremez.
- Hakem adresi dağıtımda alıcı olarak yer alamaz; bu kontrat düzeyinde engellenir.
- Durum `Resolved` olur; karar ve oran event olarak kaydedilir.
- `[NON-GOAL for MVP]` Hakem arayüzü v1'de yok; çözüm doğrudan kontrat çağrısıyla yapılır.

### 4.9 Off-ramp (TL çekimi)

**Tanım.** Kliniğin USDC'yi TL'ye çevirme bacağı. Ekosistem taraması, Stellar'daki 14 anchor'ın hiçbirinin Türk olmadığını ve hiçbirinin TL desteklemediğini gösterdi (`docs/pacta-rakip-haritasi.md` §5).

`[VARSAYIM]` **v1 USDC teslimatında biter.** TL bacağı SEP-24 akışı olarak test anchor'ıyla simüle edilir ve demoda açıkça belirtilir. Gerekçe: doğrulanmamış bir anchor bağımlılığını kritik yolda tutmak en büyük teslim riski. TheXBank (Türkiye merkezli, lisanslı, SCF fonu yok) ortaklık izi olarak takip edilir ama v1'i bloke etmez.

**Fonksiyonel gereksinimler:**

#### FR-21: Çekim akışı
Klinik, serbest kalmış USDC için anchor çekim akışını panelden başlatabilir. UJ-4'ü gerçekleştirir.

**Sonuçlar:**
- SEP-10 ile anchor kimlik doğrulaması yapılır.
- SEP-38 kur teklifi çekim öncesi gösterilir.
- SEP-24 interaktif akışı ile çekim başlatılır ve durum panelde izlenir.
- v1'de akış test anchor'ına bağlanır; üretim anchor'ı yapılandırma ile değiştirilebilir olmalıdır.

### 4.10 Kanıt kaydı

**Tanım.** Ürünün ikinci değer önerisi. Hukukçunun kliniklere verdiği "her aşamayı belgeleyin" tavsiyesini manuel arşivden zincir üstü kanıta çeviriyor.

**Fonksiyonel gereksinimler:**

#### FR-22: Tam event kapsaması
Her state geçişi, tarafları ve tutarları içeren bir event yayınlar.

**Sonuçlar:**
- `Created`, `Funded`, `Released`, `Refunded`, `Disputed`, `Resolved`, `Expired` ve doğrulama bayrağı değişimleri eventlenir.
- Her event `deal_id` içerir ve bir anlaşmanın tüm geçmişi tek anahtarla okunabilir.

#### FR-23: Mutabakat ve kanıt görünümü
Klinik, bir Anlaşma'nın tüm geçmişini doğrulanabilir kayıt olarak dışa aktarabilir.

**Sonuçlar:**
- Her adım için explorer bağlantısı üretilir.
- Çift imzalı serbest bırakmalar, hizmetin verildiğinin kanıtı olarak ayrıca işaretlenir.

## 5. Açık kapsam dışılıklar

- **Pacta para tutmaz.** Custody hizmeti sunulmuyor; escrow'da para kontrattadır. Bu bir mimari tercih değil, regülasyon konumunun temeli (§11).
- **Bakiye ödemesi çözülmüyor.** Ürün kaporaya bağlı kalır.
- **Genel amaçlı escrow olunmuyor.** Freelance, e-ticaret, emlak dikeylerine girilmez; o alanda altı SCF-fonlu proje yarışıyor ve Pacta'nın avantajı dikeye özgü katmanda.
- **Hasta tarafında kripto deneyimi kurulmuyor.** Cüzdan, seed phrase, gas kavramı hastaya hiç gösterilmez.
- **Tıbbi içerik, randevu yönetimi, klinik CRM'i yapılmaz.** Pacta bir ödeme altyapısıdır, sağlık turizmi pazar yeri değil.
- **Mainnet v1'de yok.** Güvenlik denetimi öncesi mainnet'e çıkılmaz.

## 6. MVP kapsamı

`[VARSAYIM]` v1 hedefi, `pacta-full-spec.md` §10'daki 36 saatlik hackathon kapsamıdır ve SCF tur #46 Integration Track başvurusunu (son tarih 8 Kasım 2026) besleyecek şekilde yapılandırılır.

### 6.1 Kapsam içi

- Escrow kontratı testnet'te: FR-1, FR-2, FR-5, FR-6, FR-8, FR-10, FR-14, FR-22
- Zincir üstü İptal Politikası ve politikanın ödeme öncesi görünürlüğü: FR-7
- Varışta Çift Onay akışı, QR üretimi dahil: FR-9
- Klinik Rozeti statik doğrulama listesiyle: FR-11, FR-13
- Hasta ödeme sayfası, EUR girişi simüle: FR-15, FR-16
- Klinik paneli: FR-17, FR-18
- SEP-24 çekim akışı, test anchor'ına bağlı: FR-21
- Her adım için explorer doğrulanabilirliği: FR-23

### 6.2 MVP dışı

- **Hakem arayüzü** (FR-20 kontrat düzeyinde var, UI yok) — itiraz hacmi sıfırken UI yatırımı erken.
- **Doğrulama devre kesicisi** (FR-12) — `[NOTE FOR PM]` Bu ürünün meşruiyet argümanının merkezinde. v1'e sığmıyorsa SCF anlatısında "yapılacak" olarak değil, tasarımı bitmiş ve kontratta yeri hazır olarak sunulmalı.
- **Canlı Bakanlık kaydı sorgusu** — statik liste ile simüle edilir ve açıkça söylenir.
- **Gerçek TL off-ramp'i** — anchor bağımlılığı doğrulanmadı (§4.9).
- **Hastanın gerçek EUR → USDC girişi** — AB tarafında rampa/PSP gerekir.
- **Çoklu klinik onboarding'i** — tek pilot klinik yeterli.
- **Mainnet dağıtımı** — denetim sonrası.
- **Uzun tutma süresi testi** (FR-3, 180 gün) — `[NOTE FOR PM]` v1 demosunda kısa pencereyle gösterilir, ama TTL tasarımı baştan 180 güne göre yapılmalı; sonradan değiştirmek storage migrasyonu demek.

## 7. Başarı metrikleri

**Birincil**
- **SM-1**: Escrow'a giren kapora hacmi — testnet'te tamamlanmış anlaşma başına kilitlenen toplam tutar. v1 hedefi: demo senaryolarının ikisi de uçtan uca doğrulanabilir. SCF #46 için zincir üstü taahhüt metriği bu olur. FR-2, FR-8'i doğrular.
- **SM-2**: Tamamlanan anlaşma sayısı — `Released` veya `Refunded` ile kapanan anlaşmalar. FR-8, FR-5'i doğrular.

**İkincil**
- **SM-3**: Politika şeffaflığı — ödeme öncesi İptal Politikası'nı görmüş hasta oranı; hedef %100 (akış zorunlu kılar). FR-7'yi doğrular.
- **SM-4**: Serbest bırakmanın çift onayla gerçekleşme oranı — Zaman Aşımı yerine Varışta Çift Onay ile kapanan anlaşmaların payı. Yüksek olması ürünün asıl yolunun çalıştığını gösterir. FR-8, FR-10'u doğrular.

**Karşı metrikler (optimize edilmeyecek)**
- **SM-C1**: Serbest bırakma hızı. SM-1'i dengeler. Kaporayı daha hızlı kliniğe geçirmek hacmi büyütür ama ürünün tek değeri parayı **tutmak**. Hızlanma baskısı Varışta Çift Onay'ı zayıflatırsa ürün havaleye dönüşür.
- **SM-C2**: Onaylanan klinik sayısı. SM-1'i dengeler. Doğrulama çubuğunu düşürerek klinik sayısını büyütmek kısa vadede hacim getirir, ama "şüpheli klinikleri meşrulaştırıyorsunuz" itirazını haklı çıkarır ve ürünü öldürür.
- **SM-C3**: İade oranının düşüklüğü. SM-2'yi dengeler. Düşük iade oranı iyi görünür ama İptal Politikası'nı hasta aleyhine sıkılaştırmakla da elde edilebilir; o zaman ürün "iade yok"un pahalı bir versiyonu olur.

## 8. Cross-cutting NFR'ler

- **Güvenlik.** Kontrat, fon hareketi içeren her fonksiyonda checks-effects-interactions sırasına uyar. Soroban self-call'a izin vermediği için token transferleri SAC üzerinden yapılır. Mainnet öncesi bağımsız denetim zorunludur.
- **Yetki sınırları.** Hiçbir rol — Pacta dahil — escrow'daki parayı kendisine yönlendiremez. Hakem yalnızca oran belirler. Bu kısıtlar test edilebilir ve testleri zorunludur.
- **İzinsiz kurtarma.** Zaman Aşımı ve doğrulama düşmesi sonrası iade, işbirliği yapmayan bir karşı tarafa bağımlı olmamalıdır; izinsiz çağrılabilir.
- **Değişmezlik.** Fonlanmış bir Anlaşma'nın İptal Politikası, tutarı ve tarafları değiştirilemez.
- **Gözlemlenebilirlik.** Bir anlaşmanın tüm geçmişi `deal_id` ile tek sorguda okunabilir olmalıdır (FR-22).
- **Erişilebilirlik.** Hasta ödeme sayfası mobil öncelikli; hastalar akışa WhatsApp bağlantısından telefonla giriyor.
- **Dil.** Hasta arayüzü çok dilli olmak zorunda; v1'de İngilizce yeterli, ama metinler baştan yerelleştirilebilir tutulur.

## 9. Kısıtlar ve korkuluklar

**Regülasyon konumu.** Üç sütun üzerine kurulu ve üçü de üründe tasarım kısıtı olarak yaşıyor: hasta yurtdışında ödüyor (tahsilat Türkiye'de doğmuyor), para escrow'da kontratta (Pacta custody sunmuyor, KVHS lisans kapsamına girmiyor), klinik TL'yi lisanslı anchor'dan alıyor (yurtiçinde kripto ile hizmet bedeli ödenmiyor, 2021 yasağı tetiklenmiyor).

**Açık hukuki soru.** Hakem rolünün sorumluluğu. Pacta dağıtım kararına müdahil olduğu anda bir yükümlülük doğuyor mu? Alternatif tasarım: hakemliği tamamen kural tabanlı ve otomatik yapıp insan kararını minimuma indirmek. Avukat görüşü gerekir (§10 OQ-2).

**Veri.** Sağlık verisi zincire yazılmaz. Zincirde yalnızca taraflar, tutarlar, tarihler ve durumlar bulunur; tedavi türü, tıbbi bilgi veya kimlik bilgisi yazılmaz. `resource` benzeri alanlar yalnızca off-chain veriye hash taahhüdü olarak kullanılır.

**Maliyet.** Kapora €200-1.000 bandında; işlem başına zincir maliyeti komisyonu anlamsız kılmayacak düzeyde kalmalı. Anlaşma başına kontrat deploy etmemenin gerekçelerinden biri bu.

## 10. Açık sorular

1. ~~**OQ-1.** Trustless Work API'si Pacta'nın ihtiyacını karşılıyor mu?~~ **KAPANDI (2026-09-11).** Karşılamıyor. Yaşam döngüsü Initiation → Funding → Milestone Updates → Approval → Release fazlarından oluşuyor ve hiçbirinde zaman tetikleyicisi yok: serbest bırakma Release Signer, onay Approver imzası gerektiriyor. Tam veya kısmi her iade tek bir yoldan geçiyor — Dispute Resolver'ın açık dağıtım listesi imzalaması (`POST /escrow/multi-release/resolve-milestone-dispute`; API hataları "Only the dispute resolver can execute this function" ve "Milestone not in dispute" ile bunu doğruluyor). İzinsiz zaman aşımı yok; artık fon çekimi de (`withdraw-remaining-funds`) Dispute Resolver imzası istiyor.
   **Sonuç:** Pacta bu modelde Dispute Resolver olmak zorunda kalır, İptal Politikası zincirde çalışamaz ve iade Pacta'nın imzasına bağlanır — yani UJ-3'ün tüm anlamı ("iade bir müşteri hizmetleri konuşması değil, bir fonksiyon çağrısı") kaybolur, FR-10'daki kliniğin no-show koruması da Pacta'ya bağımlı hale gelir. Ayrıca platform + Trustless Work komisyonu €200-1.000 bandında Pacta'nın %1-1,5 komisyonunun üstüne biner.
   **Yan fayda:** Bu, SCF için güçlü bir farklılaşma argümanı. Pacta "bir escrow daha" değil; operatörünün bile tutarı seçemediği politika-icra eden escrow — ki baskın EaaS sağlayıcısı bunu yapısal olarak sunamıyor.
2. **OQ-2.** Hakem rolünün hukuki sorumluluğu nedir? Kural tabanlı otomatik çözüm bunu ortadan kaldırır mı?
3. **OQ-3.** Bookimed / Flymedi / Medigo kaporayı gerçekten tutuyor mu? Tutuyorlarsa konumlanma değişir. Spec'te "doğrulanmadı, kritik" olarak işaretli.
4. **OQ-4.** Sağlık turizminde rezervasyondan işlem tarihine tipik süre nedir? FR-3'teki 180 gün üst sınırı buna dayanıyor.
5. **OQ-5.** Zaman Aşımı penceresi kaç gün olmalı? Klinik nakit akışı ile hasta koruması arasındaki denge klinik görüşmeleriyle netleşir.
6. **OQ-6.** Sağlık Bakanlığı yetki belgesi kaydı için programatik sorgu arayüzü var mı, yoksa periyodik manuel liste güncellemesi mi gerekiyor?
7. **OQ-7.** Hastanın EUR → USDC girişi için hangi rampa/PSP kullanılacak ve sağlık turizmi işlem profilini kabul ediyor mu?
8. **OQ-8.** Kaporaların ne kadarı havale/WU ile, ne kadarı kartla ödeniyor? Ürünün tüm gerekçesi buna bağlı ve doğrulanmadı. Ölüm senaryosu: klinikler "kartla alıyoruz, chargeback nadir" derse pivot yönü kliniğin chargeback savunmasını otomatikleştiren kanıt ürünü olur.
9. **OQ-9.** Ajans kaporayı tutmanın nakit akışı avantajından, komisyon otomasyonu karşılığında vazgeçer mi? Vazgeçmezse dağıtım kanalı kapanır.

## 11. Varsayımlar indeksi

Downstream'e geçmeden onaylanması gerekenler **(bloke edici)**:

- **§4.1** — **17 Eylül'de revize edildi (D-10).** Escrow Trustless Work'te tutulur, Pacta yalnızca Politika Taahhüt Kontratı yazar. **Bloke edici ve doğrulanmamış:** Trustless Work'ün Eligible Integration Partners listesinde olması şart. Listede değilse Privy'ye dönülür.
- **§4.2** — İptal Politikası zincirde yaşar, ama **D-10 ile zayıflatıldı:** kademeler zincirde değiştirilemez biçimde durur ve dağıtım kamuya doğrulanabilir, ancak dağıtımı Pacta gönderir. "Hiçbir taraf tutarı keyfi belirleyemez" iddiası "keyfi belirlerse tespit edilir"e indi. **Bloke edici:** sunum ve SCF anlatısında bu fark dürüstçe ifade edilmeli.
- **§4.9** — v1 USDC teslimatında biter, TL simüle edilir, TheXBank ortaklık izi olarak takip edilir. **Bloke edici:** MVP kapsamını ve SCF anlatısını belirliyor.
- **§6** — v1 hedefi 36 saatlik hackathon kapsamı ve SCF #46'yı besleyecek yapılandırma. **Bloke edici:** tüm epic & story kırılımı buna dayanıyor.

Bloke etmeyenler:

- **§4.1 / FR-3** — 180 gün tutma üst sınırı (OQ-4 ile netleşir).
- **§4.3 / FR-10** — Zaman Aşımı N = 7 gün (OQ-5 ile netleşir).
- **§4.4 / FR-11** — Bakanlık kaydı v1'de statik liste (OQ-6 ile netleşir).
- **§4.6 / FR-15** — Hastanın EUR → USDC girişi v1'de simüle (OQ-7 ile netleşir).
