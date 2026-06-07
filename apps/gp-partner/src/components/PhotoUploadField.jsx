import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { api } from '@gp/shared/api'

/**
 * @param {{ label: string; value: string; onChange: (url: string) => void; kind: string; onError?: (msg: string) => void }} props
 */
export function PhotoUploadField({ label, value, onChange, kind, onError }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const pick = () => inputRef.current?.click()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const { url } = await api.uploadSpecialistPhoto(file, kind)
      onChange(url)
    } catch (err) {
      onError?.(err?.message || 'Ошибка загрузки фото')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="gp-form-field">
      <span className="gp-form-label">{label}</span>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="relative w-24 h-24 rounded-xl border-2 border-dashed border-[var(--gp-border)] bg-[var(--gp-surface-2)] overflow-hidden flex items-center justify-center disabled:opacity-50"
        >
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8 text-[var(--gp-text-muted)]" />
          )}
          {uploading && (
            <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
              …
            </span>
          )}
        </button>
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-emerald-500/50 text-emerald-600 font-bold text-sm disabled:opacity-50"
          >
            {value ? 'Заменить фото' : 'Выбрать из галереи'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-red-500 underline"
            >
              Удалить
            </button>
          )}
          <p className="text-[11px] text-[var(--gp-text-muted)]">JPEG, PNG, WebP · до 5 МБ</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
    </div>
  )
}

/**
 * @param {{ label: string; urls: string[]; onChange: (urls: string[]) => void; kind: string; max?: number; onError?: (msg: string) => void }} props
 */
export function PhotoUploadList({ label, urls, onChange, kind, max = 3, onError }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const add = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || urls.length >= max) return
    setUploading(true)
    try {
      const { url } = await api.uploadSpecialistPhoto(file, kind)
      onChange([...urls, url])
    } catch (err) {
      onError?.(err?.message || 'Ошибка загрузки фото')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="gp-form-field">
      <span className="gp-form-label">{label}</span>
      <p className="gp-form-hint mb-2">{urls.length}/{max} фото</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {urls.map((url) => (
          <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--gp-border)]">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-1 rounded-bl"
              onClick={() => onChange(urls.filter((u) => u !== url))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {urls.length < max && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full min-h-[44px] py-2 rounded-xl border border-emerald-500/50 text-emerald-600 font-bold text-sm disabled:opacity-50"
        >
          {uploading ? 'Загрузка…' : '+ Добавить фото'}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={add} />
    </div>
  )
}
