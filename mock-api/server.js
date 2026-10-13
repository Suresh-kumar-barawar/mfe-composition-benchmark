// Local server for the FakeStore mock:  node mock-api/server.js  (port 3300, or PORT)
const app = require('./app');
const port = Number(process.env.PORT || 3300);
app.listen(port, () => console.log(`FakeStore mock on http://localhost:${port}`));
