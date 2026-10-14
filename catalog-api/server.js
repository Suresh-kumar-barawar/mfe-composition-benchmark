// Local server for the catalogue API:  npm run api:start  (port 3300, or PORT)
const app = require('./app');
const port = Number(process.env.PORT || 3300);
app.listen(port, () => console.log(`Catalogue API on http://localhost:${port}`));
