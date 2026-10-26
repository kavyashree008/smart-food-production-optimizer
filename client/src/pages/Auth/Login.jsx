import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wheat, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "staff") {
        navigate("/production");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen w-full flex bg-background-light dark:bg-background-dark">
      {/* Left Value Proposition Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
            <Wheat className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg tracking-tight">SmartFood</h1>
            <p className="text-xs font-semibold text-primary-200 uppercase tracking-widest">
              Production Optimizer
            </p>
          </div>
        </div>

        <div className="my-auto max-w-lg z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-accent">
            <span>✨ AI-Powered & FEFO-Aware</span>
          </div>
          <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight">
            Stop guessing your food production schedule.
          </h2>
          <p className="text-primary-100 text-base leading-relaxed">
            Eliminate ingredient expiry, prevent costly stockouts, and dynamically balance your
            factory line capacity with deterministic net requirements and FEFO batch allocation.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/15">
            <div>
              <p className="text-2xl font-bold font-heading text-accent">98.4%</p>
              <p className="text-xs text-primary-200">On-time delivery rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-heading text-emerald-300">0 kg</p>
              <p className="text-xs text-primary-200">Batch spoilage with FEFO</p>
            </div>
          </div>
        </div>

        <div className="z-10 text-xs text-primary-200 flex items-center justify-between">
          <span>Enterprise Food Manufacturing Decision System</span>
          <span>v1.0 Production Ready</span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Welcome back
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in to manage adaptive manufacturing decisions
            </p>
          </div>

          {/* Quick Demo Logins */}
          <div className="p-3 rounded-2xl bg-primary-50/70 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/60">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-800 dark:text-primary-300 mb-2">
              ⚡ Quick Demo Logins:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@smartfood.com", "Admin@123")}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-surface-dark border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:border-primary-400 transition-all shadow-xs"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("manager@smartfood.com", "Manager@123")}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-surface-dark border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:border-primary-400 transition-all shadow-xs"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("staff@smartfood.com", "Staff@123")}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-surface-dark border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:border-primary-400 transition-all shadow-xs"
              >
                Staff
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="e.g. manager@smartfood.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
