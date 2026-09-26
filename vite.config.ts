import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {config as loadEnv} from 'dotenv';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {handleIpinfoRequest} from './server/ipinfoLookup';
import {handleReturnRequestApi, isReturnRequestApi} from './server/returnRequestHandler';
import {handleOrderCallApi, isOrderCallApi} from './server/confirmationCallHandler';
import {handleShopApi, isShopApi} from './server/shopApi';
import {handleMongoHealth, isMongoHealthApi} from './server/mongoHealth';
import {handleStripeApi, isStripeApi} from './server/stripeHandler';
import {handleAdminOrderApi, isAdminOrderApi} from './server/adminOrderApi';
import {handleReviewApi, isReviewApi} from './server/reviewApi';
import {handleChatApi, isChatApi} from './server/chatApi';

loadEnv();

function zayroApiPlugin(): Plugin {
  const middleware = (req: {url?: string; method?: string}, res: unknown, next: () => void) => {
    const url = req.url?.split('?')[0] || '';
    if (url === '/api/ipinfo') {
      void handleIpinfoRequest(req as Parameters<typeof handleIpinfoRequest>[0], res as Parameters<typeof handleIpinfoRequest>[1]);
      return;
    }
    if (isStripeApi(url)) {
      void handleStripeApi(req as Parameters<typeof handleStripeApi>[0], res as Parameters<typeof handleStripeApi>[1]);
      return;
    }
    if (isAdminOrderApi(url)) {
      void handleAdminOrderApi(req as Parameters<typeof handleAdminOrderApi>[0], res as Parameters<typeof handleAdminOrderApi>[1]);
      return;
    }
    if (isReviewApi(url)) {
      void handleReviewApi(req as Parameters<typeof handleReviewApi>[0], res as Parameters<typeof handleReviewApi>[1]);
      return;
    }
    if (isShopApi(url)) {
      void handleShopApi(req as Parameters<typeof handleShopApi>[0], res as Parameters<typeof handleShopApi>[1]);
      return;
    }
    if (isReturnRequestApi(url)) {
      void handleReturnRequestApi(req as Parameters<typeof handleReturnRequestApi>[0], res as Parameters<typeof handleReturnRequestApi>[1]);
      return;
    }
    if (isOrderCallApi(url)) {
      void handleOrderCallApi(req as Parameters<typeof handleOrderCallApi>[0], res as Parameters<typeof handleOrderCallApi>[1]);
      return;
    }
    if (isMongoHealthApi(url)) {
      void handleMongoHealth(req as Parameters<typeof handleMongoHealth>[0], res as Parameters<typeof handleMongoHealth>[1]);
      return;
    }
    if (isChatApi(url)) {
      if (typeof handleChatApi === 'function') {
        void handleChatApi(req as Parameters<typeof handleChatApi>[0], res as Parameters<typeof handleChatApi>[1]);
      } else {
        const response = res as { statusCode: number; setHeader: (k: string, v: string) => void; end: (s: string) => void };
        response.statusCode = 503;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ error: 'Chat API is reloading. Restart npm run dev.' }));
      }
      return;
    }
    next();
  };

  return {
    name: 'zayro-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), zayroApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/nominatim': {
          target: 'https://nominatim.openstreetmap.org',
          changeOrigin: true,
          rewrite: (requestPath: string) => requestPath.replace(/^\/api\/nominatim/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('User-Agent', 'ZayroCollectionCheckout/1.0');
            });
          },
        },
      },
    },
  };
});
