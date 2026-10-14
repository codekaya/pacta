import type { Tier } from './policy';

/**
 * Demo klinik kataloğu — /clinics sayfası ve rezervasyon akışı buradan okur.
 *
 * Klinikler kurgusal: gerçek bir kliniği izni olmadan "rezervasyon yap" düğmesiyle
 * listelemek hastayı o kliniğin Pacta ortağı olduğuna inandırır. Gerçek klinikler
 * pilot başvurusuyla, kendi onaylarıyla eklenir. Sayfalar her kartta "Demo" yazar.
 *
 * Fiyatlar İstanbul piyasasının kabaca ortasından seçildi; teklif değil, örnek.
 */

export type Treatment = 'hair' | 'dental' | 'aesthetic';
export type ScheduleName = 'standard' | 'strict' | 'generous';

/** Klinik formundaki üç şablon (components/DepositForm.tsx) — aynı kademeler. */
export const SCHEDULE_TIERS: Record<ScheduleName, Tier[]> = {
  standard: [
    { minDaysBefore: 14, refundBps: 10_000 },
    { minDaysBefore: 7, refundBps: 5_000 },
    { minDaysBefore: 0, refundBps: 0 },
  ],
  strict: [
    { minDaysBefore: 30, refundBps: 10_000 },
    { minDaysBefore: 14, refundBps: 5_000 },
    { minDaysBefore: 0, refundBps: 0 },
  ],
  generous: [
    { minDaysBefore: 7, refundBps: 10_000 },
    { minDaysBefore: 2, refundBps: 5_000 },
    { minDaysBefore: 0, refundBps: 0 },
  ],
};

type Text = { en: string; tr: string };

export type ClinicPackage = {
  id: string;
  /** Bildirime ve zincirdeki escrow açıklamasına bu yazılır (uygulama İngilizce). */
  name: Text;
  priceEurCents: number;
  stayNights: number;
  includes: { en: string[]; tr: string[] };
};

/**
 * Unsplash lisanslı fotoğraf (ücretsiz, ticari kullanım serbest; Unsplash+ değil — her biri
 * /napi/photos ile premium=false, plus=false doğrulandı). Klinikler kurgusal olduğu için
 * kurumsal hesaplardan (gerçek, tanınabilir bir klinik) gelen fotoğraflar bilerek kullanılmadı.
 */
export type ClinicPhoto = {
  /** Unsplash fotoğraf kimliği — atıf bağlantısı için. */
  id: string;
  /** images.unsplash.com yolu; boyutu lib/image-loader.ts ekler. */
  src: string;
  credit: string;
  alt: Text;
};

export type CatalogClinic = {
  id: string;
  slug: string;
  name: string;
  district: string;
  city: string;
  treatments: Treatment[];
  languages: string[];
  licenseNo: string;
  verifiedAt: number;
  /** Haritadaki konum (semt merkezi). */
  geo: { lat: number; lon: number };
  about: Text;
  schedule: ScheduleName;
  /** Kliniğin kabul ettiği kapora oranları, yüzde. */
  depositRates: number[];
  packages: ClinicPackage[];
  photos: { cover: ClinicPhoto; gallery: ClinicPhoto[] };
};

const day = (iso: string) => Date.parse(`${iso}T00:00:00+03:00`) / 1000;

const photo = (id: string, src: string, credit: string, en: string, tr: string): ClinicPhoto => ({
  id,
  src: `https://images.unsplash.com/photo-${src}`,
  credit,
  alt: { en, tr },
});

const PHOTOS = {
  brightOperatory: photo('e7MJLM5VGjY', '1629909613654-28e377c37b09', 'Benyamin Bohlouli', 'Bright dental treatment room with a white chair', 'Beyaz koltuklu, aydınlık diş tedavi odası'),
  tealLounge: photo('B_sK_xgzwVA', '1629909614456-6b1c5c94cecc', 'Benyamin Bohlouli', 'Waiting area with a teal sofa and plants', 'Turkuaz kanepeli, bitkili bekleme alanı'),
  whiteOperatory: photo('LQ698TTvGpA', '1629909615184-74f495363b67', 'Benyamin Bohlouli', 'Second treatment room with a blue chair', 'Mavi koltuklu ikinci tedavi odası'),
  greenReception: photo('5v0ffpkaVdw', '1672985019906-a176dbb5e6a1', 'Birk Enwald', 'Reception with a green desk and wooden floor', 'Yeşil bankolu, ahşap zeminli resepsiyon'),
  consultRoom: photo('jHr2_ffX02Q', '1672985020559-7ee234a5250f', 'Birk Enwald', 'Consultation desk by the window', 'Pencere kenarında konsültasyon masası'),
  hallway: photo('FBx4LTHrHEg', '1672985023428-a32e90d1895f', 'Birk Enwald', 'Bright hallway to the treatment rooms', 'Tedavi odalarına açılan aydınlık koridor'),
  modaTram: photo('LnjoPwP9uJk', '1667744954153-6660326a90ae', 'Oguzhan Tasimaz', 'The historic tram in Moda, Kadıköy', 'Kadıköy Moda’daki nostaljik tramvay'),
  orangeChair: photo('XJptUS8nbhs', '1598256989800-fe5f95da9787', 'Atikah Akhtar', 'Treatment room with an orange dental chair', 'Turuncu diş koltuklu tedavi odası'),
  scanReview: photo('VckdJzo7ig0', '1600170311833-c2cf5280ce49', 'Quang Tri NGUYEN', 'Reviewing a dental scan on a tablet', 'Tablette diş taramasının incelenmesi'),
  implantModel: photo('W9YEY6G8LVM', '1593022356769-11f762e25ed9', 'Jonathan Borba', 'Implant and crown models', 'İmplant ve kron modelleri'),
  galata: photo('MBtprjbSy-U', '1788244677529-8f88ebb0a30b', 'Ilker Ozmen', 'Galata and the Golden Horn', 'Galata ve Haliç'),
  treeLobby: photo('X8Y3CJA0aNs', '1648775507324-b48dd3791fa5', 'rawkkim', 'White lobby with a tree in the centre', 'Ortasında ağaç olan beyaz lobi'),
  theatre: photo('LPurJnihmQI', '1516549655169-df83a0774514', 'Marcel Scholte', 'Operating theatre', 'Ameliyathane'),
  bosphorusFerry: photo('ecgHmmPaJag', '1789313946210-08270b991411', 'Albert Canite', 'A ferry crossing the Bosphorus', 'Boğaz’da karşıya geçen vapur'),
  woodRoom: photo('-i6kaig732w', '1665231795856-769fb08a90bc', 'Marios Gkortsilas', 'Treatment room with wooden shelves and warm light', 'Ahşap raflı, sıcak ışıklı tedavi odası'),
  maidenTower: photo('KZtHqb3n9c4', '1788775076303-c0f5857b06b2', 'Georgii Eletskikh', 'Maiden’s Tower and the Asian side of İstanbul', 'Kız Kulesi ve İstanbul’un Anadolu yakası'),
  deskOperatory: photo('Fdku_oMrDvk', '1704455306251-b4634215d98f', 'Kari Bjorn Photography', 'Dental room with a consultation desk', 'Konsültasyon masalı diş odası'),
  equipment: photo('yJsMOVwazRU', '1704455306925-1401c3012117', 'Kari Bjorn Photography', 'Treatment room with imaging equipment', 'Görüntüleme cihazlı tedavi odası'),
  izmirBay: photo('7Sjatys9Uds', '1666514043902-8470366fee32', 'Berfin Işıldak', 'The bay of İzmir', 'İzmir körfezi'),
  antalyaCoast: photo('YNe63IdwQrY', '1756365132674-8837f3291f49', 'engin akyurt', 'The sea and mountains of Antalya', 'Antalya’nın denizi ve dağları'),
  theatreBright: photo('DE6rYp1nAho', '1551076805-e1869033e561', 'Arseny Togulev', 'Operating theatre with overhead lights', 'Tavan lambalı ameliyathane'),
  beach: photo('d8Olo1ZdKrc', '1675766007394-feb6a56f8081', 'Kseniia Poroshkova', 'A quiet beach on the coast', 'Sahilde sakin bir plaj'),
};

const STAY = { en: ['Hotel', 'Airport transfers', 'Interpreter'], tr: ['Otel', 'Havalimanı transferi', 'Tercüman'] };

export const CATALOG: CatalogClinic[] = [
  {
    id: 'cl-estetikistanbul',
    slug: 'estetik-istanbul',
    name: 'Estetik Istanbul',
    district: 'Şişli',
    city: 'İstanbul',
    treatments: ['dental', 'aesthetic'],
    languages: ['EN', 'DE', 'AR'],
    licenseNo: 'STB-34-2024-1187',
    verifiedAt: day('2026-03-02'),
    geo: { lat: 41.06, lon: 28.987 },
    about: {
      en: 'Implant and smile-design clinic in Şişli, with an in-house lab for crowns.',
      tr: 'Şişli’de implant ve gülüş tasarımı kliniği; kronlar için kendi laboratuvarı var.',
    },
    photos: { cover: PHOTOS.brightOperatory, gallery: [PHOTOS.tealLounge, PHOTOS.whiteOperatory] },
    schedule: 'standard',
    depositRates: [20, 25, 30],
    packages: [
      {
        id: 'six-implants',
        name: { en: 'Six implants, zirconia crowns', tr: 'Altı implant, zirkonyum kron' },
        priceEurCents: 320_000,
        stayNights: 7,
        includes: { en: ['3D scan', ...STAY.en], tr: ['3D tarama', ...STAY.tr] },
      },
      {
        id: 'hollywood-smile',
        name: { en: 'Smile design, 20 zirconia crowns', tr: 'Gülüş tasarımı, 20 zirkonyum kron' },
        priceEurCents: 360_000,
        stayNights: 6,
        includes: { en: ['Digital smile preview', ...STAY.en], tr: ['Dijital gülüş önizlemesi', ...STAY.tr] },
      },
      {
        id: 'rhinoplasty',
        name: { en: 'Rhinoplasty, open technique', tr: 'Burun estetiği, açık teknik' },
        priceEurCents: 340_000,
        stayNights: 7,
        includes: { en: ['One night in hospital', ...STAY.en], tr: ['Bir gece hastane', ...STAY.tr] },
      },
    ],
  },
  {
    id: 'cl-lalezar-hair',
    slug: 'lalezar-hair-studio',
    name: 'Lalezar Hair Studio',
    district: 'Kadıköy',
    city: 'İstanbul',
    treatments: ['hair'],
    languages: ['EN', 'DE', 'RU'],
    licenseNo: 'STB-34-2023-0412',
    verifiedAt: day('2026-02-11'),
    geo: { lat: 40.99, lon: 29.027 },
    about: {
      en: 'Hair restoration on the Asian side. One surgeon, one patient a day.',
      tr: 'Anadolu yakasında saç ekimi. Bir cerrah, günde bir hasta.',
    },
    photos: { cover: PHOTOS.greenReception, gallery: [PHOTOS.consultRoom, PHOTOS.hallway, PHOTOS.modaTram] },
    schedule: 'generous',
    depositRates: [10, 20],
    packages: [
      {
        id: 'fue-4000',
        name: { en: 'FUE hair transplant, 4,000 grafts', tr: 'FUE saç ekimi, 4.000 greft' },
        priceEurCents: 190_000,
        stayNights: 3,
        includes: { en: ['PRP session', 'Aftercare kit', ...STAY.en], tr: ['PRP seansı', 'Bakım seti', ...STAY.tr] },
      },
      {
        id: 'dhi-3500',
        name: { en: 'DHI hair transplant, 3,500 grafts', tr: 'DHI saç ekimi, 3.500 greft' },
        priceEurCents: 240_000,
        stayNights: 3,
        includes: { en: ['PRP session', 'Aftercare kit', ...STAY.en], tr: ['PRP seansı', 'Bakım seti', ...STAY.tr] },
      },
      {
        id: 'beard',
        name: { en: 'Beard transplant', tr: 'Sakal ekimi' },
        priceEurCents: 120_000,
        stayNights: 2,
        includes: { en: ['Aftercare kit', ...STAY.en], tr: ['Bakım seti', ...STAY.tr] },
      },
    ],
  },
  {
    id: 'cl-karakoy-smile',
    slug: 'karakoy-smile-atelier',
    name: 'Karaköy Smile Atelier',
    district: 'Beyoğlu',
    city: 'İstanbul',
    treatments: ['dental'],
    languages: ['EN', 'FR'],
    licenseNo: 'STB-34-2022-0975',
    verifiedAt: day('2026-01-20'),
    geo: { lat: 41.024, lon: 28.977 },
    about: {
      en: 'Veneers and full-arch implants, ten minutes from Galata.',
      tr: 'Galata’ya on dakika; lamina ve tam çene implant.',
    },
    photos: { cover: PHOTOS.orangeChair, gallery: [PHOTOS.scanReview, PHOTOS.implantModel, PHOTOS.galata] },
    schedule: 'strict',
    depositRates: [20, 30],
    packages: [
      {
        id: 'emax-veneers',
        name: { en: 'E.max veneers, 10 teeth', tr: 'E.max lamina, 10 diş' },
        priceEurCents: 280_000,
        stayNights: 5,
        includes: { en: ['Digital smile preview', ...STAY.en], tr: ['Dijital gülüş önizlemesi', ...STAY.tr] },
      },
      {
        id: 'all-on-4',
        name: { en: 'All-on-4 implants, one jaw', tr: 'All-on-4 implant, tek çene' },
        priceEurCents: 450_000,
        stayNights: 6,
        includes: { en: ['3D scan', 'Temporary bridge', ...STAY.en], tr: ['3D tarama', 'Geçici köprü', ...STAY.tr] },
      },
    ],
  },
  {
    id: 'cl-nisantasi-form',
    slug: 'nisantasi-form-clinic',
    name: 'Nişantaşı Form Clinic',
    district: 'Şişli',
    city: 'İstanbul',
    treatments: ['aesthetic'],
    languages: ['EN', 'AR', 'RU'],
    licenseNo: 'STB-34-2021-0638',
    verifiedAt: day('2026-02-27'),
    geo: { lat: 41.052, lon: 28.993 },
    about: {
      en: 'Plastic surgery in a hospital setting, with a nurse on call through recovery.',
      tr: 'Hastane ortamında plastik cerrahi; iyileşme boyunca nöbetçi hemşire.',
    },
    photos: { cover: PHOTOS.treeLobby, gallery: [PHOTOS.theatre, PHOTOS.bosphorusFerry] },
    schedule: 'strict',
    depositRates: [20, 30],
    packages: [
      {
        id: 'rhinoplasty',
        name: { en: 'Rhinoplasty', tr: 'Burun estetiği' },
        priceEurCents: 350_000,
        stayNights: 7,
        includes: { en: ['One night in hospital', ...STAY.en], tr: ['Bir gece hastane', ...STAY.tr] },
      },
      {
        id: 'liposuction',
        name: { en: 'Liposuction, two areas', tr: 'Liposuction, iki bölge' },
        priceEurCents: 280_000,
        stayNights: 5,
        includes: { en: ['Compression garment', ...STAY.en], tr: ['Korse', ...STAY.tr] },
      },
      {
        id: 'breast-augmentation',
        name: { en: 'Breast augmentation', tr: 'Göğüs büyütme' },
        priceEurCents: 390_000,
        stayNights: 6,
        includes: { en: ['One night in hospital', ...STAY.en], tr: ['Bir gece hastane', ...STAY.tr] },
      },
    ],
  },
  {
    id: 'cl-atasehir-hair',
    slug: 'atasehir-hair-and-skin',
    name: 'Ataşehir Hair & Skin',
    district: 'Ataşehir',
    city: 'İstanbul',
    treatments: ['hair'],
    languages: ['EN', 'AR'],
    licenseNo: 'STB-34-2024-0219',
    verifiedAt: day('2026-03-14'),
    geo: { lat: 40.992, lon: 29.124 },
    about: {
      en: 'Sapphire FUE and scalp treatments, close to the Asian-side business district.',
      tr: 'Safir FUE ve saç derisi bakımı; Anadolu yakası iş merkezine yakın.',
    },
    photos: { cover: PHOTOS.woodRoom, gallery: [PHOTOS.maidenTower] },
    schedule: 'standard',
    depositRates: [10, 20, 30],
    packages: [
      {
        id: 'sapphire-fue',
        name: { en: 'Sapphire FUE, 4,500 grafts', tr: 'Safir FUE, 4.500 greft' },
        priceEurCents: 210_000,
        stayNights: 3,
        includes: { en: ['PRP session', ...STAY.en], tr: ['PRP seansı', ...STAY.tr] },
      },
      {
        id: 'fue-3000',
        name: { en: 'FUE hair transplant, 3,000 grafts', tr: 'FUE saç ekimi, 3.000 greft' },
        priceEurCents: 170_000,
        stayNights: 3,
        includes: { en: ['Aftercare kit', ...STAY.en], tr: ['Bakım seti', ...STAY.tr] },
      },
    ],
  },
  {
    id: 'cl-alsancak-dental',
    slug: 'alsancak-dental-point',
    name: 'Alsancak Dental Point',
    district: 'Alsancak',
    city: 'İzmir',
    treatments: ['dental'],
    languages: ['EN', 'DE', 'NL'],
    licenseNo: 'STB-35-2023-0144',
    verifiedAt: day('2026-02-03'),
    geo: { lat: 38.437, lon: 27.143 },
    about: {
      en: 'Implant clinic by the Aegean, popular with patients from Germany and the Netherlands.',
      tr: 'Ege kıyısında implant kliniği; Almanya ve Hollanda’dan gelen hastaların tercihi.',
    },
    photos: { cover: PHOTOS.deskOperatory, gallery: [PHOTOS.equipment, PHOTOS.izmirBay] },
    schedule: 'standard',
    depositRates: [20, 30],
    packages: [
      {
        id: 'four-implants',
        name: { en: 'Four implants, zirconia crowns', tr: 'Dört implant, zirkonyum kron' },
        priceEurCents: 230_000,
        stayNights: 6,
        includes: { en: ['3D scan', ...STAY.en], tr: ['3D tarama', ...STAY.tr] },
      },
      {
        id: 'crowns-12',
        name: { en: '12 zirconia crowns', tr: '12 zirkonyum kron' },
        priceEurCents: 216_000,
        stayNights: 5,
        includes: { en: ['Digital smile preview', ...STAY.en], tr: ['Dijital gülüş önizlemesi', ...STAY.tr] },
      },
    ],
  },
  {
    id: 'cl-lara-aesthetic',
    slug: 'lara-aesthetic',
    name: 'Lara Aesthetic',
    district: 'Lara',
    city: 'Antalya',
    treatments: ['aesthetic', 'dental'],
    languages: ['EN', 'DE', 'RU'],
    licenseNo: 'STB-07-2022-0331',
    verifiedAt: day('2026-01-29'),
    geo: { lat: 36.857, lon: 30.79 },
    about: {
      en: 'Surgery and recovery by the sea, with a recovery hotel next door.',
      tr: 'Deniz kenarında ameliyat ve iyileşme; hemen yanında iyileşme oteli.',
    },
    photos: { cover: PHOTOS.antalyaCoast, gallery: [PHOTOS.theatreBright, PHOTOS.beach] },
    schedule: 'generous',
    depositRates: [15, 25],
    packages: [
      {
        id: 'tummy-tuck',
        name: { en: 'Tummy tuck', tr: 'Karın germe' },
        priceEurCents: 360_000,
        stayNights: 8,
        includes: { en: ['Two nights in hospital', ...STAY.en], tr: ['İki gece hastane', ...STAY.tr] },
      },
      {
        id: 'rhinoplasty',
        name: { en: 'Rhinoplasty', tr: 'Burun estetiği' },
        priceEurCents: 320_000,
        stayNights: 7,
        includes: { en: ['One night in hospital', ...STAY.en], tr: ['Bir gece hastane', ...STAY.tr] },
      },
      {
        id: 'veneers-8',
        name: { en: 'Porcelain veneers, 8 teeth', tr: 'Porselen lamina, 8 diş' },
        priceEurCents: 200_000,
        stayNights: 5,
        includes: { en: STAY.en, tr: STAY.tr },
      },
    ],
  },
];

export function catalogClinic(slug: string): CatalogClinic | undefined {
  return CATALOG.find((c) => c.slug === slug);
}

export function startingPrice(clinic: CatalogClinic): number {
  return Math.min(...clinic.packages.map((p) => p.priceEurCents));
}
