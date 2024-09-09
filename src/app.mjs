import express from "express"
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import userRouter from './routes/userRouter.mjs'

dotenv.config()

const app = express()


app.use(bodyParser.json())

app.use('api/users', userRouter)


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`running on port ${PORT}`)
})