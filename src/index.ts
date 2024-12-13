import {connect} from './db/posgres';
import express, { query } from 'express';

const app = express();

connect(); // This will connect to the database
app.use(express.json());
app.get('/', (req, res) => {
    res.status(200).json({message: 'Hello World'});
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
