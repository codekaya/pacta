# Pacta — Durum Tespiti ve Yapılacaklar
**17 Eylül 2026 · Hackathon'a 2 gün (19-20 Eylül, Scale Track)**

---

## 1. Nerede duruyoruz

### Var olanlar

| Parça | Durum | Satır |
|---|---|---|
| `contracts/upto` | x402 `upto` şeması Soroban referans implementasyonu, testli, snapshot testleri geçiyor | ~976 |
| `anchor/` | SEP-1/10/12/38/6 istemcisi, **gerçek testnet işlemleriyle çalışıyor**, TR Mock Anchor'a bağlı, onramp+offramp demo'su var | 847 |
| Doküman katmanı | Spec, PRD paketi (23 FR), rakip haritası, hackathon stratejisi, 10 günlük saha planı | — |
| `docs/architecture.md` | Yalnızca Adım 1 (başlatma) | — |

**Anchor bacağı 12 Eylül stratejisinden sonra yazılmış ve bu büyük bir ilerleme.** Strateji raporu "gerçek TL anchor'ı yok, puanlanan şart karşılanmıyor" diyordu; artık gerçek SEP akışı, gerçek testnet USDC hareketi, gerçek kur teklifi ve memo eşleşmesi var. Simüle kalan tek şey banka rayının kendisi (`simulateBankTransfer`) — ki üretimde de zaten anchor'ın tarafında.

### Olmayanlar

- **Pacta escrow kontratı: 0 satır.** Spec §6.2 yedi durumlu bir state machine tarif ediyor, kodda karşılığı yok.
- **Hiçbir arayüz yok.** Hasta ödeme sayfası yok, klinik paneli yok, QR çift onay akışı yok.
- **Eligible ekosistem entegrasyonu yok.** Bu yalnızca puan değil, Scale Track'in **başvuru koşulu** (strateji §2).
- Mimari diyagram yok, SCF yol haritası slaytı yok, sunum yok.

### Takvim gerçeği

Bugün 17 Eylül Perşembe. Hackathon Cumartesi sabahı başlıyor. Yani elimizde **bugün akşam + Cuma tam gün**, sonra 36 saat. Strateji raporu 12 Eylül'de "7 gün ön inşa şart" diyordu; o 7 gün saha çalışmasına gitti ve ön inşa yapılmadı. Ön inşa penceresi 7 günden 1,5 güne indi.

**Bu, planın yeniden hesaplanmasını zorunlu kılıyor.** Yedi durumlu escrow kontratını + iki arayüzü + entegrasyonu + anchor bağlantısını + sunumu 1,5 gün + 36 saate sığdırmak gerçekçi değil. Bir şey kesilmek zorunda ve hangisi olduğuna bilinçli karar vermek gerekiyor.

---

## 2. Trustless Work kararı yeniden açılıyor

### 11 Eylül'deki karar neden değişiyor

OQ-1'de Trustless Work'ü elemiştim ve **teknik gerekçe hâlâ geçerli**: yaşam döngüsünde zaman tetikleyicisi yok, her iade Dispute Resolver imzasından geçiyor, dolayısıyla İptal Politikası o modelde kendi başına çalışamaz.

Ama o karar farklı bir kısıt kümesi altında alındı. Değişenler:

1. **Entegrasyon bir başvuru koşulu** — teknik tercih değil, elenme sebebi.
2. **Escrow kontratı hâlâ 0 satır** ve ön inşa penceresi 1,5 güne indi.
3. **Anchor bacağı bitti** — en zor dış bağımlılık kapandı, kalan risk tamamen kendi kodumuzda.

Yani soru artık "Trustless Work teknik olarak ideal mi" değil, **"1,5 gün + 36 saatte puanlanan bir teslim nasıl çıkar"**. Kendi kontratımızı yazma yolu, en iyi senaryoda kontratı bitirip entegrasyonu ve sunumu yetiştiremediğimiz bir hafta sonu üretiyor.

### Önerilen yol: hibrit — TW escrow'u tutar, Pacta politikayı taahhüt eder

Ne ayrı ayrı yol da doğru değil. Kendi kontratımız takvimi patlatıyor; düz TW entegrasyonu ise ürünün tek farklılaşmasını (politika kodda çalışıyor, kimse tutarı seçemiyor) yok ediyor — ki bu, "escrow'da altı fonlu proje var, siz neden farklısınız" sorusunun tek cevabıydı.

**Hibrit:**

- **Trustless Work parayı tutar.** Single-Release escrow. Gerçek custody, gerçek yük taşıyıcı entegrasyon — dekoratif değil.
- **Pacta küçük bir Soroban kontratı yazar: Politika Taahhüt Kontratı (PTK).** Para tutmaz. Anlaşma başına iptal politikası kademelerini, işlem tarihini, tarafları ve ajans oranını **değiştirilemez** biçimde saklar. Salt-okunur `entitlement(deal_id, timestamp) -> (klinik_bps, hasta_bps, ajans_bps)` fonksiyonu verir. Oluşturmada ve her dağıtımda event yayar.
- Pacta `releaseSigner` / `disputeResolver` olarak TW'ye dağıtım gönderirken, gönderdiği dağıtımın PTK'nın hesapladığıyla aynı olması gerekir — **ve bunu herkes bağımsızca doğrulayabilir.**

**Dürüst zayıflığı:** bu "ihlal edilemez" değil, "ihlal edildiği kanıtlanabilir". Kendi escrow'umuzda politika zorlanıyordu; burada denetlenebiliyor. Bu farkı sunumda saklamak yerine açıkça söylemek gerekiyor — jüri zaten soracak.

**Neden buna değer:**

- Entegrasyon koşulu gerçekten karşılanır ve yük taşıyıcıdır (para orada).
- Farklılaşma anlatısı ayakta kalır: politika zincirde, değiştirilemez, kamuya doğrulanabilir.
- PTK küçük — fon hareketi olmayan bir hesap makinesi. 1,5 günde yazılabilir; yedi durumlu escrow yazılamaz.
- `upto` soy bağı korunur: `deal_id` türetimi için `sha256(domain || contract || payload)` deseni ve domain separator doğrudan devralınır.
- **Jüri çerçevesi tersine döner.** "Ekosistemin escrow'unu reddettik" (anti-Scale) yerine "ekosistemin escrow'uyla kompoze ettik ve eksik olan primitifi ekledik" (tam Scale).

### Rol eşlemesi — şaşırtıcı derecede iyi oturuyor

TW'nin Single-Release rolleri Pacta'nın Varışta Çift Onay akışına birebir denk geliyor:

| TW rolü | Pacta'da kim | Neden |
|---|---|---|
| `serviceProvider` | Klinik | Milestone'u "hasta klinikte" olarak işaretler |
| `approver` | **Hasta** | Onaylar → çift onayın hasta bacağı |
| `receiver` | Klinik (veya splitter) | Parayı alan |
| `releaseSigner` | Pacta | PTK'nın hesabını uygular |
| `disputeResolver` | Pacta (v1) | İptal ve itiraz yolu |
| `platformAddress` | Pacta | Komisyon |

Tek milestone: *"Hasta klinikte, tedaviye başlandı."* Klinik işaretler, hasta onaylar, Pacta serbest bırakır. **UJ-2 bu üçlüyle aynen çalışıyor.**

### Mekanik uyarlamalar — bunlar PRD'yi değiştiriyor

| PRD | TW'de karşılığı | Aksiyon |
|---|---|---|
| **FR-5/FR-6 iptal** | Zaman tetikleyicisi yok. İptal = `dispute-escrow` + `resolve-dispute`, PTK'nın hesapladığı `distributions` ile | İade yolu "itiraz açıp çözme" olarak yeniden yazılmalı — isim garip ama mekanik doğru |
| **FR-10 izinsiz zaman aşımı** | Yok. Pacta'nın tetiklemesi gerekiyor (keeper) | Dürüstçe "v1'de Pacta keeper'ı tetikliyor" denmeli. İzinsizlik kaybı gerçek bir taviz |
| **FR-12 doğrulama devre kesici** | Resolver imzası olmadan otomatik iade yok | Zaten MVP dışıydı, öyle kalır |
| **FR-14 çok taraflı dağıtım** | **Açık soru.** Normal release tek `receiver`'a ödüyor; çok taraflı dağıtım itiraz yolunda görünüyor | Aşağıya bak — SoroSplits seçeneği |
| **FR-4 yuvarlama artığı hastaya** | `distributions` toplamı tam eşleşmek zorunda | PTK bps hesabında artığı hastaya yazar, toplam invariant'ı test edilir |

**Ajans komisyonu için elegant çözüm:** `receiver` olarak **SoroSplits** kontratını ver. SoroSplits Türkiye merkezli, SCF'den $153.700 almış ve tam olarak "birden çok taraf arasında trustless otomatik gelir paylaşımı" yapıyor. Bu hem FR-14'ü çözer hem **ikinci bir ekosistem entegrasyonu** olur. Doğrulanması gerekiyor (testnet'te çalışıyor mu, deposit arayüzü uygun mu) ama bedeli düşük, getirisi yüksek.

### Doğrulanmış pratik bilgiler

- **API anahtarı self-service, onay beklemesi yok.** Freighter ile `dapp.trustlesswork.com`'a bağlan → Settings → profil + **use case alanı zorunlu** → API Keys → Testnet → üret. Anahtar bir kez gösteriliyor, hemen kopyala. Dakikalar sürer, **bloke edici değil.**
- Base URL testnet: `https://dev.api.trustlesswork.com` · Swagger: `/docs`
- Rate limit: 50 istek / 60 saniye. Demo için bol.
- Yazma endpoint'leri **imzasız XDR** döndürüyor; rol cüzdanıyla imzalayıp `/helper/send-transaction` ile gönderiyorsun. **`anchor/src`'teki `SignXdr` soyutlaması bu akışa doğrudan uyuyor** — yeniden kullanılabilir.
- Mainnet'te %0,3 protokol komisyonu. Pacta'nın %1-1,5'inin üstüne biner, iş modeline not. Testnet ücretsiz.
- Gereken endpoint'ler: `/deployer/single-release`, `/helper/set-trustline`, `/escrow/single-release/fund-escrow`, `/escrow/single-release/change-milestone-status`, `/escrow/single-release/approve-milestone`, `/escrow/single-release/release-funds`, `/escrow/single-release/dispute-escrow`, `/escrow/single-release/resolve-dispute`, `/helper/send-transaction`, `/helper/get-escrows-by-role`

---

## 3. Yapılacaklar

### Sıfırıncı madde — her şeyi bu belirliyor

- [ ] **Trustless Work Eligible Integration Partners listesinde mi?** Doğrulanmadı ve bu dokümandaki tüm plan buna dayanıyor. Handbook'u kontrol et veya organizatöre yaz. **Listede değilse** hibrit planın entegrasyon ayağı çöker; o durumda strateji §4'teki Privy (düşük efor, FR-15'i çözüyor) + DeFindex Varyant A'ya dön — ama escrow'u TW'de tutma kararı takvim gerekçesiyle yine savunulabilir.
- [ ] **Organizatöre sor:** TRY anchor'ı `tr-mock-anchor.fly.dev` mi, yoksa etkinlikte başka bir anchor mı gelecek? Elimizdeki bacağın hedefi değişirse `config.ts` tek yerden dönüyor ama önceden bilmek gerek.
- [ ] **Organizatöre sor:** birden fazla track seçilebiliyor mu (strateji §7'de duruyor, hâlâ cevapsız).

### Bugün akşam + Cuma (ön inşa penceresi)

**Öncelik 1 — Trustless Work hattını uçtan uca çalıştır.** Bu bitmezse hibrit plan yok.
- [ ] API anahtarı al (testnet), `.env`'e koy
- [ ] `anchor/src/http.ts` ve `SignXdr` desenini yeniden kullanarak `tw/` istemcisi yaz: deploy → set-trustline → fund → change-milestone-status → approve-milestone → release-funds
- [ ] Testnet'te tek bir anlaşmanın tamamını CLI'dan geçir (`npm run tw:demo` gibi), explorer linklerini kaydet
- [ ] İptal yolunu da geçir: `dispute-escrow` → `resolve-dispute` ile kısmi dağıtım

**Öncelik 2 — Politika Taahhüt Kontratı.** Küçük tut, fon hareketi yok.
- [ ] `contracts/policy/` — `commit_policy(deal_id, tiers, procedure_date, parties, agency_bps)`, `entitlement(deal_id, at) -> (bps üçlüsü)`, `policy_of(deal_id)`
- [ ] `deal_id` türetimini `upto`'dan devral (domain separator + `sha256(domain || contract || payload)`)
- [ ] Değişmezlik testi: taahhüt edilmiş politika ikinci kez yazılamaz
- [ ] Toplam invariant testi: üç bps toplamı tam 10000, artık hastaya
- [ ] Kademe sınır testleri: tam kademe geçişlerinde, işlem tarihinde, tarihten sonra
- [ ] Testnet deploy, contract id'yi kaydet

**Öncelik 3 — Arayüz iskeleti.** İki sayfa, süslemesiz.
- [ ] Hasta ödeme sayfası: klinik rozeti (statik liste), PTK'dan okunan iptal politikası tablosu (**takvim tarihi + euro tutarı**, sadece yüzde değil — FR-7), ödeme, escrow durumu + explorer linki
- [ ] Klinik paneli: bekleyen anlaşmalar, "kilitli" durumu açıkça, QR üretimi, `anchor/`'ı import eden çekim ekranı

### Hackathon (36 saat)

- [ ] QR çift onay akışını bağla (klinik işaretler → hasta onaylar → Pacta serbest bırakır)
- [ ] `anchor/`'ı klinik paneline gerçekten bağla — kod hazır, sadece panele takılacak, **düşük risk yüksek puan**
- [ ] SoroSplits'i `receiver` olarak dene; yürümezse ajans komisyonunu itiraz yolundan veya platform fee'den öde ve bunu söyle
- [ ] İki demo senaryosunun provası: (a) hasta öder → kilitlenir → klinik görür ama dokunamaz → QR → serbest → TL çekimi, (b) 20 gün önce iptal → PTK hesaplar → tam iade
- [ ] **Gerçek bir klinikle testnet'te gerçek bir anlaşma aç** (saha planı Gün 8-9'daki sıcak 5 klinikten biri). "Onboarded real users" takip edilen metrik ve bu tek hareket ekibi ayırır
- [ ] Mimari diyagram: hasta → Pacta → TW escrow + PTK → serbest bırakma → klinik → anchor → TL
- [ ] SCF #46 yol haritası slaytı (PRD §7'den SM-1, SM-2 birebir)
- [ ] Submission: kullanılan skill dosyalarının **path listesi** (strateji §7'de bu madde duruyor)
- [ ] Sunum açılışı saha verisiyle, kontratla değil

### Yapılmayacaklar — bilinçli kesintiler

- Yedi durumlu kendi escrow kontratımız. `Disputed`/`Resolved` dahil tüm state machine TW'ye devredildi.
- Hakem arayüzü (PRD zaten MVP dışında tutuyordu).
- Doğrulama devre kesicisi FR-12.
- Canlı Bakanlık kaydı sorgusu — statik liste, açıkça söylenir.
- Hastanın gerçek EUR → USDC girişi — simüle, açıkça söylenir.
- Mainnet.
- DeFindex. Strateji §4'te Katman 2 olarak duruyordu; 1,5 günlük pencerede TW + PTK ile birlikte sığmaz. **SCF #46 anlatısında "Faz 2" olarak kalır** ve sunumda yol haritasında görünür.

---

## 4. Jüriye hazır cevaplar (güncellendi)

**"Neden kendi escrow'unuzu yazmadınız?"** — Yazdık, ama yalnızca ekosistemde olmayan parçayı: politika taahhüdü. Parayı Trustless Work tutuyor çünkü escrow primitifi ekosistemde zaten var ve iyi çözülmüş. Bizim eklediğimiz şey, operatörün takdirini denetlenebilir kılan zincir üstü politika kaydı — bu, altı fonlu escrow projesinin hiçbirinde yok.

**"Trustless Work zaten iade yapıyor, farkınız ne?"** — Trustless Work'te iade Dispute Resolver'ın seçtiği tutardır. Pacta'da iade, hasta ödemeden önce gördüğü ve zincirde değiştirilemez biçimde duran kademelerden hesaplanır; Pacta farklı bir tutar gönderirse bu herkes tarafından tespit edilebilir. Takdiri kaldırmadık, **denetlenebilir yaptık** — ve bunun "imkânsız" olmadığını da söylüyoruz.

**"Escrow'da altı fonlu proje var."** — Hiçbiri dikeyde değil. 728 projede sağlık+ödeme kesişiminde tek kayıt `SecuRx` ve o reçete güvenliği. Bizim moat'ımız escrow değil: Bakanlık yetki belgesi doğrulaması, sağlık turizmine özel iptal politikası şablonları, varışta QR onayı ve ajans dağıtım kanalı.

**"Ekosisteme değeriniz?"** — TL off-ramp'i. 14 anchor'ın hiçbiri Türk değil, hiçbiri TL desteklemiyor; Türkiye merkezli 11 fonlu SCF projesi var ama tek on/off-ramp adayı fonsuz. Anchor bacağı bizde yapıştırma değil, belkemiği — ve çalışıyor.

**"Regülasyon?"** — Spec §7'deki üç sütun: hasta yurtdışında ödüyor, para escrow'da kontratta (Pacta custody sunmuyor), klinik TL'yi lisanslı anchor'dan alıyor. TW'nin non-custodial olması bu konumu zayıflatmıyor, güçlendiriyor.

---

## 5. En büyük risk

Sıfırıncı maddenin cevabı "Trustless Work listede yok" çıkarsa, 1,5 günlük pencerede hem entegrasyonu hem escrow'u kurmak zorunda kalırız ve o durumda **bir şey mutlaka teslim edilemez.** O senaryoda önerim: Privy'yi entegrasyon olarak al (düşük efor, FR-15'i gerçekten çözüyor), escrow'u yine TW'de tut (takvim gerekçesiyle, entegrasyon puanı olmasa da iş yükünü kaldırıyor), PTK'yı koru.

Bu yüzden sıfırıncı madde bu akşam cevaplanmalı — Cuma sabahına bırakılacak bir soru değil.
