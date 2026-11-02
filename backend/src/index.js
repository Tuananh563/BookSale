const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const connectDB = require('./config/connectDB');
const router = require('./router/index.router');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());

connectDB();

app.get('/', (req, res) => {
    return res.json({
        message: 'ok',
        metadata: { message: 'Ok' },
    });
});

router(app);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message || 'Loi server',
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
