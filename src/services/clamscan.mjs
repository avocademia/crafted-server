import Clamscan from 'clamscan';

export const clamscan = await new Clamscan({
    clamdscan: {
        socket: false, // Set to true if you want to use a socket instead of host/port
        host: process.env.CLAMAV_HOST || '127.0.0.1',
        port: process.env.CLAMAV_PORT || 3310,
        timeout: 60000, // Timeout in ms
    },
    preferences: {
        clamdscan: {
            path: '/usr/bin/clamdscan', // Optional path to 'clamdscan' binary if needed
        }
    }
});

export default { clamscan };
