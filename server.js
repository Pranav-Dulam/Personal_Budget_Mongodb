const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = 3000;

app.use('/', express.static('public'));

app.get('/budget', (req, res) => {
    const budgetPath = path.join(__dirname, 'budget.json');
    fs.readFile(budgetPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading budget.json:', err);
            return res.status(500).json({ error: 'Failed to read budget data' });
        }
        try{
            const parsed = JSON.parse(data);
            res.json(parsed);
        } catch (parseErr) {
            console.error('Error parsing budget.json:', parseErr);
            res.status(500).json({ error: 'Invalid JSON format' });
        }
    });
});

app.listen(port, () => console.log(`http://localhost:${port}`));
