// server.js
const express = require('express');
const app = express();
const port = 5000 || process.env.PORT;
const routes = require('./routes');

app.use(express.json());
app.use('/', routes);
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
