import { useState } from "react"
import { Form, Input, Button, Card, Space, Divider } from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import API from "../../../api"
import WelcomeLoader from "../../../Components/WelcomeLoader/WelcomeLoader"
import "./login.css"

const Login = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [welcome, setWelcome] = useState(null) // { name, role, redirectTo }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const { data } = await API.post("/auth/login", {
        email: values.email,
        password: values.password,
      })

      const user = data.data

      // Clear any leftover tokens/profiles from other roles so a previous
      // patient/doctor/admin session on this browser can never bleed into
      // the new session (this was causing appointments to appear under
      // the wrong / every doctor account).
      localStorage.removeItem("admin-token")
      localStorage.removeItem("doctor-token")
      localStorage.removeItem("doctor_profile")
      localStorage.removeItem("user-token")
      localStorage.removeItem("patient_profile")

      if (user.role === "admin") {
        localStorage.setItem("admin-token", user.token)
        setWelcome({ name: user.fullName, role: "admin", redirectTo: "/dashboard" })

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
        setWelcome({ name: user.fullName, role: "doctor", redirectTo: "/doctor/dashboard" })

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
        setWelcome({ name: user.fullName, role: "patient", redirectTo: "/" })
      }

    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password"
      form.setFields([{ name: "password", errors: [msg] }])
    } finally {
      setLoading(false)
    }
  }

  if (welcome) {
    return (
      <WelcomeLoader
        name={welcome.name}
        role={welcome.role}
        onFinish={() => { window.location.href = welcome.redirectTo }}
      />
    )
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