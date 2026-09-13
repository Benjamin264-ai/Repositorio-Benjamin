'use client'
 
import { useRef, useState, useCallback, useEffect } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
 
// Solo códigos de barras — sin QR, ya que Comercial Mary solo usa los códigos
// de fábrica de los productos.
const FORMATOS_NATIVOS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'codabar',
  'itf',
]
 
const FORMATOS_HTML5QRCODE = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
]
 
const esperarElemento = (id: string, intentos = 20): Promise<boolean> =>
  new Promise((resolve) => {
    const check = (restantes: number) => {
      if (document.getElementById(id)) {
        resolve(true)
        return
      }
      if (restantes <= 0) {
        resolve(false)
        return
      }
      setTimeout(() => check(restantes - 1), 50)
    }
    check(intentos)
  })
 
export function useBarcodeScanner(onDetected: (texto: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const html5QrRef = useRef<Html5Qrcode | null>(null)
  const detenidoRef = useRef(false)
 
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [usaNativo, setUsaNativo] = useState(false)
 
  const stop = useCallback(async () => {
    detenidoRef.current = true
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop()
      } catch {
        // no importa si ya estaba detenido
      }
      html5QrRef.current = null
    }
    setScanning(false)
  }, [])
 
  const start = useCallback(
    async (elementoFallbackId: string) => {
      detenidoRef.current = false
      setError('')
      setScanning(true)
 
      const tieneNativo = typeof window !== 'undefined' && 'BarcodeDetector' in window
 
      if (tieneNativo && videoRef.current) {
        try {
          const constraints: MediaStreamConstraints = {
            video: {
              facingMode: 'environment',
              advanced: [{ focusMode: 'continuous' }],
            } as MediaTrackConstraints,
          }
          const stream = await navigator.mediaDevices.getUserMedia(constraints)
          streamRef.current = stream
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setUsaNativo(true)
 
          // @ts-expect-error - BarcodeDetector es una API nueva, TypeScript aún no la tiene tipada
          const detector = new window.BarcodeDetector({ formats: FORMATOS_NATIVOS })
 
          const loop = async () => {
            if (detenidoRef.current || !videoRef.current) return
            try {
              const codigos = await detector.detect(videoRef.current)
              if (codigos.length > 0) {
                const texto = codigos[0].rawValue
                await stop()
                onDetected(texto)
                return
              }
            } catch {
              // frame sin resultado, seguimos intentando
            }
            rafRef.current = requestAnimationFrame(loop)
          }
          loop()
          return
        } catch {
          // Si falla el nativo (permiso, hardware, lo que sea), seguimos al respaldo de abajo
        }
      }
 
      // Respaldo: html5-qrcode (para navegadores sin detección nativa, ej. iPhone)
      setUsaNativo(false)
      const existe = await esperarElemento(elementoFallbackId)
      if (detenidoRef.current) return
 
      if (!existe) {
        setError('No se pudo preparar la cámara. Cierra e inténtalo de nuevo.')
        setScanning(false)
        return
      }
 
      try {
        const scanner = new Html5Qrcode(elementoFallbackId)
        html5QrRef.current = scanner
 
        const config = {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          formatsToSupport: FORMATOS_HTML5QRCODE,
          videoConstraints: {
            facingMode: 'environment',
            advanced: [{ focusMode: 'continuous' }],
          },
        } as any
 
        await scanner.start(
          { facingMode: 'environment' },
          config,
          async (decodedText) => {
            if (detenidoRef.current) return
            try {
              await scanner.stop()
            } catch {
              // no importa
            }
            setScanning(false)
            onDetected(decodedText)
          },
          () => {}
        )
      } catch (err) {
        if (!detenidoRef.current) {
          const mensaje = err instanceof Error ? err.message : String(err)
          setError(`No se pudo acceder a la cámara: ${mensaje}`)
          setScanning(false)
        }
      }
    },
    [onDetected, stop]
  )
 
  useEffect(() => {
    return () => {
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
 
  return { videoRef, scanning, error, usaNativo, start, stop }
}
 