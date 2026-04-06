import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, type ConfigEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }: ConfigEnv) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        viteStaticCopy({
          targets: [
            { src: 'js/*', dest: 'js' },
            { src: 'css/*', dest: 'css' },
          ]
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_APPS_SCRIPT_URL': JSON.stringify(env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxn3cBxEFFf0jkBYNZNfXc4FkzdVE-WcIJmisniS98HHT3qjFYQ5b72er439zIG_xg8/exec')
      },
      resolve: {
        alias: {
          '@': __dirname,
        }
      }
    };
});
