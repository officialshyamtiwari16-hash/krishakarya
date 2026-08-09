/**
 * Chrome Browser Shortcut & PWA Installation Connector
 * Enables seamless integration with Google Chrome on Mobile (Android) & Desktop
 * to install the website as a home screen / app launcher shortcut with the exact
 * web icon ('कृ' Krishakarya logo emblem).
 */

export interface ChromeInstallStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isChrome: boolean;
  isMobile: boolean;
  platform: string;
}

let deferredPrompt: any = null;

// Global event listener for Chrome's beforeinstallprompt
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    (window as any).deferredPwaPrompt = e;
    window.dispatchEvent(new CustomEvent('chrome-install-prompt-available', { detail: e }));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    (window as any).deferredPwaPrompt = null;
    window.dispatchEvent(new CustomEvent('chrome-app-installed'));
  });
}

/**
 * Checks if the website is running inside Chrome browser
 */
export function isChromeBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return (ua.includes('chrome') || ua.includes('crios')) && !ua.includes('edg/') && !ua.includes('opr/');
}

/**
 * Checks if current device is mobile (Android / iOS)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
}

/**
 * Checks if the app is already installed in standalone mode
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Gets current Chrome installation availability status
 */
export function getChromeInstallStatus(): ChromeInstallStatus {
  return {
    isInstallable: !!deferredPrompt || !!(window as any).deferredPwaPrompt,
    isInstalled: isAppInstalled(),
    isChrome: isChromeBrowser(),
    isMobile: isMobileDevice(),
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
  };
}

/**
 * Triggers Chrome Browser native shortcut installation prompt
 * using the exact website emblem icon.
 */
export async function triggerChromeInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const activePrompt = deferredPrompt || (window as any).deferredPwaPrompt;

  if (!activePrompt) {
    return 'unavailable';
  }

  try {
    // Show Chrome browser installation prompt
    activePrompt.prompt();
    const choiceResult = await activePrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      deferredPrompt = null;
      (window as any).deferredPwaPrompt = null;
      return 'accepted';
    } else {
      return 'dismissed';
    }
  } catch (error) {
    console.warn('Chrome shortcut installation trigger warning:', error);
    return 'unavailable';
  }
}

/**
 * Ensures Chrome web app manifest and favicon links connect to the exact web emblem icon
 */
export function syncChromeIconManifest(): void {
  if (typeof document === 'undefined') return;

  const logoSvgPath = '/logo.svg';
  const logoPng192 = '/logo-192.png';
  const logoPng512 = '/logo-512.png';

  // Ensure shortcut icons in head match exact emblem
  const iconLinks = [
    { rel: 'icon', type: 'image/svg+xml', href: logoSvgPath },
    { rel: 'icon', type: 'image/png', href: logoPng192, sizes: '192x192' },
    { rel: 'icon', type: 'image/png', href: logoPng512, sizes: '512x512' },
    { rel: 'shortcut icon', href: logoSvgPath },
    { rel: 'apple-touch-icon', href: logoPng192, sizes: '180x180' },
  ];

  iconLinks.forEach(({ rel, type, href, sizes }) => {
    let link = document.querySelector(`link[rel="${rel}"][href="${href}"]`) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      if (type) link.type = type;
      if (sizes) link.setAttribute('sizes', sizes);
      link.href = href;
      document.head.appendChild(link);
    }
  });

  // Ensure single valid manifest link pointing to /manifest.json
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = '/manifest.json';
}

/**
 * Connects Service Worker and Chrome installer bridge on startup
 */
export function initChromeShortcutConnector(): void {
  if (typeof window === 'undefined') return;

  syncChromeIconManifest();

  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Krishakarya Chrome Shortcut Connector SW ready:', reg.scope);
        })
        .catch((err) => {
          console.warn('Chrome SW registration fallback warning:', err);
        });
    });
  }
}
