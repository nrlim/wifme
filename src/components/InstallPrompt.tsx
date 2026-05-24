"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { X, Download, Share, Plus } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
  prompt(): Promise<void>
}

type Platform = "ios" | "android-chrome" | "desktop-chrome" | null

// ── Constants ─────────────────────────────────────────────────────────────────
const DISMISS_STORAGE_KEY = "wifme-install-dismissed-until"
const DISMISS_DURATION_DAYS = 1
const isDev = process.env.NODE_ENV === "development"

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isInStandaloneMode =
    "standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true
  if (isIos && !isInStandaloneMode) return "ios"
  if (/android/i.test(ua)) return "android-chrome"
  return "desktop-chrome"
}

function isDismissed(): boolean {
  try {
    const until = localStorage.getItem(DISMISS_STORAGE_KEY)
    if (!until) return false
    return Date.now() < parseInt(until, 10)
  } catch {
    return false
  }
}

function saveDismissed() {
  try {
    const until = Date.now() + DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_STORAGE_KEY, String(until))
  } catch {
    // localStorage may be blocked in private mode
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<Platform>(null)
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [showIOSSteps, setShowIOSSteps] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  // Detect if already installed as PWA
  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
    ) {
      setIsInstalled(true)
    }
  }, [])

  // Listen for beforeinstallprompt (Chrome/Android)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // Decide whether to show
  useEffect(() => {
    if (isInstalled) return
    if (isDismissed()) return

    const detected = detectPlatform()
    setPlatform(detected)

    // Show after a short delay so it doesn't block initial render
    const timer = setTimeout(() => {
      if (isDev || detected === "ios" || detected === "android-chrome" || (detected === "desktop-chrome" && deferredPrompt)) {
        setVisible(true)
      }
    }, isDev ? 1500 : 2500)

    return () => clearTimeout(timer)
  }, [deferredPrompt, isInstalled])

  // Separate animation trigger to ensure CSS transition works
  useEffect(() => {
    if (visible) {
      const raf = requestAnimationFrame(() => {
        setAnimating(true)
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [visible])

  const handleDismiss = useCallback(() => {
    setAnimating(false)
    setTimeout(() => {
      setVisible(false)
      saveDismissed()
    }, 350)
  }, [])

  const handleInstall = useCallback(async () => {
    if (platform === "ios") {
      setShowIOSSteps(true)
      return
    }
    // In dev there's no deferredPrompt due to http — show iOS-style steps as a preview
    if (!deferredPrompt) {
      setShowIOSSteps(true)
      return
    }
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      handleDismiss()
    }
  }, [deferredPrompt, platform, handleDismiss])

  if (!visible) return null

  return (
    <>
      {/* ── Overlay for iOS instructions ── */}
      {showIOSSteps && (
        <div
          className="wifme-pwa-overlay"
          onClick={() => setShowIOSSteps(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="wifme-pwa-ios-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="wifme-pwa-close"
              onClick={() => setShowIOSSteps(false)}
              aria-label="Tutup"
            >
              <X size={16} />
            </button>
            <div className="wifme-pwa-ios-header">
              <Image
                src="/icon-192x192.png"
                alt="Wif-Me"
                width={48}
                height={48}
                className="wifme-pwa-logo"
              />
              <div>
                <p className="wifme-pwa-ios-title">Instal di iPhone / iPad</p>
                <p className="wifme-pwa-ios-sub">3 langkah mudah</p>
              </div>
            </div>
            <ol className="wifme-pwa-ios-steps">
              <li>
                <span className="wifme-pwa-step-num">1</span>
                <span>
                  Ketuk ikon{" "}
                  <span className="wifme-pwa-step-icon">
                    <Share size={14} />
                  </span>{" "}
                  <strong>Bagikan</strong> di Safari
                </span>
              </li>
              <li>
                <span className="wifme-pwa-step-num">2</span>
                <span>
                  Pilih{" "}
                  <span className="wifme-pwa-step-icon">
                    <Plus size={14} />
                  </span>{" "}
                  <strong>Tambah ke Layar Utama</strong>
                </span>
              </li>
              <li>
                <span className="wifme-pwa-step-num">3</span>
                <span>
                  Ketuk <strong>Tambah</strong> — selesai! 🎉
                </span>
              </li>
            </ol>
            <button
              className="wifme-pwa-btn-primary"
              onClick={() => setShowIOSSteps(false)}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Install Banner ── */}
      <div
        className={`wifme-pwa-banner ${animating ? "wifme-pwa-banner--visible" : ""}`}
        role="complementary"
        aria-label="Install Wif-Me"
        id="wifme-install-prompt"
      >
        <button
          className="wifme-pwa-close"
          onClick={handleDismiss}
          aria-label="Tutup"
        >
          <X size={14} />
        </button>

        <div className="wifme-pwa-content">
          <Image
            src="/icon-192x192.png"
            alt="Wif-Me"
            width={40}
            height={40}
            className="wifme-pwa-logo"
          />
          <div className="wifme-pwa-text">
            <p className="wifme-pwa-headline">Akses Lebih Cepat!</p>
            <p className="wifme-pwa-desc">
              Install Wif-Me di layar utama Anda untuk kemudahan akses perjalanan suci kapan saja.
            </p>
          </div>
        </div>

        <div className="wifme-pwa-actions">
          <button
            className="wifme-pwa-btn-ghost"
            onClick={handleDismiss}
          >
            Nanti Saja
          </button>
          <button
            className="wifme-pwa-btn-primary"
            onClick={handleInstall}
          >
            <Download size={14} />
            Install Sekarang
          </button>
        </div>
      </div>
    </>
  )
}
