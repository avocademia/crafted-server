import crypto from 'crypto'

const accessKey = crypto.randomBytes(32).toString('hex')
const refreshKey = crypto.randomBytes(32).toString('hex')
const verificationKey = crypto.randomBytes(32).toString('hex')
const resetKey = crypto.randomBytes(32).toString('hex')

console.table({accessKey,refreshKey,verificationKey,resetKey})