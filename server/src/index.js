import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';

dotenv.config({path: './.env'});
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials:true
}))

app.use(express.json());

app.get('/api/check', (req, res) => {
    res.status(200).json({message: "OK"});
})

app.listen(process.env.PORT || 3000, () =>{

    console.log("Server running on https://localhost:3000");

});