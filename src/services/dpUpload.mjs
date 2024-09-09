import multer from 'multer'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'

const scanStorage = multer.memoryStorage()

const storage = multer.diskStorage({

    destination: (callback) => {
        cb(null, 'uploades/profile_pictures')
    },

    fileName: (file,callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        callback(null,file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
})

export const scanUpload = multer({
    storage: scanStorage,
    limits: {fileSize: 2*1024*1024}, //2mb
    fileFilter: async (file, callback) => {

        try {

            const buffer = file.buffer
            const {mime} = await fileTypeFromBuffer(buffer)
            if (!mime || ![ 'image/jpeg', 'image/png', 'image/gif'].includes(mime)) {
                return callback(new Error('Invalid file type. only images allowed'))
            }
            callback(null, true)

        } catch (error) {
            callback(new Error('File type validation failed'))
        }

    }
}).single('profile_picture')

export const upload = multer({
    storage: storage,
    limits: {fileSize: 2*1024*1024}, //2mb
    fileFilter: async (file, callback) => {

        try {

            const buffer = file.buffer
            const {mime} = await fileTypeFromBuffer(buffer)
            if (!mime || ![ 'image/jpeg', 'image/png', 'image/gif'].includes(mime)) {
                return callback(new Error('Invalid file type. only images allowed'))
            }
            callback(null, true)

        } catch (error) {
            callback(new Error('File type validation failed'))
        }

    }
}).single('profile_picture')


export default {upload, scanUpload}