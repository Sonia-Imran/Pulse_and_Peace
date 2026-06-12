import { useState } from "react"
import { Form, Input, Button, Card, Space, Divider } from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import API from "../../../api"
import "./login.css"

const Login = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const { data } = await API.post("/auth/login", {
        email: values.email,
        password: values.password,
      })

      const user = data.data

      if (user.role === "admin") {
        localStorage.setItem("admin-token", user.token)
        window.location.href = "/dashboard"

      } else if (user.role === "doctor") {
        localStorage.setItem("doctor-token", user.token)
        localStorage.setItem("doctor_profile", JSON.stringify({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          specialty: user.specialty || "General Physician",
          phone: user.phone || "",
          role: "doctor",
        }))
        window.location.href = "/doctor/dashboard"

      } else {
        localStorage.setItem("user-token", user.token)
        localStorage.setItem("patient_profile", JSON.stringify({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || "",
          role: "patient",
          profilePic: user.profilePic || "",
        }))
        window.location.href = "/"
      }

    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password"
      form.setFields([{ name: "password", errors: [msg] }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card" variant="borderless">
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <div className="logo-section">
            <h1 className="app-title">Pulse & Peace</h1>
            <p className="app-subtitle">Welcome back</p>
          </div>
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="email" rules={[{ required: true, message: "Please enter your email" }, { type: "email", message: "Invalid email format" }]}>
              <Input prefix={<UserOutlined />} placeholder="Email address" size="large" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: "Please enter your password" }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>Login</Button>
            </Form.Item>
          </Form>
          <Divider>New User?</Divider>
          <Button type="default" size="large" block onClick={() => navigate("/signup")}>Create Account</Button>
        </Space>
      </Card>
    </div>
  )
}

export default Login