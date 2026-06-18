// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app/wrappers'
import { campaignDevPlugin } from './scripts/campaign-dev-plugin.mjs'

/** Public path for assets/router. CI sets `GH_PAGES_BASE` (e.g. `/strength-of-thousands/` on github.io). */
const pagesBase = process.env.GH_PAGES_BASE || '/'

export default defineConfig((/* ctx */) => {
  return {
    boot: [],

    css: ['app.css'],

    extras: ['roboto-font', 'material-icons'],

    build: {
      target: {
        browser: 'baseline-widely-available',
        node: 'node22',
      },

      vueRouterMode: 'hash',
      publicPath: pagesBase,
      vueRouterBase: pagesBase,

      vitePlugins: [
        [
          'vite-plugin-checker',
          {
            eslint: {
              lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
              useFlatConfig: true,
            },
          },
          { server: false },
        ],
      ],

      extendViteConf(viteConf) {
        viteConf.plugins.unshift(campaignDevPlugin())
      },
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {
        brand: {
          primary: '#204050',
          secondary: '#6d3711',
          accent: '#c06040',
          dark: '#361f14',
          positive: '#406010',
          negative: '#a04030',
          info: '#204050',
          warning: '#b09060',
        },
      },
      plugins: ['Notify', 'Dialog'],
    },

    animations: [],
  }
})
