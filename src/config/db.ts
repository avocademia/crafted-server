import mysql from "mysql"
import dotenv from 'dotenv'

dotenv.config()

const connection = mysql.createConnection({
   host: process.env.DEV_HOST,
   user: process.env.DEV_USER,
   password: '',
   database: 'crafted'
})

connection.connect((err) => {
   if (err) console.log(err)
   console.log("database connected")
})

export default connection