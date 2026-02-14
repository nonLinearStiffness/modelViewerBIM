import { defineConfig } from "vite";
import fs from 'fs';
import path from 'path';

export default defineConfig({
<<<<<<< HEAD
  base: '/modelViewerBIM/',
=======
  base: '/arJSLocationBasedBIM/',
>>>>>>> 084098e165153fa32532065f878390a8a990f949
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './certs/cert.key')),
      cert: fs.readFileSync(path.resolve(__dirname, './certs/cert.crt')),
    },
    host: '0.0.0.0',
  },
});