import { MysqlError } from 'mysql'
import db from '../config/db'

export const KlosetFollowers = {
    follow: (user_id:number, kloset_id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `INSERT INTO kloset_followers (
                        user_id,
                        kloset_id
                    ) VALUES (?,?)`

        db.query(sql,[user_id,kloset_id], (err) => {
            if(err){
                return callback(err)
            }
        })
    }
}