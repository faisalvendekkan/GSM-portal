import { Bot, Send, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Loader from "../components/Loader.jsx";
import { getApiMessage } from "../utils/helpers.js";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .get("/ai/history")
      .then(({ data }) => {
        setMessages(
          data.chats.flatMap((chat) => [
            { id: `${chat.id}-q`, role: "student", text: chat.question },
            { id: `${chat.id}-a`, role: "assistant", text: chat.answer }
          ])
        );
      })
      .catch((err) => setError(getApiMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, replying]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    setQuestion("");
    setError("");
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "student", text }]);
    setReplying(true);
    try {
      const { data } = await api.post("/ai/chat", { question: text });
      setMessages((current) => [...current, { id: `${data.chat.id}-a`, role: "assistant", text: data.chat.answer }]);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-150px)] gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="flex min-h-[70vh] flex-col p-0">
        <div className="border-b border-white/10 p-4">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Bot className="text-electric-400" />
            AI Repair Assistant
          </h2>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {loading ? <Loader label="Loading chat" /> : null}
          {!loading && !messages.length ? (
            <div className="rounded-lg border border-dashed border-white/[0.15] p-6 text-center text-slate-300">
              Ask about charging, display, battery drain, network, camera, audio, flashing, schematics, or IC basics.
            </div>
          ) : null}
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "student" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" ? (
                <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-electric-500 text-white">
                  <Bot size={18} />
                </div>
              ) : null}
              <div
                className={`max-w-[88%] rounded-lg px-4 py-3 text-sm leading-6 ${
                  message.role === "student" ? "bg-electric-500 text-white" : "bg-white/[0.08] text-slate-100"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
              {message.role === "student" ? (
                <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-slate-200">
                  <UserRound size={18} />
                </div>
              ) : null}
            </div>
          ))}
          {replying ? (
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="typing-dot" />
              AI is checking the repair flow...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
          {error ? <div className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
          <div className="flex gap-2">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: Phone takes charging but battery percentage does not increase"
              className="min-h-12 flex-1 resize-none rounded-lg border border-white/10 bg-navy-900/80 px-3 py-3 text-sm text-slate-100 outline-none focus:border-electric-400 focus:ring-2 focus:ring-electric-500/25"
            />
            <Button type="submit" icon={Send} disabled={replying} aria-label="Send question">
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </form>
      </Card>
      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <ShieldAlert className="text-amber-300" size={19} />
          Safety First
        </h3>
        <div className="space-y-3 text-sm leading-6 text-slate-300">
          <p>Disconnect the battery before board work.</p>
          <p>Use low heat and proper shielding around plastic, cameras, and batteries.</p>
          <p>Verify ownership before any reset or account-related service.</p>
          <p>Back up customer data before software repair when possible.</p>
        </div>
      </Card>
    </div>
  );
}
