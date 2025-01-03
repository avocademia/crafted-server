import express from "express"
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRouter'
import adminRouter from "./routes/adminRouter"
import publicRouter from "./routes/publicRouter"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next();
});
app.use(cors({
    origin: process.env.DEV_CLIENT_URL,
    credentials: true
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/admins', adminRouter)
app.use('/api/users', userRouter)
app.use('/api', publicRouter)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`running on port ${PORT}`)
})