import { defineConfig, presetAttributify, presetWind3, transformerDirectives, presetIcons} from 'unocss'
import { colors as unoColors } from 'unocss/preset-mini'
import { cartesian } from './core/utils/array'
// import extractorMdc from '@unocss/extractor-mdc'

const colors = 'red yellow green blue purple gray'.split(' ')
const lightnesses = '100 200 300 400 500 600 700 800 900'.split(' ')
const btnSizes = 'xs sm lg'.split(' ')
const textSizes = '2xs xs sm base lg xl 2xl 3xl 4xl'.split(' ')

export default defineConfig({
  shortcuts: [
    // custom the default background
    {
      'debug': 'outline outline-3 outline-red',
      'btn': `
        text-white rounded-md border-none px-4 py-2 text-lg bg-primary
        active:translate-y-0.1 active:scale-98 transition-transform duration-75
        hover:cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      `,
      'card': 'p-4 rounded-lg',
      'flex-center': 'flex flex-wrap justify-center items-center',
      'border': 'border-solid border-1',
      'border-thick': 'border-solid border-4', // TODO fix elsewhere
      'input': 'border border-2 px-3 py-1 box-border bg-white',
      'input-mono': 'border-2 px-3 py-2 box-border font-mono text-xs',
    },
    [/^border-(.+)$/, ([, d]) => `border-solid border-${d}`],
    [/^btn-(.+)$/, ([, c]) => `btn bg-${c} hover:bg-${c}-500`],
    [/^btn-(.+)-(.+)$/, ([, c, s]) => `btn-${c} btn-${s}`],
    [/^card-(.+)$/, ([, c]) => `card bg-${c}-200 text-${c}-600 [&>h3]:text-${c}-700`],
    [/^circle-(.+)$/, ([, s]) => `rounded-full w-${s} h-${s}`],
    [/^square-(.+)$/, ([, s]) => `w-${s} h-${s}`],
    {
      'btn-xs': 'px-1 py-0.5 text-sm',
      'btn-sm': 'px-2 py-1 text-base',
      'btn-lg': 'px-6 py-3 text-2xl',
    }
  ],
  safelist: [
    ...cartesian(colors, lightnesses).map(([c, l]) => `bg-${c}-${l}`),
    ...cartesian(colors, lightnesses).map(([c, l]) => `text-${c}-${l}`),
    ...btnSizes.map(s => `btn-${s}`),
    ...textSizes.map(s => `text-${s}`),
  ],
  presets: [
    presetWind3(),
    presetAttributify(),
    // https://iconify.design/docs/usage/css/unocss/  https://unocss.dev/presets/icons
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
        // ...
      },
    })
  ],
  transformers: [
    transformerDirectives(),
  ],
  // extractors: [
  //   extractorMdc()
  // ],
  rules: [
    [/^t(\d+)$/, ([, d]) => ({ position: 'absolute', top: `${+d * 10}px` })],
    [/^b(\d+)$/, ([, d]) => ({ position: 'absolute', bottom: `${+d * 10}px` })],
    [/^r(\d+)$/, ([, d]) => ({ position: 'absolute', right: `${+d * 10}px` })],
    [/^l(\d+)$/, ([, d]) => ({ position: 'absolute', left: `${+d * 10}px` })],
  ],
  theme: {
    // https://github.com/unocss/unocss/blob/main/packages-presets/preset-mini/src/_theme/colors.ts
    colors: {
      primary: 'hsl(186, 85%, 48%)',
      'primary-600': 'hsl(186, 85%, 30%)',
      'primary-500': 'hsl(186, 85%, 40%)',
      'primary-400': 'hsl(186, 85%, 48%)',
      'primary-300': 'hsl(186, 85%, 60%)',
      'primary-200': 'hsl(186, 85%, 85%)',
      'primary-100': 'hsl(186, 85%, 90%)',
      
      warn: unoColors.yellow,
      error: unoColors.red,
      success: unoColors.green,
      info: unoColors.blue,

      // secondary: '#0F766E',
      // error: '#DC2626',
      // warning: '#F59E0B',
      // success: '#14B8A6',
      // info: '#0EA5E9',
      // accent: '#F675F1',
      // base: '#F8FAFC',
      // muted: '#64748B',
    }
  }
  // ...
})

// https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind4/src/theme/animate.ts