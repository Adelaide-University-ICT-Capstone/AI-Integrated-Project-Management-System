import { useState } from "react"
import "./login.css"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: any) => {
    e.preventDefault()

    if (!email || !password) {
      alert("Please fill all fields")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("http://127.0.0.1:8001/api/v1/login/access-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      })

      //  Safe JSON parsing (prevents crash)
      let data = null
      try {
        data = await res.json()
      } catch (parseError) {
        console.error("JSON parse failed:", parseError)
      }

      console.log("STATUS:", res.status)
      console.log("RESPONSE DATA:", data)

      //  SUCCESS CASE
      if (res.ok && data?.access_token) {
        localStorage.setItem("access_token", data.access_token)

        alert("Login successful")

        // redirect to dashboard
        window.location.href = "/"
      } 
      //  WRONG CREDENTIALS
      else if (res.status === 400 || res.status === 401) {
        alert("Invalid email or password")
      } 
      //  ANY OTHER ERROR
      else {
        alert("Something went wrong. Try again.")
      }

    } catch (err) {
      console.error("LOGIN ERROR:", err)
      alert("Server not reachable")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left">
        <div className="top-left-text">
          <h1>GamaFlow</h1>
          <p>AI project management intelligence platform</p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <div className="login-box">
          <h2>Welcome Back!</h2>
          <p className="subtitle">Sign in to continue</p>

          <form onSubmit={handleLogin}>
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "LOGIN"}
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}