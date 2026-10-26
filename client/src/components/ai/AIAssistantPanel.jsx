import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Bot, User, CornerDownLeft, Loader2, Package, AlertTriangle, TrendingDown } from "lucide-react";
import { aiApi } from "../../services/aiApi.js";
import { formatCurrency } from "../../utils/formatters.js";
import toast from "react-hot-toast";

const SUGGESTIONS = [
  "Which batches are expiring in the next 7 days?",
  "What is our top production recommendation today?",
  "Summarize this month's waste and causes",
  "Which orders are due in the next 3 days?",
  "What's our current stock level and safety buffer?"
];

export function AIAssistantPanel({ open, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your AI Production Assistant. I can check expiring batches, recommend production schedules, analyze waste trends, or verify stock levels using real-time factory data. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (userText) => {
    const text = userText || input;
    if (!text.trim() || loading) return;

    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await aiApi.chat(newMsgs);
      const reply = res.data?.reply || res.data?.message || "I processed your request using the live planning engine.";
      const toolCalls = res.data?.toolCalls || [];
      setMessages([...newMsgs, { role: "assistant", content: reply, toolCalls }]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reach AI assistant");
      setMessages([
        ...newMsgs,
        {
          role: "assistant",
          content: "I'm currently having trouble reaching the AI model. However, you can check live recommendations directly on the Planning and Inventory pages."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs pointer-events-auto"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 max-w-md w-full bg-white dark:bg-surface-dark border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col pointer-events-auto z-10"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-primary-50/50 dark:bg-primary-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">AI Production Assistant</h3>
                  <p className="text-[10px] text-slate-500">Smart Factory Decision Engine · Live Telemetry</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Feed */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 text-xs leading-relaxed ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    m.role === "user"
                      ? "bg-primary-600 text-white font-medium"
                      : "bg-slate-50 dark:bg-surface-darkElevated border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {/* Tool call badges */}
                    {m.toolCalls?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Tools Used</p>
                        {m.toolCalls.map((tc, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-primary-600 dark:text-primary-400 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                            {tc.toolName || tc.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 text-xs justify-start">
                  <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="rounded-2xl px-4 py-2.5 bg-slate-50 dark:bg-surface-darkElevated border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                    <span>Analyzing factory telemetry...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-surface-darkElevated border-t border-slate-100 dark:border-slate-800 overflow-x-auto flex gap-1.5 no-scrollbar">
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  disabled={loading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 hover:border-primary-400 hover:text-primary-600 transition-colors shrink-0 disabled:opacity-50"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about batches, plans, orders..."
                  disabled={loading}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-slate-50 dark:bg-surface-darkElevated focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}