import React, { useState } from "react";
import axios from "axios";
import Logo from "../assets/auralink-logo.png";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Register({ onSuccess, switchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(API + "/api/auth/register", {
        username,
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onSuccess({ token, user });
    } catch (err) {
      setError("Registration failed — email may already exist.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#071229] px-4">
      <div className="auth-card w-full max-w-md relative">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Auralink Logo" className="w-24 drop-shadow-lg" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Create Your Account
        </h2>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-center mb-4">{error}</div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-6">

          {/* USERNAME */}
          <div className="relative">
            <label
              className={`
                absolute left-3 top-3 text-slate-400 transition-all pointer-events-none
                ${username ? "text-xs -top-2" : ""}
              `}
            >
              Username
            </label>
            <input
              className="w-full p-3 pt-6 rounded-lg bg-slate-900/40 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* EMAIL */}
          <div className="relative">
            <label
              className={`
                absolute left-3 top-3 text-slate-400 transition-all pointer-events-none
                ${email ? "text-xs -top-2" : ""}
              `}
            >
              Email
            </label>
            <input
              type="email"
              className="w-full p-3 pt-6 rounded-lg bg-slate-900/40 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <label
              className={`
                absolute left-3 top-3 text-slate-400 transition-all pointer-events-none
                ${password ? "text-xs -top-2" : ""}
              `}
            >
              Password
            </label>

            <input
              type={showPass ? "text" : "password"}
              className="w-full p-3 pt-6 rounded-lg bg-slate-900/40 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Show / Hide */}
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-[18px] text-sm text-cyan-300 hover:underline"
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="btn w-full p-3 rounded-lg text-slate-900 font-bold text-lg mt-2"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-sm text-center opacity-80">
          Already have an account?{" "}
          <button
            onClick={switchToLogin}
            className="text-cyan-300 hover:underline"
          >
            Log In
          </button>
        </p>

      </div>
    </div>
  );
}
