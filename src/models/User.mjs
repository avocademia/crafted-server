import db from '../config/db.mjs'

export const User = {

    create: (userData, callback) => {

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

    findByUsername: (username, callback) => {
        const sql = `SELECT * FROM users WHERE username =?`

        db.query(sql, [username], (err, user) => {
            if (err) return callback(err, null)
            return callback(null, user[0])
        })
    },

    findUserByEmail: (email, callback) => {
        const sql = `SELECT * FROM users WHERE email =?`

        db.query(sql, [email], (err, user) => {
            if (err) return callback(err, null)
            return callback(null,user[0])
        })
    },

    findUserById: (id, callback) => {

        const sql = `SELECT * FROM users WHERE id =?`

        db.query(sql,[id], (err, user) => {
            if (err) return callback(err, null)
            return callback(null,user[0])
        })
    },

    findUserByResetToken: (resetPasswordToken, callback) => {

        const sql = `SELECT * FROM users WHERE reset_password_token = ?`

        db.query(sql,[resetPasswordToken], (err,user) => {
            if(err) return callback(err, null)
            return callback(null,user[0])
        })
    },

    updateAuthenticatedStatus: (authenticated, id, callback) => {

        const sql = `UPDATE users SET authenticated = ? WHERE id = ?`

        db.query(sql, [authenticated, id], (err, res) => {
            if (err) return callback(err,null) 
            return callback(null,res)
        })
    },

    updateRefreshToken: (id, refreshToken, callback) => {

        const sql = `UPDATE users SET refresh_token = ? WHERE id = ?`

        db.query(sql, [refreshToken,id], (err, res) => {
            if(err) return callback(err, null)
            return callback(null,res)
        })
    },

    updateResetPasswordToken: (id, resetPasswordToken, resetPasswordExpiration, callback) => {

        const sql = `
            UPDATE users SET reset_password_token = ?, reset_password_token_expiration = ?
            WHERE id = ? 
        `
        db.query(sql,[resetPasswordToken, resetPasswordExpiration, id], (err,res) => {
            if(err) return callback(err, null)
            return callback(null,res)
        })
    },

    updatePassword: (id, newPassword, callback) => {

        const sql = `UPDATE users SET password = ? WHERE id = ?`
        db.query(sql, [newPassword, id], (err,res) => {
            if (err) return (err, null)
                return callback(null,res)
        })
    }

}
