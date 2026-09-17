---
stepsCompleted: [1]
inputDocuments:
  - pacta-full-spec.md
  - docs/pacta-rakip-haritasi.md
  - docs/prds/prd-Pacta-2026-09-11/prd.md
  - docs/prds/prd-Pacta-2026-09-11/addendum.md
  - docs/prds/prd-Pacta-2026-09-11/.decision-log.md
  - contracts/upto/src/lib.rs
  - contracts/upto/src/types.rs
  - contracts/upto/src/storage.rs
workflowType: 'architecture'
project_name: 'Pacta'
user_name: 'Kaya'
date: '2026-09-11'
---

# Pacta — Mimari Karar Dokümanı

_Bu doküman adım adım, birlikte karar alarak büyür. Her adımda bölüm eklenir._

## Adım 1 — Başlatma

Çalışma alanı kuruldu. Girdi dokümanları keşfedildi ve yüklendi (yukarıdaki `inputDocuments`).

Bu noktada mimari kararların üstüne kurulacağı zemin şu:

- **PRD mevcut** — `docs/prds/prd-Pacta-2026-09-11/prd.md`, 23 FR, 6 kullanıcı yolculuğu, `status: draft`.
- **UX spesifikasyonu yok** — `create-ux-design` çalıştırılmadı. Hasta ödeme sayfası ve klinik paneli için arayüz kararları bu dokümanda ürün düzeyinde ele alınacak, ekran düzeyinde değil.
- **Mevcut kod var** — `contracts/upto`, x402 `upto` şemasının Soroban referans implementasyonu. Escrow çekirdeği için şablon olarak seçildi (PRD §4.1, addendum A1).
- **Bir alternatif araştırıldı ve elendi** — Trustless Work EaaS (addendum A2). Karar gerekçeli, mimari bu karardan sonra başlıyor.
