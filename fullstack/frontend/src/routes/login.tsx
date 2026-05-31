// ─── Login Page ───────────────────────────────────────────────────────────────
// This is the entry point to the GamaFlow platform — the first page any user
// sees before accessing any protected content.
//
// Layout: split-screen design
//   LEFT  — GAMA Consulting branding image with dark teal overlay
//   RIGHT — login form inside a glassmorphism card
//
// Authentication flow:
//   1. User enters email and password
//   2. handleLogin fires on form submit, calling loginMutation.mutate()
//   3. useAuth hook sends POST /api/v1/login/access-token to the backend
//   4. On success: JWT token stored in localStorage, router redirects to dashboard
//   5. On failure: loginMutation.isError becomes true (error UI can be added)
//
// Styling is handled in login.css rather than Tailwind because the
// ::before pseudo-element overlay and backdrop-filter blur are more
// naturally expressed in traditional CSS than utility classes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import useAuth from "@/hooks/useAuth"
import "./login.css"

// Register this file as the /login route with TanStack Router.
// File-based routing means the file's location determines its URL path.
// /login is a public route — no authentication required to access it.
export const Route = createFileRoute("/login")({
  component: Login,
})

function Login() {
  // Controlled state for the email input field.
  // Starts empty — updated on every keystroke via the onChange handler.
  const [email, setEmail] = useState("")

  // Controlled state for the password input field.
  // Starts empty — updated on every keystroke via the onChange handler.
  const [password, setPassword] = useState("")

  // loginMutation comes from the useAuth hook — it wraps the login API call
  // using React Query's useMutation. Key properties used here:
  //   .mutate()    — fires the POST request with the provided credentials
  //   .isPending   — true while the request is in flight (shows loading state)
  //   .isError     — true if the request failed (can be used to show error message)
  const { loginMutation } = useAuth()

  // Handles form submission.
  // e.preventDefault() stops the browser's default behaviour of reloading the
  // page on form submit — without this, React state would be lost on every submit.
  // loginMutation.mutate() sends the credentials to the backend auth endpoint.
  const handleLogin = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    loginMutation.mutate({ username: email, password })
  }

  return (
    // Outer container — flex row splitting the screen 50/50
    // Styles defined in login.css
    <div className="login-container">

      {/* ── LEFT PANEL — GAMA branding ── */}
      {/* Background image set in CSS: url("/img/gama.jpg") with dark teal overlay */}
      {/* The ::before pseudo-element in CSS creates the overlay on top of the image */}
      {/* so the white text below remains readable against the photo */}
      <div className="login-left">
        <div className="top-left-text">
          <h1>GamaFlow</h1>
          <p>AI project management intelligence platform</p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login form ── */}
      {/* Teal gradient background with a glassmorphism card centred inside */}
      {/* Glassmorphism = backdrop-filter blur + semi-transparent white background */}
      <div className="login-right">
        <div className="login-box">
          <h2>Welcome Back!</h2>
          <p className="subtitle">Sign in to continue</p>

          {/* Form — onSubmit calls handleLogin which fires the API request */}
          <form onSubmit={handleLogin}>

            {/* Email input — type="email" enables browser-level format validation */}
            {/* The browser checks for @ symbol before allowing submission */}
            {/* value and onChange make this a controlled input — React owns the value */}
            {/* required prevents submission if the field is empty */}
            <input
              type="email"
              placeholder="Email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password input — type="password" masks characters as the user types */}
            {/* Also a controlled input — React state tracks the value */}
            {/* required prevents submission if the field is empty */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Forgot password link — navigates to the password recovery page */}
            {/* Recovery logic lives in its own route file, not here */}
            <a href="/recover-password" className="forgot">
              Forgot your password?
            </a>

            {/* Submit button — two states controlled by loginMutation.isPending:
                  IDLE:    "LOGIN" — normal blue button, clickable
                  PENDING: "SIGNING IN..." — greyed out, disabled
                The disabled attribute prevents duplicate submissions while
                the API request is still in flight */}
            <button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "SIGNING IN..." : "LOGIN"}
            </button>

          </form>
        </div>
      </div>

    </div>
  )
}
