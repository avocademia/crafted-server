import multer from 'multer'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'
import clamscan from '../services/clamscan.mjs'

const scanStorage = multer.memoryStorage()

const storage = multer.diskStorage({

    destination: (cb) => {
        cb(null, 'uploades/profile_pictures')
    },

    fileName: (file,cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null,file.fieldname + '-' + uniqueSuffix + path.extname(req.file.originalname))
    }
})

export const scanUpload = multer({
    storage: scanStorage,
    limits: {fileSize: 2*1024*1024}, //2mb
    fileFilter: async (req, file, cb) => {

        console.log('File details:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          });

        try {

            const buffer = file.buffer
            const {mime} = await fileTypeFromBuffer(buffer)
            if (!mime || ![ 'image/jpeg', 'image/png', 'image/gif'].includes(mime)) {
                return cb(new Error('Invalid file type. only images allowed'))
            }
            cb(null, true)

        } catch (error) {
            cb(new Error('File type validation failed'))
        }
    }
}).single('profile_picture')

export const finalUpload = async (req,res) => {

    console.log(`Fine in final Upload: ${req.file}`)

    if (req.file) {

        const isInfected = await clamscan.scanFile(req.file.buffer)

        if (isInfected) {
            return res.status(400).json({message: 'File rejected due to potential malware'})
        }

    }

    const upload = multer({storage: storage}).single('profile_picture')
    upload (()=> {
        if (err){
            return res.status(500).json({message: 'Error uploading profile picture'})
        }
        return res.status(200).json({message: 'Profile picture uploaded successfully'})
    })
}
