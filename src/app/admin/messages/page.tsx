"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare, Mail, Phone, Trash2, Check, Reply, ChevronDown, ChevronUp, Send, Loader2
} from "lucide-react";
import type { ContactMessage } from "@/types";
import AdminPagination from "@/components/admin/AdminPagination";

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-red-100 text-red-700",
  read: "bg-gray-100 text-gray-600",
  replied: "bg-blue-100 text-blue-700",
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyNotes, setReplyNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const updateStatus = async (id: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, replyNotes: notes }),
      });
      if (!res.ok) throw new Error();
      showToast(`Marked as ${status}`);
      await fetchMessages();
    } catch {
      showToast("Failed to update message", true);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await fetch(`/api/contact/${id}`, { method: "DELETE" });
      showToast("Message deleted");
      await fetchMessages();
    } catch {
      showToast("Failed to delete message", true);
    }
  };

  const sendDirectReply = async (msg: ContactMessage) => {
    const text = (replyNotes[msg.id] ?? msg.replyNotes ?? "").trim();
    if (!text) {
      showToast("Please type a reply message in the box before sending", true);
      return;
    }

    setSendingEmailId(msg.id);
    try {
      const res = await fetch(`/api/contact/${msg.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: msg.email,
          customerName: msg.name,
          subject: `Re: ${msg.subject || "Your Inquiry with Sillhouete"}`,
          replyText: text,
          originalMessage: msg.message,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Email sent successfully to ${msg.email}!`);
        await fetchMessages();
      } else {
        showToast(
          data.warning || data.error || "Failed to send email. Check SMTP settings in Admin Settings.",
          true
        );
        await fetchMessages();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error sending email reply";
      showToast(message, true);
    } finally {
      setSendingEmailId(null);
    }
  };

  const filtered = messages.filter((m) => filter === "all" || m.status === filter);
  const unreadCount = messages.filter((m) => m.status === "unread").length;

  const tabs = [
    { key: "all", label: `All (${messages.length})` },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "read", label: `Read` },
    { key: "replied", label: `Replied` },
  ];

  // Pagination slice
  const paginatedMessages = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm shadow-xl flex items-center gap-2 border ${
            toast.isError
              ? "bg-red-900 border-red-700 text-white"
              : "bg-gray-900 border-gray-700 text-white"
          }`}
        >
          <span>{toast.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" /> Customer Messages
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-red-600 font-semibold mt-0.5">
              {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setFilter(t.key);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filter === t.key
                ? "bg-black text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No messages found
          </div>
        ) : (
          <>
            {paginatedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${
                  msg.status === "unread" ? "border-red-200 bg-red-50/20" : "border-gray-200"
                }`}
              >
                {/* Header row */}
                <div
                  className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{msg.name}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          STATUS_COLORS[msg.status]
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      {msg.subject || "General Inquiry"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
                      <span>{new Date(msg.createdAt).toLocaleString()}</span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {msg.email}
                      </span>
                      {msg.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {msg.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-gray-400">
                    {expandedId === msg.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Expanded panel */}
                {expandedId === msg.id && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                    {/* Full customer message */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                        Full Customer Message
                      </p>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed bg-white border border-gray-200 rounded-lg p-3">
                        {msg.message}
                      </div>
                    </div>

                    {/* Direct reply box */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
                          Reply Message (Sends directly to customer email)
                        </label>
                        <span className="text-[11px] text-gray-500 font-mono">
                          Recipient: <strong>{msg.email}</strong>
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={replyNotes[msg.id] ?? msg.replyNotes ?? ""}
                        onChange={(e) =>
                          setReplyNotes((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                        placeholder={`Type your reply to send directly to ${msg.email}...`}
                        className="w-full text-sm border border-gray-300 rounded-lg p-3 outline-none focus:border-black focus:ring-1 focus:ring-black resize-none bg-white shadow-xs"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {msg.status === "unread" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(msg.id, "read")}
                          className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3.5 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" /> Mark as Read
                        </button>
                      )}

                      {/* Send Email Directly from this box */}
                      <button
                        type="button"
                        disabled={sendingEmailId === msg.id}
                        onClick={() => sendDirectReply(msg)}
                        className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {sendingEmailId === msg.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Sending to {msg.email}...
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Send Email Reply
                          </>
                        )}
                      </button>

                      {/* Save Notes Only without sending email */}
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(msg.id, "replied", replyNotes[msg.id] ?? msg.replyNotes)
                        }
                        className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                      >
                        <Reply className="h-3.5 w-3.5" /> Save Note Only
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteMessage(msg.id)}
                        className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors ml-auto cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination Controls */}
            <AdminPagination
              currentPage={currentPage}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
