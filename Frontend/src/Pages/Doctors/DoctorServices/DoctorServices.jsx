import { useState, useEffect } from 'react'
import { Card, Button, Modal, Form, Input, InputNumber, Select, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons'
import ImageUpload from '../../../Components/ImageUpload/ImageUpload'
import API from '../../../api'
import './DoctorServices.css'

const { Option }   = Select
const { TextArea } = Input

export default function DoctorServices() {
  const [form]          = Form.useForm()
  const [isModalOpen,  setIsModalOpen]  = useState(false)
  const [isEditMode,   setIsEditMode]   = useState(false)
  const [editingKey,   setEditingKey]   = useState(null)
  const [imageUrl,     setImageUrl]     = useState('')
  const [servicesData, setServicesData] = useState([])
  const [loading,      setLoading]      = useState(false)

  useEffect(() => { loadServices() }, [])

  const loadServices = async () => {
    try {
      const { data } = await API.get('/services/my')
      setServicesData(data.data || [])
    } catch {
      message.error('Failed to load services')
    }
  }

  const openCreateModal = () => {
    setIsEditMode(false)
    setEditingKey(null)
    setImageUrl('')
    form.resetFields()
    setIsModalOpen(true)
  }

  const openEditModal = (record) => {
    setIsEditMode(true)
    setEditingKey(record._id)
    setImageUrl(record.image || '')
    form.setFieldsValue({
      serviceName: record.serviceName,
      category:    record.category,
      baseFee:     record.baseFee,
      duration:    record.duration,
      description: record.description,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await API.delete(`/services/${id}`)
      message.success('Service removed.')
      loadServices()
    } catch {
      message.error('Failed to delete service')
    }
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const payload = { ...values, image: imageUrl }
      if (isEditMode) {
        await API.put(`/services/${editingKey}`, payload)
        message.info('Service re-submitted for admin approval.')
      } else {
        await API.post('/services', payload)
        message.success('Service sent to admin for approval.')
      }
      setIsModalOpen(false)
      form.resetFields()
      setImageUrl('')
      loadServices()
    } catch {
      message.error('Failed to submit service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="services-main-container">
      <div className="page-top-header">
        <div className="services-header-inner">
          <div>
            <h2 className="page-top-title">My Services</h2>
            <p className="page-top-sub">All services require admin approval before going live for patients.</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" className="services-add-btn" onClick={openCreateModal}>
            Add Service
          </Button>
        </div>
      </div>

      <div className="services-grid">
        {servicesData.length === 0 ? (
          <div className="services-empty">No services added yet. Click "Add Service" to get started.</div>
        ) : (
          servicesData.map(service => (
            <Card key={service._id} className="service-card-item" bordered={false} bodyStyle={{ padding: 0 }}>
              <div className="service-banner-frame">
                <img
                  src={service.image }
                  alt={service.serviceName}
                  className="service-display-img"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1584515903407-3c104269b7c6?auto=format&fit=crop&w=500&q=80' }}
                />
                <div className="service-badge-overlay">
                  <span className={`status-badge ${(service.status || 'pending').toLowerCase()}`}>
                    {service.status || 'Pending'}
                  </span>
                </div>
              </div>
              <div className="service-card-body-content">
                <h3 className="service-title-text">{service.serviceName}</h3>
                <p className="service-description-para">{service.description}</p>
                <div className="service-meta-footer">
                  <div>
                    <span className="meta-label-block"><ClockCircleOutlined /> MAX RESPONSE</span>
                    <strong className="service-duration-val">{service.duration} Hours</strong>
                  </div>
                  <div>
                    <span className="meta-label-block right-align">FEE</span>
                    <span className="service-fee-amount">Rs. {service.baseFee}</span>
                  </div>
                </div>
                <div className="service-card-actions">
                  <Button icon={<EditOutlined />} size="small" onClick={() => openEditModal(service)}>Edit</Button>
                  <Popconfirm title="Delete this service?" onConfirm={() => handleDelete(service._id)} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}>
                    <Button icon={<DeleteOutlined />} size="small" danger />
                  </Popconfirm>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        title={isEditMode ? 'Edit Service' : 'Add New Service'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="services-modal-form">
          <Form.Item label="Service Banner Image">
            <ImageUpload
              value={imageUrl}
              onChange={url => setImageUrl(url)}
              folder="pulse_and_peace/services"
              placeholder="Upload Service Banner"
            />
          </Form.Item>
          <Form.Item name="serviceName" label="Service Name" rules={[{ required: true, message: 'Enter service name' }]}>
            <Input placeholder="e.g. Premium Medical Chat Support" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Select category' }]}>
            <Select placeholder="Select category">
              <Option value="Therapy">Therapy</Option>
              <Option value="Cardiology">Cardiology</Option>
              <Option value="Nutrition">Nutrition</Option>
              <Option value="General">General</Option>
            </Select>
          </Form.Item>
          <div className="form-split-row">
            <Form.Item name="baseFee" label="Fee (PKR)" rules={[{ required: true, message: 'Enter fee' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="800" />
            </Form.Item>
            <Form.Item name="duration" label="Response Time (Hours)" rules={[{ required: true, message: 'Enter hours' }]}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="12" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Enter description' }]}>
            <TextArea rows={3} placeholder="Describe what patients should prepare..." />
          </Form.Item>
          <Form.Item className="form-actions-wrapper">
            <Button onClick={() => setIsModalOpen(false)} className="form-cancel-btn">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} className="services-add-btn">
              {isEditMode ? 'Re-submit for Approval' : 'Submit for Approval'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}