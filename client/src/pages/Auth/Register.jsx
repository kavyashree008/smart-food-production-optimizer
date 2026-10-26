import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wheat, Lock, Mail, User, ArrowRight } from "lucide-react";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const user = await register({ name, email, password, role });
      if (user.role === "staff") {
        navigate("/production");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background-light dark:bg-background-dark">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Wheat className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg tracking-tight">SmartFood</h1>
            <p className="text-xs font-semibold text-primary-200 uppercase tracking-widest">
              Production Optimizer
            </p>
          </div>
        </div>

        <div className="my-auto max-w-lg z-10 space-y-4">
          <h2 className="font-heading text-3xl font-extrabold leading-tight">
            Join the smart food manufacturing ecosystem.
          </h2>
          <p className="text-primary-100 text-sm leading-relaxed">
            Gain full visibility into stock risks, batch shelf-life metrics, automated FEFO
            material checks, and intelligent plan generation.
          </p>
        </div>

        <div className="z-10 text-xs text-primary-200">
          © Smart Food Production Optimizer. All rights reserved.
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Create an Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your role and start streamlining factory throughput
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Work Email"
              type="email"
              icon={Mail}
              placeholder="e.g. ramesh@factory.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password (min 6 chars)"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="manager">Manager (Planning & Decision Engine)</option>
                <option value="admin">Admin (Full System Access)</option>
                <option value="staff">Production Staff (Schedule & Tasks)</option>
              </select>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
            >
              Register & Continue
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
