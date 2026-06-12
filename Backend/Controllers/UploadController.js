const cloudinary = require('../config/cloudinary')

const streamUpload = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (result) resolve(result)
        else reject(error)
      }
    )
    stream.end(fileBuffer)
  })
}

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const folder = req.body.folder || 'pulse_and_peace/general'
    const result = await streamUpload(req.file.buffer, folder)

    res.json({ success: true, url: result.secure_url, publicId: result.public_id })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { uploadImage }