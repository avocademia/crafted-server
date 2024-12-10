import { MysqlError } from 'mysql'
import db from '../config/db'
import { UserData, UserRole, UserSignUpData } from '../types'

export const User = {

    create: (userData:UserSignUpData, callback:(err:MysqlError|null, user:UserData|null) => void) => {

        const sql = `INSERT INTO users (first_name, last_name, username, email, password, whatsapp_number, role, authenticated, profile_picture)
                     VALUES (?,?,?,?,?,?,?,?,?)`

        db.query(sql, [

            userData.first_name,
            userData.last_name,
            userData.username,
            userData.email,
            userData.password,
            userData.whatsapp_number,
            userData.role || 'customer',
            userData.authenticated || false,
            userData.profile_picture || null

        ], (err,res) => {
          if (err) return callback(err,null)

          const insertedId = res.insertId
          const query = `SELECT * FROM users WHERE id=?`

          db.query(query, [insertedId], (err,user) => {
            if (err) return callback(err, null)
            return callback(null, user[0])
          })
        })
    },

    findByUsername: (username: string, callback:(err:MysqlError|null, user:any) => any) => {
        const sql = `SELECT * FROM users WHERE username =?`

        db.query(sql, [username], (err, user) => {
            if (err) return callback(err, null)
            return callback(null, user[0])
        })
    },

    findUserByEmail: (email:string, callback:(err:MysqlError|null, user:any) => any) => {
        const sql = `SELECT * FROM users WHERE email =?`

        db.query(sql, [email], (err, user) => {
            if (err) return callback(err, null)
            return callback(null,user[0])
        })
    },

    findUserById: (id:number, callback:(err:MysqlError|null, user:UserData|null) => void) => {
            const sql = `SELECT * FROM users WHERE id =?`
            db.query(sql, [id], (err, user:UserData[]) => {
                if (err) return callback(err,null)
                return callback(null, user[0])
            })
    },

    findUserByResetToken: (resetPasswordToken: string, callback:(err:MysqlError|null, user:any) => any) => {

        const sql = `SELECT * FROM users WHERE reset_password_token = ?`

        db.query(sql,[resetPasswordToken], (err,user) => {
            if(err) return callback(err, null)
            return callback(null,user[0])
        })
    },

    updateAuthenticatedStatus: (id:number, authenticated:boolean, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE users SET authenticated = ? WHERE id = ?`

        db.query(sql, [authenticated, id], (err, res) => {
            if (err) return callback(err) 
            return callback(null)
        })
    },

    updateRefreshToken: (id:number, refreshToken:string, callback:(err:MysqlError|null, user:any) => any) => {

        const sql = `UPDATE users SET refresh_token = ? WHERE id = ?`

        db.query(sql, [refreshToken,id], (err, res) => {
            if(err) return callback(err, null)
            return callback(null,res)
        })
    },

    updateResetPasswordToken: (id:number, resetPasswordToken:string, resetPasswordExpiration:Date, callback:(err:MysqlError|null, user:any) => any) => {

        const sql = `
            UPDATE users SET reset_password_token = ?, reset_password_token_expiration = ?
            WHERE id = ? 
        `
        db.query(sql,[resetPasswordToken, resetPasswordExpiration, id], (err,res) => {
            if(err) return callback(err, null)
            return callback(null,res)
        })
    },

    updatePassword: (id:number, newPassword:string, callback:(err: MysqlError|null, result:any) => any) => {

        const sql = `UPDATE users SET password = ? WHERE id = ?`
        db.query(sql, [newPassword, id], (err,res)  => {
            if (err) return callback(err,null)
                return callback(null,res)
        })
    },

    getAllUsers: (callback:(err: MysqlError|null, res:any) => any) => {
        const sql = `SELECT * FROM users`

        db.query(sql, (err,users) => {
            if (err) {
                return callback(err, null)
            }
            return callback(null, users)
        })
    },

    updateRole : (newRole:UserRole, id:number, callback:(err:MysqlError|null, user:any) => any) => {
        const sql = `UPDATE users SET role = ? WHERE id = ?`

        db.query(sql, [newRole, id], (err,res) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,res)
        })
    },
}
