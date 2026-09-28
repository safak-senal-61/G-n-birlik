/**
 * Dosya Yükleme Servisi - Cloudinary entegrasyonu
 *
 * Modlar:
 *  - local: Base64 olarak DB'ye kaydeder (geliştirme)
 *  - cloudinary: Cloudinary'ye yükler ve URL döndürür (production)
 *
 * Cloudinary kurulumu: https://cloudinary.com
 * 1. Ücretsiz hesap aç (25GB storage, 25 credits/ay)
 * 2. Dashboard → API Keys
 * 3. .env dosyasına ekle:
 *    CLOUDINARY_CLOUD_NAME=xxx
 *    CLOUDINARY_API_KEY=xxx
 *    CLOUDINARY_API_SECRET=xxx
 *    FILE_UPLOAD_MODE=cloudinary
 */
import { v2 as cloudinary } from 'cloudinary'
import { ApiError } from '@/server/services/auth.service'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ''
const API_KEY = process.env.CLOUDINARY_API_KEY || ''
const API_SECRET = process.env.CLOUDINARY_API_SECRET || ''
const MODE = process.env.FILE_UPLOAD_MODE || 'local'

// Cloudinary yapılandırması (sadece mod cloudinary ise)
if (MODE === 'cloudinary' && CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  })
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export class FileUploadService {
  /**
   * Avatar yükle
   * @param base64Data Base64 encoded dosya (data URL prefix olmadan)
   * @param mimeType image/jpeg, image/png, image/webp
   * @returns Yüklenen dosyanın URL'i
   */
  async uploadAvatar(userId: string, base64Data: string, mimeType: string): Promise<{ url: string }> {
    this.validateFile(base64Data, mimeType)

    if (MODE === 'cloudinary' && CLOUD_NAME) {
      return this.uploadToCloudinary(userId, base64Data, mimeType, 'avatars')
    }

    // Local mode: base64 data URL olarak döndür
    return { url: `data:${mimeType};base64,${base64Data}` }
  }

  /**
   * İş ilanı görseli yükle
   */
  async uploadJobImage(jobId: string, base64Data: string, mimeType: string): Promise<{ url: string }> {
    this.validateFile(base64Data, mimeType)

    if (MODE === 'cloudinary' && CLOUD_NAME) {
      return this.uploadToCloudinary(jobId, base64Data, mimeType, 'jobs')
    }

    return { url: `data:${mimeType};base64,${base64Data}` }
  }

  /**
   * Dosya doğrulama
   */
  private validateFile(base64Data: string, mimeType: string) {
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new ApiError(
        `Geçersiz dosya tipi: ${mimeType}. İzin verilenler: JPG, PNG, WebP, GIF`,
        400
      )
    }

    const sizeInBytes = Buffer.from(base64Data, 'base64').length
    if (sizeInBytes > MAX_SIZE_BYTES) {
      throw new ApiError(
        `Dosya boyutu çok büyük: ${(sizeInBytes / 1024 / 1024).toFixed(1)}MB. Max: 5MB`,
        400
      )
    }
  }

  /**
   * Cloudinary'ye yükle
   */
  private async uploadToCloudinary(
    publicId: string,
    base64Data: string,
    mimeType: string,
    folder: string
  ): Promise<{ url: string }> {
    try {
      const dataUri = `data:${mimeType};base64,${base64Data}`

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: `gunubirlik/${folder}`,
        public_id: `${publicId}_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'limit' }, // max 400x400
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
        resource_type: 'image',
      })

      console.log(`✅ [CLOUDINARY] Yüklendi: ${result.secure_url}`)
      return { url: result.secure_url }
    } catch (err: any) {
      console.error('❌ [CLOUDINARY] Yükleme hatası:', err.message)
      throw new ApiError(`Dosya yüklenemedi: ${err.message}`, 500)
    }
  }

  /**
   * Cloudinary'den dosya sil
   */
  async deleteFile(url: string): Promise<void> {
    if (MODE !== 'cloudinary' || !CLOUD_NAME) return

    try {
      // URL'den public_id çıkar
      const matches = url.match(/\/v\d+\/(.+)\.\w+$/)
      if (matches && matches[1]) {
        await cloudinary.uploader.destroy(matches[1])
        console.log(`🗑️ [CLOUDINARY] Silindi: ${matches[1]}`)
      }
    } catch (err: any) {
      console.error('❌ [CLOUDINARY] Silme hatası:', err.message)
    }
  }
}

export const fileUploadService = new FileUploadService()
