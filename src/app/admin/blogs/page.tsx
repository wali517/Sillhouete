"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, FileText, Search } from "lucide-react";
import type { BlogPost } from "@/types";

const CATEGORIES = ["Fashion & Style", "Bridal", "Events", "Lifestyle", "Behind the Brand", "Styling Tips"];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const emptyForm = {
  title: "", slug: "", category: "Fashion & Style", coverImage: "", author: "Sillhouete Editorial",
  excerpt: "", content: "", tags: "", readTime: "5 min read", publishedAt: new Date().toISOString().split("T")[0],
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      setBlogs(data.blogs || []);
    } catch {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlogs(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (blog: BlogPost) => {
    setEditingId(blog.id);
    setForm({
      title: blog.title, slug: blog.slug, category: blog.category,
      coverImage: blog.coverImage, author: blog.author, excerpt: blog.excerpt,
      content: blog.content, tags: blog.tags.join(", "),
      readTime: blog.readTime, publishedAt: blog.publishedAt,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { showToast("Title and content are required"); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        slug: form.slug || slugify(form.title),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        ...(editingId ? { id: editingId } : {}),
      };

      const url = editingId ? `/api/blogs/${editingId}` : "/api/blogs";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      showToast(editingId ? "Blog updated" : "Blog created");
      setIsOpen(false);
      await fetchBlogs();
    } catch {
      showToast("Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      showToast("Blog deleted");
      await fetchBlogs();
    } catch {
      showToast("Failed to delete");
    }
  };

  const filtered = blogs.filter((b) =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm shadow-lg">{toast}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500">{blogs.length} articles</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search blogs..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-gray-50" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No blog posts yet. Create your first one!</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((blog) => (
              <div key={blog.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                {blog.coverImage ? (
                  <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                    <Image src={blog.coverImage} alt={blog.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-24 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{blog.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{blog.category}</span>
                    <span className="text-xs text-gray-400">{blog.author}</span>
                    <span className="text-xs text-gray-400">{blog.publishedAt}</span>
                    <span className="text-xs text-gray-400">{blog.readTime}</span>
                  </div>
                  {blog.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {blog.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(blog)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(blog.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? "Edit Blog Post" : "New Blog Post"}</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Title *</label>
                  <input type="text" value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Slug</label>
                  <input type="text" value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Cover Image URL</label>
                  <input type="url" value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Author</label>
                  <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Published Date</label>
                  <input type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Read Time</label>
                  <input type="text" value={form.readTime} onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                    placeholder="5 min read"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Tags (comma-separated)</label>
                  <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="Fashion, Bridal, Style"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Excerpt (160 chars)</label>
                  <textarea rows={2} maxLength={200} value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Content * (Markdown supported)</label>
                  <textarea rows={10} value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Write your blog post content here..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-y font-mono" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving}
                className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Update Post" : "Publish Post"}
              </button>
              <button onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
