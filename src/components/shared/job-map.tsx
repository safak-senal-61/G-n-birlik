'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { reverseGeocode, formatShortLocation, type ReverseGeocodeResult } from '@/lib/geocode'
import { formatWage, categoryIcon, urgencyLabel, daysUntil, initials } from '@/lib/format'
import { Loader2 } from 'lucide-react'

// Leaflet'in default ikonlarını düzelt (Next.js ile sorun çıkarıyor)
// Bu CSS bazlı custom marker kullandığımız için pek gerekli değil ama yine de ayarlayalım
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export interface JobMarker {
  id: string
  title: string
  description: string
  category: string
  workDate: string
  startTime: string
  endTime: string
  wageAmount: number
  wageType: string
  isWageNegotiable: boolean
  city: string
  district: string
  address?: string
  latitude: number
  longitude: number
  urgency: string
  openingsTotal: number
  openingsFilled: number
  distanceKm?: number
  employer?: {
    id?: string
    fullName?: string
    companyName?: string
    isVerified?: boolean
    ratingAvg?: number
    ratingCount?: number
  }
}

interface JobMapProps {
  jobs: JobMarker[]
  userCoords: { lat: number; lng: number } | null
  radiusKm?: number
  onSelectJob?: (id: string) => void
  onLocationDetected?: (loc: ReverseGeocodeResult, lat: number, lng: number) => void
  height?: string
  className?: string
}

/**
 * Leaflet tabanlı interaktif harita
 * - Kategori bazlı renkli marker'lar
 * - Acil ilanlar için pulse animasyonu
 * - İş detayı popup'ları
 * - Kullanıcı konumu mavi marker
 * - Mesafe dairesi (radius)
 */
export default function JobMap({
  jobs,
  userCoords,
  radiusKm,
  onSelectJob,
  onLocationDetected,
  height = '500px',
  className = '',
}: JobMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const radiusCircleRef = useRef<L.Circle | null>(null)
  const [geocoding, setGeocoding] = useState(false)

  // Haritayı ilk kez oluştur
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Default center: İstanbul
    const center: L.LatLngExpression = userCoords
      ? [userCoords.lat, userCoords.lng]
      : [41.0082, 28.9784]

    const map = L.map(containerRef.current, {
      center,
      zoom: userCoords ? 13 : 11,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    })

    // OpenStreetMap tile'ları
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Marker layer group
    markersLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // Cleanup
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Kullanıcı konumu değiştiğinde
  useEffect(() => {
    if (!mapRef.current) return

    // Eski user marker'ı temizle
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove()
      radiusCircleRef.current = null
    }

    if (!userCoords) return

    const latlng: L.LatLngExpression = [userCoords.lat, userCoords.lng]

    // Yeni user marker
    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-location-marker"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    })

    userMarkerRef.current = L.marker(latlng, { icon: userIcon, zIndexOffset: 1000 })
      .addTo(mapRef.current)
      .bindPopup(
        `<div class="job-popup">
          <div class="job-popup-header" style="background:#3b82f6;">
            <div style="color:white;font-weight:600;font-size:13px;">📍 Şu an buradasınız</div>
          </div>
          <div class="job-popup-body" id="user-location-body">
            <div style="display:flex;align-items:center;gap:6px;color:#6b7280;">
              <div class="animate-spin" style="width:12px;height:12px;border:2px solid #d1d5db;border-top-color:#3b82f6;border-radius:50%;"></div>
              Adres hesaplanıyor...
            </div>
          </div>
        </div>`
      )

    // Radius dairesi
    if (radiusKm && radiusKm > 0) {
      radiusCircleRef.current = L.circle(latlng, {
        radius: radiusKm * 1000,
        color: '#10b981',
        weight: 2,
        opacity: 0.6,
        fillColor: '#10b981',
        fillOpacity: 0.08,
      }).addTo(mapRef.current)
    }

    // Haritayı yeni merkeze kaydır
    mapRef.current.setView(latlng, Math.max(mapRef.current.getZoom(), 13), {
      animate: true,
    })

    // Reverse geocode - kullanıcı konumunun adresini bul
    setGeocoding(true)
    reverseGeocode(userCoords.lat, userCoords.lng)
      .then((loc) => {
        // Popup'ı güncelle
        const body = document.getElementById('user-location-body')
        if (body) {
          body.innerHTML = `
            <div style="font-weight:600;color:#111827;margin-bottom:4px;">${loc.displayName.split(',').slice(0, 3).join(',<br>')}</div>
            ${loc.street ? `<div style="color:#6b7280;">🏛️ ${loc.street}</div>` : ''}
            ${loc.neighbourhood ? `<div style="color:#6b7280;">🏘️ ${loc.neighbourhood}</div>` : ''}
            ${loc.district ? `<div style="color:#6b7280;">📌 ${loc.district}</div>` : ''}
            ${loc.city ? `<div style="color:#6b7280;">🏙️ ${loc.city}${loc.postcode ? ' / ' + loc.postcode : ''}</div>` : ''}
          `
        }
        onLocationDetected?.(loc, userCoords.lat, userCoords.lng)
      })
      .catch((err) => {
        console.error('Reverse geocode hatası:', err)
        const body = document.getElementById('user-location-body')
        if (body) {
          body.innerHTML = `<div style="color:#ef4444;font-size:11px;">Adres alınamadı (${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)})</div>`
        }
      })
      .finally(() => setGeocoding(false))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCoords, radiusKm])

  // Job marker'larını güncelle
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return

    markersLayerRef.current.clearLayers()

    // Tüm marker'lar için bounds hesapla
    const bounds: L.LatLngExpression[] = []

    jobs.forEach((job) => {
      const latlng: L.LatLngExpression = [job.latitude, job.longitude]
      bounds.push(latlng)

      const isUrgent = job.urgency === 'URGENT'
      const icon = L.divIcon({
        className: '',
        html: `<div class="marker-pin marker-pin-${job.category} ${isUrgent ? 'marker-pin-URGENT' : ''}">
          <div class="marker-pin-icon">${categoryIcon(job.category)}</div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      const marker = L.marker(latlng, { icon })
      const urgency = urgencyLabel(job.urgency)
      const remaining = job.openingsTotal - job.openingsFilled
      const employerName = job.employer?.companyName || job.employer?.fullName || 'İşveren'
      const employerInitials = initials(employerName)

      marker.bindPopup(
        `<div class="job-popup">
          <div class="job-popup-header" style="background:linear-gradient(135deg,#10b981,#059669);color:white;">
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;opacity:0.9;margin-bottom:2px;">
              <span>${categoryIcon(job.category)}</span>
              <span style="text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${job.category}</span>
              ${isUrgent ? '<span style="background:#dc2626;padding:1px 6px;border-radius:8px;font-weight:600;">ACİL</span>' : ''}
            </div>
            <div style="font-weight:700;font-size:14px;line-height:1.3;">${escapeHtml(job.title)}</div>
          </div>
          <div class="job-popup-body">
            <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:6px;">
              <span style="color:#6b7280;">📍</span>
              <div>
                <div style="font-weight:600;color:#111827;">${escapeHtml(job.district)}, ${escapeHtml(job.city)}</div>
                ${job.address ? `<div style="color:#9ca3af;font-size:11px;">${escapeHtml(job.address)}</div>` : ''}
                ${job.distanceKm !== undefined ? `<div style="color:#10b981;font-size:11px;font-weight:600;margin-top:2px;">↻ ${job.distanceKm.toFixed(1)} km uzakta</div>` : ''}
              </div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
              <div>
                <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">Tarih</div>
                <div style="font-weight:600;color:#111827;font-size:12px;">${daysUntil(job.workDate)}</div>
              </div>
              <div>
                <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">Saat</div>
                <div style="font-weight:600;color:#111827;font-size:12px;">${job.startTime} - ${job.endTime}</div>
              </div>
              ${remaining > 0 ? `
              <div>
                <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">Kontenjan</div>
                <div style="font-weight:600;color:#111827;font-size:12px;">${remaining} kişi</div>
              </div>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#f9fafb;border-radius:6px;">
              <div style="width:24px;height:24px;border-radius:50%;background:#10b981;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">${employerInitials}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:600;color:#111827;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(employerName)}</div>
                ${job.employer?.ratingAvg ? `<div style="color:#f59e0b;font-size:11px;">★ ${job.employer.ratingAvg.toFixed(1)} (${job.employer.ratingCount})</div>` : ''}
              </div>
              ${job.employer?.isVerified ? '<div title="Onaylı işveren" style="color:#10b981;font-size:14px;">✓</div>' : ''}
            </div>
          </div>
          <div class="job-popup-footer">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <div>
                <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">Ücret</div>
                <div style="font-weight:700;color:#10b981;font-size:16px;">${formatWage(job.wageAmount, job.wageType)}</div>
                ${job.isWageNegotiable ? '<div style="color:#9ca3af;font-size:10px;">pazarlık</div>' : ''}
              </div>
              <button onclick="window.__jobMapSelect('${job.id}')" style="background:#10b981;color:white;border:none;padding:8px 14px;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;">Detay →</button>
            </div>
          </div>
        </div>`,
        {
          maxWidth: 280,
          minWidth: 240,
          className: 'job-popup-container',
        }
      )

      marker.on('click', () => {
        // Tıklandığında haritayı biraz yaklaştır
        if (mapRef.current) {
          mapRef.current.panTo(latlng, { animate: true })
        }
      })

      markersLayerRef.current!.addLayer(marker)
    })

    // Eğer user coords yoksa ve job varsa, tüm job'lara sığacak şekilde fit bounds
    if (bounds.length > 0 && !userCoords) {
      const boundsObj = L.latLngBounds(bounds)
      mapRef.current.fitBounds(boundsObj, { padding: [50, 50], maxZoom: 13 })
    }

    // Global click handler - popup'taki "Detay" butonu için
    ;(window as any).__jobMapSelect = (id: string) => {
      onSelectJob?.(id)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs])

  return (
    <div className={`relative ${className}`} style={{ height, width: '100%' }}>
      <div
        ref={containerRef}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit', zIndex: 0 }}
      />

      {/* Geocoding loading indicator */}
      {geocoding && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-xs shadow-md z-[1000] flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
          Adres hesaplanıyor...
        </div>
      )}

      {/* Harita üzerinde iş sayısı rozeti */}
      <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur rounded-lg px-3 py-1.5 text-xs shadow-md z-[1000]">
        <span className="font-semibold text-gray-900">{jobs.length}</span>
        <span className="text-gray-600"> iş haritada</span>
        {radiusKm && userCoords && (
          <span className="text-emerald-600 font-medium ml-2">• {radiusKm} km</span>
        )}
      </div>
    </div>
  )
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
