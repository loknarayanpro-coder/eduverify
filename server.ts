import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiApp } from './src/server/apiApp.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Mount all REST API endpoints
app.use(apiApp);

// In production, serve built frontend assets from dist/
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Single Page Application (SPA) catch-all fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ success: false, message: 'API route not found' });
  } else {
    res.sendFile(path.resolve(distPath, 'index.html'));
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduVerify full-stack server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
