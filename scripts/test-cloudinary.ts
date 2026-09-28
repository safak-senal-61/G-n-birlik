/**
 * Cloudinary Bağlantı Testi
 * Çalıştır: bun run scripts/test-cloudinary.ts
 */
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: 'ofnzn8ib',
  api_key: '258463269172581',
  api_secret: 'zSnd9bcjqtpIdGwIv83hXvjVoSI',
  secure: true,
})

async function testConnection() {
  console.log('🔄 Cloudinary bağlantısı test ediliyor...\n')
  console.log('   Cloud Name: ofnzn8ib')
  console.log('   API Key:    258463269172581')
  console.log('   API Secret: zSnd9bcjqtpIdGwIv83hXvjVoSI\n')

  try {
    // 1. Hesap bilgilerini al (usage stats)
    const usage = await cloudinary.api.usage()
    console.log('✅ Cloudinary bağlantısı başarılı!\n')
    console.log('   Hesap aktif, API erişimi çalışıyor.')
    console.log('   Plan:', usage.plan)
    console.log('   Kullanılan storage:', (usage.storage?.usage / 1024 / 1024).toFixed(2), 'MB /', (usage.storage?.limit / 1024 / 1024).toFixed(0), 'MB')
    console.log('   Bu ay kullanılan bandwidth:', (usage.bandwidth?.usage / 1024 / 1024).toFixed(2), 'MB /', (usage.bandwidth?.limit / 1024 / 1024 / 1024).toFixed(1), 'GB')
  } catch (err: any) {
    console.error('❌ Cloudinary hatası:', err.message)
    if (err.http_code === 401) {
      console.error('   → API key/secret hatalı')
    }
    process.exit(1)
  }

  // 2. Test görseli yükle (1x1 piksel kırmızı PNG)
  console.log('\n🔄 Test görseli yükleniyor...')
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

  try {
    const uploadResult = await cloudinary.uploader.upload(testImage, {
      folder: 'gunubirlik/test',
      public_id: 'connection_test_' + Date.now(),
      transformation: [{ width: 100, height: 100, crop: 'limit' }],
    })

    console.log('✅ Test görseli yüklendi!')
    console.log('   URL:', uploadResult.secure_url)
    console.log('   Boyut:', uploadResult.bytes, 'bytes')
    console.log('   Format:', uploadResult.format)
    console.log('   Public ID:', uploadResult.public_id)

    // 3. Test görselini sil
    await cloudinary.uploader.destroy(uploadResult.public_id)
    console.log('✅ Test görseli silindi (temizlik yapıldı)')

    console.log('\n🎉 Tüm testler başarılı! Cloudinary tam çalışır durumda.')
    console.log('\n📝 Sonraki adımlar:')
    console.log('   - Profil fotoğrafı yükleme artık CDN\'e yüklenir')
    console.log('   - Production\'da hızlı CDN erişimi')
    console.log('   - Otomatik resize + kalite optimizasyonu')
  } catch (err: any) {
    console.error('❌ Yükleme hatası:', err.message)
    process.exit(1)
  }
}

testConnection()
