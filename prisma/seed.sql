-- =====================================================================
-- Günübirlik Platformu - Başlangıç Verileri (Seed Data)
-- =====================================================================

-- 1. Site Ayarları
INSERT INTO "SiteSettings" ("id", "maintenanceMode", "maintenanceTitle", "maintenanceMessage", "siteName", "contactEmail", "contactPhone", "updatedAt")
VALUES (
    'singleton',
    false,
    'Bakım Çalışması Devam Ediyor',
    'Daha iyi bir deneyim sunabilmek için sistemimizi güncelliyoruz. Kısa süre sonra tekrar hizmetinizde olacağız.',
    'Günübirlik İş Bul',
    'destek@gunubirlik.com',
    '+90 850 123 45 67',
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 2. Varsayılan Kullanıcılar (Şifrelerin hepsi: admin123)
-- Admin
INSERT INTO "User" (
    "id", "email", "password", "fullName", "role", "city", "district",
    "isVerified", "emailVerified", "walletBalance", "walletCurrency", "updatedAt"
) VALUES (
    'usr_admin_001',
    'admin@gunubirlik.com',
    '$2b$10$Xd1pyaN6SxNAK9qcHFNqZeD8EByWT.QuI2Narj4px9OgM3DI7MIRa',
    'Sistem Yöneticisi',
    'ADMIN',
    'İstanbul',
    'Şişli',
    true,
    true,
    10000.0,
    'TRY',
    NOW()
) ON CONFLICT ("email") DO NOTHING;

-- İşveren
INSERT INTO "User" (
    "id", "email", "password", "fullName", "role", "companyName", "city", "district",
    "latitude", "longitude", "isVerified", "emailVerified", "walletBalance", "walletCurrency", "updatedAt"
) VALUES (
    'usr_employer_001',
    'isveren@gunubirlik.com',
    '$2b$10$Xd1pyaN6SxNAK9qcHFNqZeD8EByWT.QuI2Narj4px9OgM3DI7MIRa',
    'Ahmet Yılmaz',
    'EMPLOYER',
    'Yılmaz İnşaat & Lojistik',
    'İstanbul',
    'Kadıköy',
    40.9906,
    29.0254,
    true,
    true,
    5000.0,
    'TRY',
    NOW()
) ON CONFLICT ("email") DO NOTHING;

-- İş Arayan / İşçi
INSERT INTO "User" (
    "id", "email", "password", "fullName", "role", "skills", "experienceYears",
    "hourlyWageMin", "hourlyWageMax", "city", "district", "latitude", "longitude",
    "isAvailable", "emailVerified", "walletBalance", "walletCurrency", "updatedAt"
) VALUES (
    'usr_worker_001',
    'isci@gunubirlik.com',
    '$2b$10$Xd1pyaN6SxNAK9qcHFNqZeD8EByWT.QuI2Narj4px9OgM3DI7MIRa',
    'Mehmet Usta',
    'WORKER',
    '["Boya", "Alçı", "Fayans", "Tesisat"]',
    5,
    150.0,
    250.0,
    'İstanbul',
    'Üsküdar',
    41.0264,
    29.0157,
    true,
    true,
    350.0,
    'TRY',
    NOW()
) ON CONFLICT ("email") DO NOTHING;

-- 3. Örnek İş İlanları
INSERT INTO "Job" (
    "id", "employerId", "title", "description", "category", "requiredSkills",
    "workDate", "startTime", "endTime", "durationHours", "wageAmount", "wageType", "currency",
    "city", "district", "address", "latitude", "longitude", "openingsTotal", "openingsFilled",
    "status", "urgency", "approvalStatus", "updatedAt"
) VALUES 
(
    'job_001',
    'usr_employer_001',
    'Kadıköy İnşaat Alanına Günlük Boya ve Alçı Ustası',
    'Şantiye ortamında iç cephe boya ve alçı işlerini yapacak, iş disiplini yüksek usta aranıyor. Öğle yemeği ve çay molası fiyata dahildir.',
    'INSAAT',
    '["Boya", "Alçı"]',
    NOW() + INTERVAL '1 day',
    '08:30',
    '17:30',
    9.0,
    1800.0,
    'DAILY',
    'TRY',
    'İstanbul',
    'Kadıköy',
    'Moda Cad. No: 45',
    40.9850,
    29.0280,
    2,
    0,
    'OPEN',
    'HIGH',
    'APPROVED',
    NOW()
),
(
    'job_002',
    'usr_employer_001',
    'Akşam Vardiyası Restoran Komi / Servis Elemanı',
    'Hafta sonu akşam yoğunluğunda masaları toplayacak ve garsonlara destek olacak dinamik çalışma arkadaşı arıyoruz.',
    'RESTAURANT',
    '["Servis", "İletişim"]',
    NOW() + INTERVAL '2 day',
    '16:00',
    '23:00',
    7.0,
    950.0,
    'DAILY',
    'TRY',
    'İstanbul',
    'Beşiktaş',
    'Çarşı İçi No: 12',
    41.0422,
    29.0067,
    1,
    0,
    'OPEN',
    'NORMAL',
    'APPROVED',
    NOW()
),
(
    'job_003',
    'usr_employer_001',
    'Ofis Genel Temizliği İçin Günlük Personel',
    '3 katlı şirket merkezimizde genel süpürme, silme ve cam temizliği işlerini yapacak deneyimli temizlik personeli.',
    'TEMIZLIK',
    '["Ofis Temizliği", "Cam Silme"]',
    NOW() + INTERVAL '1 day',
    '09:00',
    '15:00',
    6.0,
    1200.0,
    'DAILY',
    'TRY',
    'İstanbul',
    'Şişli',
    'Mecidiyeköy Büyükdere Cad.',
    41.0667,
    28.9850,
    1,
    0,
    'OPEN',
    'NORMAL',
    'APPROVED',
    NOW()
),
(
    'job_004',
    'usr_employer_001',
    'Evden Eve Eşya Taşıma / Nakliye Elemanı',
    'Kamyondan 3. kata mobilya ve beyaz eşya taşıma işi. Fiziksel gücü yerinde ve dikkatli arkadaşlar aranmaktadır.',
    'NAKLIYE',
    '["Ağır Yük Taşıma", "Montaj"]',
    NOW() + INTERVAL '3 day',
    '09:30',
    '16:30',
    7.0,
    1500.0,
    'DAILY',
    'TRY',
    'İstanbul',
    'Ümraniye',
    'Alemdağ Cad. No: 88',
    41.0250,
    29.0950,
    3,
    0,
    'OPEN',
    'URGENT',
    'APPROVED',
    NOW()
);

-- 4. Temel Moderasyon Kuralları
INSERT INTO "ModerationRule" ("id", "name", "description", "type", "pattern", "severity", "action", "isEnabled", "isSystem", "updatedAt")
VALUES 
(
    'rule_phone_001',
    'Telefon Numarası Filtresi',
    'Mesajlarda cep telefonu paylaşımını filtreler',
    'PHONE',
    '(05\d{2}[- ]?\d{3}[- ]?\d{2}[- ]?\d{2})',
    'HIGH',
    'FILTER',
    true,
    true,
    NOW()
),
(
    'rule_iban_001',
    'IBAN / Banka Bilgisi Filtresi',
    'Mesajlaşma üzerinden doğrudan para transferi yapılmasını engeller',
    'IBAN',
    'TR\d{2}\s?(\d{4}\s?){5}\d{2}',
    'CRITICAL',
    'FILTER',
    true,
    true,
    NOW()
) ON CONFLICT DO NOTHING;
