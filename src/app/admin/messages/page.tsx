"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Trash2,
  CheckCircle,
  Eye,
  X,
  AlertCircle,
  Reply,
} from "lucide-react";
import type { ContactMessage } from "@/types";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read" | "replied">("all");
  const [search, setSearch] = useState("");

  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [replyNotes, setReplyNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const openMessage = (msg: ContactMessage) => {
    setSelectedMsg(msg);
    setReplyNotes(msg.replyNotes || "");
    // If unread, automatically mark as read
    if (msg.status === "unread") {
      updateStatus(msg.id, "read");
    }
  };

  const updateStatus = async (id: string, status: "unread" | "read" | "replied", notes?: string) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, replyNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m.id === id ? data.message : m)));
        if (selectedMsg?.id === id) {
          setSelectedMsg(data.message);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMsg) return;
    setSaving(true);
    await updateStatus(selectedMsg.id, "replied", replyNotes);
    setSaving(false);
    alert("Inquiry marked as replied with your notes!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMsg?.id === id) setSelectedMsg(null);
      }
    } catch {
      alert("Failed to delete message");
    }
  };

  const filteredMessages = messages.filter((m) => {
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customer Inquiries</h1>
        <p className="text-sm text-gray-500">
          Messages received via Contact Us form and boutique styling requests.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "unread", "read", "replied"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st} {st === "unread" && messages.filter((m) => m.status === "unread").length > 0 && `(${messages.filter((m) => m.status === "unread").length})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquiries..."
            className="w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-4 text-xs outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Messages Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading messages...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No inquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 uppercase tracking-wider text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMessages.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      m.status === "unread" ? "bg-amber-50/40 font-medium" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <strong className="block text-gray-900 text-sm">{m.name}</strong>
                      <span className="text-[11px] text-gray-500">{m.email}</span>
                      {m.phone && <span className="text-[11px] text-gray-400 block">{m.phone}</span>}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {m.subject || "General Inquiry"}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-gray-600">
                      {m.message}
                    </td>

                    <td className="py-3.5 px-4 text-gray-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          m.status === "unread"
                            ? "bg-red-100 text-red-800"
                            : m.status === "replied"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openMessage(m)}
                          className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {selectedMsg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedMsg(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedMsg.subject}</h2>
                <p className="text-xs text-gray-500">
                  Received {new Date(selectedMsg.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMsg(null)}
                className="text-gray-400 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sender details */}
            <div className="rounded-lg bg-gray-50 p-4 space-y-1 text-xs">
              <p><strong>From:</strong> {selectedMsg.name}</p>
              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${selectedMsg.email}`} className="text-blue-600 underline">
                  {selectedMsg.email}
                </a>
              </p>
              {selectedMsg.phone && (
                <p>
                  <strong>Phone / WhatsApp:</strong>{" "}
                  <a href={`https://wa.me/${selectedMsg.phone.replace(/\D/g, "")}`} target="_blank" className="text-emerald-700 underline">
                    {selectedMsg.phone} (Open WhatsApp)
                  </a>
                </p>
              )}
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Inquiry Message
              </label>
              <div className="rounded-lg border border-gray-200 p-4 text-xs leading-relaxed text-gray-800 bg-white whitespace-pre-wrap">
                {selectedMsg.message}
              </div>
            </div>

            {/* Admin Response / Notes */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold uppercase tracking-wider text-gray-700">
                Studio Reply / Internal Notes
              </label>
              <textarea
                rows={3}
                value={replyNotes}
                onChange={(e) => setReplyNotes(e.target.value)}
                placeholder="Record how this customer was assisted (e.g. Called on WhatsApp, sent fabric swatches, booked studio fitting)..."
                className="w-full rounded-md border border-gray-300 p-2.5 text-xs outline-none focus:border-black"
              />
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => handleDelete(selectedMsg.id)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Delete Message
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMsg(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveNotes}
                  className="rounded-md bg-black px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800"
                >
                  {saving ? "Saving..." : "Mark as Replied"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
