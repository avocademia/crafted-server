import Clamscan from 'clamscan'

export const clamscan = new Clamscan({
    clamdscan: {
        socket: false,
        host: process.env.CLAMAV_HOST || '127.0.0.1',
        port: process.env.CLAMAV_PORT || 3310,
        timeout: 60000
    },
    preferences: 'clamdscan'
})

export default { clamscan }