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

        ], (err,user) => {
          if (err||!user) return callback( err||'Something went wrong try again later')
          return callback(user,null)
        })

    },

    findByUsername: (username, callback) => {
        const sql = `SELECT * FROM users WHERE username =?`

        db.query(sql, [username], (err, user) => {
            if (err || !user) return callback(err || 'user not found')
            return callback(user,null)
        })
    },

    findUserByEmail: (email, callback) => {
        const sql = `SELECT * FROM users WHERE email =?`

        db.query(sql, [email], (err, user) => {
            if (err || !user) return callback(err || 'user not found')
            return callback(user,null)
        })
    },

    findUserById: (id, callback) => {

        const sql = `SELECT * FROM users WHERE id =?`

        db.query(sql,[id], (err, user) => {
            if (err || !user) return callback(err || 'user not found')
            return callback(user,null)
        })
    },

    findUserByResetToken: (resetPasswordToken, callback) => {

        const sql = `SELECT * FROM users WHERE reset_password_token = ?`

        db.query(sql,[resetPasswordToken], (err,user) => {
            if(err||!user) return res.status(400).json({message: 'user not found'})
            return callback(user,null)
        })
    },

    updateAuthenticatedStatus: (authenticated, id, callback) => {

        const sql = `UPDATE users SET authenticated = ? WHERE id = ?`

        db.query(sql, [authenticated, id], (err, res) => {
            if (err) return callback(err,null) 
            return callback(res,null)
        })
    },

    updateRefreshToken: (id, refreshToken, callback) => {

        const sql = `UPDATE users SET refresh_token = ? WHERE id = ?`

        db.query(sql, [refreshToken,id], (err, res) => {
            if(err) return callback(err, null)
            return callback(res,null)
        })
    },

    updateResetPasswordToken: (id, resetPasswordToken, resetPasswordExpiration, callback) => {

        const sql = `
            UPDATE users SET reset_password_token = ?, reset_password_token_expiration = ?
            WHERE id = ? 
        `
        db.query(sql,[resetPasswordToken, resetPasswordExpiration, id], (err,res) => {
            if(err) return callback(err, null)
            return callback(res,null)
        })
    },

    updatePassword: (id, newPassword, callback) => {

        const sql = `UPDATE users SET password = ? WHERE id = ?`
        db.query(sql, [newPassword, id], (err,res) => {
            if (err) cpnsole.log('an error occured changing password')
                return callback(res,null)
        })
    }

}

export default User