import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { mainRouter } from './routes/main';
import { handleError } from './utils/handle-error';
const app = new Hono();
app.use('*', cors());
app.use('*', logger());
app.route('/', mainRouter);
app.onError(handleError);
serve({
    fetch: app.fetch,
    port: 3000,
    hostname: '0.0.0.0',
}, (info) => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on http://localhost:${info.port}`);
});
//# sourceMappingURL=index.js.map