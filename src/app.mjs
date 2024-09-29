import express from "express"
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import userRouter from './routes/userRouter.mjs'

dotenv.config()

const app = express()

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: process.env.DEV_CLIENT_URL,
    credentials: true
}))
app.use(bodyParser.json())

app.use('/api/users', userRouter)


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`running on port ${PORT}`)
})