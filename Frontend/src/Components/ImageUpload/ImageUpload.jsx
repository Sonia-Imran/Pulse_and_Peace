import { useState } from 'react'
import { message } from 'antd'
import API from '../../api'
import './ImageUpload.css'

export default function ImageUpload({ value, onChange, folder = 'pulse_and_peace/general', placeholder = 'Upload Image' }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      message.error('Only image files are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('File size must be less than 5MB')
      return
    }

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', folder)

      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setPreview(data.url)
      onChange && onChange(data.url)
      message.success('Image uploaded successfully')
    } catch (err) {
      setPreview(value || '')
      onChange && onChange(value || '')
      message.error(err.response?.data?.message || 'Upload failed. Check Cloudinary credentials.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="iu-wrapper">
      {preview && (
        <div className="iu-preview-wrap">
          <img src={preview} alt="preview" className="iu-preview-img" />
          {uploading && (
            <div className="iu-uploading-overlay">
              <div className="iu-spinner" />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      )}
      <label className="iu-label">
        <input
          type="file"
          accept="image/*"
          className="iu-input-hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <span className="iu-btn">
          {uploading ? '⏳ Uploading...' : preview ? '🔄 Change Image' : `📷 ${placeholder}`}
        </span>
      </label>
    </div>
  )
}