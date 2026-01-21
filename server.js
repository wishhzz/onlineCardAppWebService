const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const port = process.env.PORT || 3000; // Use Render's port or 3000

const dbconfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};

const app = express();

// --- Middleware ---
app.use(cors()); 
app.use(express.json());

// --- Routes ---

app.get('/allcards', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbconfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error for allcards'});
    } finally {
        if (conn) await conn.end(); // Close connection!
    }
});

app.post('/addcard', async (req, res) => {
    const { card_name, card_pic } = req.body;
    let conn;
    try {
        conn = await mysql.createConnection(dbconfig);
        // Added 'defaultdb.' prefix to match your GET route
        await conn.execute(
            'INSERT INTO defaultdb.cards (card_name, card_pic) VALUES (?, ?)', 
            [card_name, card_pic]
        );
        res.status(201).json({ message: `Card ${card_name} added successfully` });
    } catch (error) {
        console.error("SQL Error:", error);
        res.status(500).json({message: error.message}); // Returns real error to browser
    } finally {
        if (conn) await conn.end();
    }
});

app.delete('/deletecard/:id', async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await mysql.createConnection(dbconfig);
        // Use '?' placeholder to prevent SQL Injection
        await conn.execute('DELETE FROM defaultdb.cards WHERE id = ?', [id]);
        res.status(200).json({ message: `Card ${id} deleted successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error - could not delete'});
    } finally {
        if (conn) await conn.end();
    }
});

app.put('/updatecard/:id', async (req, res) => {
    const { id } = req.params;
    const { card_name, card_pic } = req.body;           
    let conn;
    try {
        conn = await mysql.createConnection(dbconfig);
        await conn.execute(
            'UPDATE defaultdb.cards SET card_name = ?, card_pic = ? WHERE id = ?', 
            [card_name, card_pic, id]
        );
        res.status(200).json({ message: `Card ${card_name} updated successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error - could not update'});
    } finally {
        if (conn) await conn.end();
    }
});

// Start server
app.listen(port, () => {
    console.log('Server running on port', port);
});