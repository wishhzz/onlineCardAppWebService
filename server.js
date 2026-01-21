const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });const port=3000;

//database config information
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
app.use(express.json());

app.listen(port, () => {
    console.log('Server running on port', port);
});

app.get('/allcards', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbconfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error for allcards'});
    }
});

app.post('/addcard', async (req, res) => {
    const { card_name, card_pic } = req.body;
    try {
        let connection = await mysql.createConnection(dbconfig);
        await connection.execute('INSERT INTO cards (card_name, card_pic) VALUES (?, ?)', [card_name, card_pic]);
        res.status(201).json({ message: 'Card '+card_name+' added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error - could not add card '+card_name});
    }
});

app.delete('/deletecard/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let connection = await mysql.createConnection(dbconfig);
        await connection.execute('DELETE FROM cards WHERE id ='+id);
        res.status(201).json({ message: 'Card '+id+' deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error - could not delete card '+id});
    }
});

app.put('/updatecard/:id', async (req, res) => {
    const { id } = req.params;
    const { card_name, card_pic } = req.body;           
    try {
        let connection = await mysql.createConnection(dbconfig);
        await connection.execute('UPDATE cards SET card_name = ?, card_pic = ? WHERE id = ?', [card_name, card_pic, id]);
        res.status(201).json({ message: 'Card '+card_name+' updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error - could not update card '+card_name});
    }
});