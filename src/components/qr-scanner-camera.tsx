'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Loader2, ScanLine, AlertCircle, Keyboard, RefreshCw } from 'lucide-react'

interface QrScannerCameraProps {
  onScan: (token: string) => void
  onClose: () => void
  loading?: boolean
  title?: string
  description?: string
  onSwitchManual?: () => void
}

let jsQR: any = null

export default function QrScannerCamera({
  onScan,
  onClose,
  loading = false,
  title = 'QR Kod Tara',
  description = 'Kamerayı QR koda doğrultun',
  onSwitchManual,
}: QrScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error' | 'stopped'>('starting')
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    import('jsqr').then((mod) => {
      jsQR = mod.default || mod
    }).catch(() => {})
  }, [])

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setStatus('starting')
    setErrorMsg('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.setAttribute('webkit-playsinline', 'true')

        // Video metadata yüklendikten sonra play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setStatus('scanning')
            startScanning()
          }).catch(() => {
            setStatus('error')
            setErrorMsg('Video oynatılamadı.')
          })
        }
      }
    } catch (err: any) {
      setStatus('error')
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMsg('Kamera izni reddedildi. Tarayıcı ayarlarından izin verin.')
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setErrorMsg('Kamera bulunamadı.')
      } else if (err?.name === 'NotReadableError') {
        setErrorMsg('Kamera başka bir uygulama tarafından kullanılıyor.')
      } else if (err?.name === 'NotSupportedError') {
        setErrorMsg('Kamera HTTPS gerektirir.')
      } else {
        setErrorMsg(err?.message || 'Kamera başlatılamadı')
      }
    }
  }, [])

  const startScanning = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const tick = () => {
      if (!video || !canvas || !streamRef.current) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth || 640
        const h = video.videoHeight || 480
        canvas.width = w
        canvas.height = h
        ctx.drawImage(video, 0, 0, w, h)
        const imageData = ctx.getImageData(0, 0, w, h)

        if (jsQR) {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          })
          if (code && code.data) {
            let token = code.data
            try {
              const payload = JSON.parse(code.data)
              token = payload.token || code.data
            } catch {}
            setStatus('stopped')
            stopCamera()
            onScan(token)
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [onScan, stopCamera])

  useEffect(() => {
    const checkJsQR = () => {
      if (jsQR) startCamera()
      else setTimeout(checkJsQR, 100)
    }
    const timer = setTimeout(checkJsQR, 200)
    return () => {
      clearTimeout(timer)
      stopCamera()
    }
  }, [startCamera, stopCamera])

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Header */}
      <div
        className="flex items-center justify-between text-white shrink-0"
        style={{ padding: '12px 16px', paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold flex items-center gap-1.5 truncate">
            <ScanLine className="w-4 h-4 shrink-0" />
            {title}
          </h2>
          <p className="text-[10px] text-white/50 mt-0.5 truncate">{description}</p>
        </div>
        <button
          onClick={() => { stopCamera(); onClose() }}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 ml-2"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Kamera Alanı — video tam ekran */}
      <div
        className="relative overflow-hidden bg-black"
        style={{ flex: '1 1 0%', minHeight: '200px' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Starting */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
              <p className="text-xs">Kamera başlatılıyor...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black px-4 z-10">
            <div className="text-center max-w-[260px]">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <p className="font-semibold text-sm mb-1">Kamera Hatası</p>
              <p className="text-[11px] text-white/60 mb-3 leading-relaxed">{errorMsg}</p>
              <div className="flex flex-col gap-2 items-center">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg flex items-center gap-1.5 w-full justify-center"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tekrar Dene
                </button>
                {onSwitchManual && (
                  <button
                    onClick={onSwitchManual}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg flex items-center gap-1.5 w-full justify-center"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    Manuel Token Girin
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR çerçeve overlay (scanning) */}
        {status === 'scanning' && (
          <>
            {/* Yarı saydam karartma overlay */}
            <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'rgba(0,0,0,0.3)' }} />

            {/* Şeffaf pencere — çerçeve bölgesi */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div
                className="relative rounded-2xl"
                style={{
                  width: 'min(70vw, 240px)',
                  height: 'min(70vw, 240px)',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.6)',
                }}
              >
                {/* Köşe çizgileri */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                {/* Tarama çizgisi */}
                <div
                  className="absolute left-2 right-2 top-0 h-0.5 bg-emerald-400 rounded-full"
                  style={{ animation: 'qrscan 2.5s ease-in-out infinite' }}
                />
              </div>
            </div>

            {/* Yönlendirme */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-20">
              <p className="text-white/90 text-xs font-medium">QR kodu çerçeve içine yerleştirin</p>
            </div>
          </>
        )}

        {/* Loading (doğrulama) */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
              <p className="text-xs">Doğrulanıyor...</p>
            </div>
          </div>
        )}
      </div>

      {/* Alt bar */}
      <div
        className="shrink-0 flex items-center justify-between text-white"
        style={{
          padding: '8px 16px',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        <p className="text-[9px] text-white/30">🔒 5 dk geçerli</p>
        {onSwitchManual && status !== 'error' && (
          <button
            onClick={onSwitchManual}
            className="text-[10px] text-white/50 hover:text-white underline"
          >
            Manuel giriş
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes qrscan {
          0%, 100% { transform: translateY(4px); }
          50% { transform: translateY(calc(min(70vw, 240px) - 8px)); }
        }
      `}</style>
    </div>
  )
}
