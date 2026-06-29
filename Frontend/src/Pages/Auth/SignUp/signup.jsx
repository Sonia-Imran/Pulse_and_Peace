import { useState } from "react"
import { Form, Input, Button, Card, Row, Col, Divider, Space, message } from "antd"
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import API from "../../../api"
import "./signup.css"

const SignUp = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const { data } = await API.post("/auth/register", {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      })

      const user = data.data
      localStorage.removeItem("admin-token")
      localStorage.removeItem("doctor-token")
      localStorage.removeItem("doctor_profile")
      localStorage.setItem("user-token", user.token)
      localStorage.setItem("patient_profile", JSON.stringify({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || "",
        role: "patient",
        profilePic: "",
      }))

      message.success("Account created successfully!")
      navigate("/")

    } catch (err) {
      message.error(err.response?.data?.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <Row gutter={[0, 0]} style={{ minHeight: "100vh" }}>
        <Col xs={24} sm={24} md={12} className="signup-banner">
          <div className="banner-content">
            <h1>Pulse & Peace</h1>
            <p>Join Our Community Today</p>
          </div>
        </Col>

        <Col xs={24} sm={24} md={12} className="signup-form-container">
          <Card className="signup-card" variant="borderless">
            <Space orientation="vertical" size="large" style={{ width: "100%" }}>
              <div className="form-header">
                <h2>Create Account</h2>
                <p>Sign up to get started with Pulse & Peace</p>
              </div>

              <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
                <Form.Item name="fullName" rules={[{ required: true, message: "Please enter your full name" }]}>
                  <Input prefix={<UserOutlined />} placeholder="Full Name" size="large" />
                </Form.Item>

                <Form.Item name="email" rules={[{ required: true, message: "Please enter your email" }, { type: "email", message: "Please enter a valid email" }]}>
                  <Input prefix={<MailOutlined />} placeholder="Email Address" size="large" />
                </Form.Item>

                <Form.Item name="phone" rules={[{ required: true, message: "Please enter your phone number" }]}>
                  <Input prefix={<PhoneOutlined />} placeholder="Phone Number" size="large" />
                </Form.Item>

                <Form.Item name="password" rules={[{ required: true, message: "Please enter your password" }, { min: 6, message: "Password must be at least 6 characters" }]}>
                  <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Please confirm your password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) return Promise.resolve()
                        return Promise.reject(new Error("Passwords do not match"))
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" size="large" />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>Sign Up</Button>
                </Form.Item>
              </Form>

              <Divider>OR</Divider>

              <p style={{ textAlign: "center", marginBottom: 0 }}>
                Already have an account?{" "}
                <a onClick={() => navigate("/login")} style={{ fontWeight: 600 }}>Login here</a>
              </p>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default SignUp