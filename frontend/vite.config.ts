import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Permite definir a base via env. Em produção (Django), use '/static/'.
  const base = env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/static/' : '/')
  const isProd = mode === 'production' || process.env.NODE_ENV === 'production'

  // Carrega o plugin de compressão apenas em produção
  let compressionPlugins: any[] = []
  if (isProd) {
    try {
      const { default: viteCompression } = await import('vite-plugin-compression')
      compressionPlugins = [
        viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 10240, deleteOriginFile: false }),
        viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 10240, deleteOriginFile: false }),
      ]
    } catch (e) {
      // Se o pacote não estiver instalado (ex.: ambiente dev), continua sem compressão
      compressionPlugins = []
    }
  }

  return {
    base,
    plugins: [
      react(),
      // Compressão somente em produção e se o pacote existir
      ...compressionPlugins,
    ],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/media': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      // Desabilita sourcemap em produção para builds mais rápidos no EC2
      sourcemap: isProd ? false : true,
      // Minificação: usa esbuild (padrão) para evitar depender de 'terser'
      minify: isProd ? 'esbuild' : false,
      // Se em algum momento migrarmos para 'terser', manter exemplo comentado abaixo:
      // terserOptions: {
      //   compress: { drop_console: true, drop_debugger: true },
      // },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Code splitting otimizado
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router': ['react-router-dom'],
            'forms': ['react-hook-form', 'yup'],
          },
          // Nomes de arquivos com hash para cache
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    // Otimizações de dependências
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  }
})
