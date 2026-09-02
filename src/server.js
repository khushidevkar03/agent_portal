const app = require('./app');

const port = Number(process.env.PORT) || 5100;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
