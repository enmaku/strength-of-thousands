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
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {},
      plugins: [],
    },

    animations: [],

    extendViteConf(viteConf) {
      viteConf.plugins.unshift(campaignDevPlugin())
    },
  }
})
