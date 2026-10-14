// Vercel serverless entry. vercel.json rewrites every API route to /api?__p=<original path>,
// and app.js restores the original path from __p (no file-system routing needed).
module.exports = require('../app');
