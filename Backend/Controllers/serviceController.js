const Service = require('../models/Service')
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

const uploadToCloudinary = async (file, folder = 'pulse_and_peace/services') => {
  if (!file) return null
  const result = await streamUpload(file.buffer, folder)
  return result.secure_url
}

const extractPublicId = (url) => {
  if (!url) return null
  const parts = url.split('/')
  const filename = parts[parts.length - 1].split('.')[0]
  const folder = parts[parts.length - 2]
  return `${folder}/${filename}`
}

const addService = async (req, res) => {
  try {
    const { serviceName, category, baseFee, duration, description, image: bodyImage } = req.body

    let imageUrl = bodyImage || ''

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file)
    }

    const service = await Service.create({
      doctor:       req.user._id,
      providerName: req.user.fullName,
      serviceName,
      category,
      baseFee:      Number(baseFee),
      duration:     Number(duration),
      description,
      image:        imageUrl,
      status:       'Pending',
    })

    res.status(201).json({ success: true, data: service })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getDoctorServices = async (req, res) => {
  try {
    const services = await Service.find({ doctor: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, data: services })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateService = async (req, res) => {
  try {
    const existing = await Service.findOne({ _id: req.params.id, doctor: req.user._id })
    if (!existing) return res.status(404).json({ success: false, message: 'Service not found' })

    let imageUrl = req.body.image || existing.image

    if (req.file) {
      if (existing.image) {
        const publicId = extractPublicId(existing.image)
        if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {})
      }
      imageUrl = await uploadToCloudinary(req.file)
    }

    const { serviceName, category, baseFee, duration, description } = req.body

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user._id },
      {
        serviceName,
        category,
        baseFee:     Number(baseFee),
        duration:    Number(duration),
        description,
        image:       imageUrl,
        status:      'Pending',
      },
      { new: true }
    )

    res.json({ success: true, data: service })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteService = async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, doctor: req.user._id })
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' })

    if (service.image) {
      const publicId = extractPublicId(service.image)
      if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {})
    }

    await Service.findOneAndDelete({ _id: req.params.id, doctor: req.user._id })
    res.json({ success: true, message: 'Service deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getApprovedServices = async (req, res) => {
  try {
    const services = await Service.find({ status: 'Approved' }).sort({ createdAt: -1 })
    res.json({ success: true, data: services })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 })
    res.json({ success: true, data: services })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateServiceStatus = async (req, res) => {
  try {
    const { status } = req.body
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' })
    res.json({ success: true, data: service })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
  addService, getDoctorServices, updateService,
  deleteService, getApprovedServices, getAllServices, updateServiceStatus,
}