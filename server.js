const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require("jsonwebtoken"); 
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me"; 

const DEMO_USER = {
    id: 1,
    username: "admin",
    password: "password123" 
};

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const app = express();
app.use(cors()); 
app.use(express.json());

// --- Middleware ---
function requireAuth(req, res, next) { 
    const header = req.headers.authorization; 
    if (!header) return res.status(401).json({ error: "Missing Authorization header" }); 

    const [type, token] = header.split(" "); 
    if (type !== "Bearer" || !token) { 
        return res.status(401).json({ error: "Invalid Authorization format" }); 
    } 

    try { 
        const payload = jwt.verify(token, JWT_SECRET); 
        req.user = payload;  
        next(); 
    } catch (err) { 
        return res.status(401).json({ error: "Invalid/Expired token" }); 
    } 
} 

// --- Routes ---

app.post("/login", (req, res) => { 
    const { username, password } = req.body; 
    if (username !== DEMO_USER.username || password !== DEMO_USER.password) { 
        return res.status(401).json({ error: "Invalid credentials" }); 
    } 

    const token = jwt.sign( 
        { userId: DEMO_USER.id, username: DEMO_USER.username }, 
        JWT_SECRET, 
        { expiresIn: "1h" } 
    ); 
    res.json({ token }); 
}); 

app.get('/allcards', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM defaultdb.cards');
        res.json(rows);
    } catch (error) {
        res.status(500).json({message: 'Server error for allcards'});
    }
});

app.post('/addcard', requireAuth, async (req, res) => {
    const { card_name, card_pic } = req.body;
    try {
        await pool.execute(
            'INSERT INTO defaultdb.cards (card_name, card_pic) VALUES (?, ?)', 
            [card_name, card_pic]
        );
        res.status(201).json({ message: `Card ${card_name} added successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
});

app.put('/updatecard/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { card_name, card_pic } = req.body; 
    try {
        const [result] = await pool.execute(
            'UPDATE defaultdb.cards SET card_name = ?, card_pic = ? WHERE id = ?', 
            [card_name, card_pic, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Card not found" });
        }
        res.status(200).json({ message: `Card ${card_name} updated successfully` });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: error.message }); 
    }
});

app.delete('/deletecard/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM defaultdb.cards WHERE id = ?', [id]);
        res.status(200).json({ message: `Card ${id} deleted successfully` });
    } catch (error) {
        res.status(500).json({message: 'Server error - could not delete'});
    }
});

// ALWAYS place this at the very bottom
app.listen(port, () => {
    console.log('Server running on port', port);
});