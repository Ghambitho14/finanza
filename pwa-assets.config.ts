import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// El ícono maskable (Android) y el de Apple no admiten transparencia: las
// esquinas se rellenan con el color del fondo. Sin margen extra, porque el
// SVG ya deja la billetera dentro de la zona segura (el 56 % central).
const background = '#f2f2f0'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    maskable: { ...preset.maskable, padding: 0, resizeOptions: { background } },
    apple: { ...preset.apple, padding: 0, resizeOptions: { background } },
  },
  images: ['public/pwa-icon.svg'],
})
