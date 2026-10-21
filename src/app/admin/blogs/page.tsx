"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  X,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";
import type { BlogPost } from "@/types";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Style Guide");
  const [author, setAuthor] = useState("Sillhouete Editorial");
  const [readTime, setReadTime] = useState("5 min read");
  const [coverImage, setCoverImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      if (data.blogs) {
        setBlogs(data.blogs);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openAddModal = () => {
    setEditingBlog(null);
    setTitle("");
    setSlug("");
    setCategory("Style Guide");
    setAuthor("Sillhouete Editorial");
    setReadTime("5 min read");
    setCoverImage("https://sillhouete.com/cdn/shop/articles/muslim_wedding_rituals_34c9db87-5834-4bff-a661-55201ade3345.png?v=1789022954&width=900");
    setExcerpt("");
    setContent("");
    setTagsInput("Fashion, Pakistani Couture, Trends");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (b: BlogPost) => {
    setEditingBlog(b);
    setTitle(b.title);
    setSlug(b.slug);
    setCategory(b.category);
    setAuthor(b.author);
    setReadTime(b.readTime);
    setCoverImage(b.coverImage);
    setExcerpt(b.excerpt);
    setContent(b.content);
    setTagsInput((b.tags || []).join(", "));
    setFormError("");
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingBlog) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const handleDelete = async (id: string, blogTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${blogTitle}"?`)) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert("Failed to delete article");
      }
    } catch {
      alert("Error deleting article");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !content.trim()) {
      setFormError("Title and content are required.");
      return;
    }

    setFormSubmitting(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category,
      author,
      readTime,
      coverImage: coverImage.trim(),
      excerpt: excerpt.trim() || content.slice(0, 150) + "...",
      content: content.trim(),
      tags,
    };

    try {
      if (editingBlog) {
        const res = await fetch(`/api/blogs/${editingBlog.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
        setBlogs((prev) => prev.map((b) => (b.id === editingBlog.id ? data.blog : b)));
      } else {
        const res = await fetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
        setBlogs((prev) => [data.blog, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    const q = search.toLowerCase();
    return !search || b.title.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Blog &amp; Editorial</h1>
          <p className="text-sm text-gray-500">
            Publish fashion trends, bridal style guides, and wedding ceremony heritage stories.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Write New Story</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories by title or category..."
            className="w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-4 text-xs outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Blogs Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading articles...</div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No blog posts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 uppercase tracking-wider text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Story</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Read Time</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBlogs.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                          <Image
                            src={b.coverImage}
                            alt={b.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <strong className="block text-gray-900 text-sm font-semibold">{b.title}</strong>
                          <span className="text-[11px] text-gray-400 font-mono">/blogs/news/{b.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-700">
                        {b.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-700 font-medium">{b.author}</td>

                    <td className="py-3.5 px-4 text-gray-500">{b.readTime}</td>

                    <td className="py-3.5 px-4 text-gray-500">{b.publishedAt}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/blogs/news/${b.slug}`}
                          target="_blank"
                          className="rounded p-1 text-gray-400 hover:text-black hover:bg-gray-100"
                          title="View on Store"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id, b.title)}
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

      {/* Add / Edit Blog Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                {editingBlog ? "Edit Article" : "Write New Editorial Article"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Rituals Inside a Muslim Wedding Ceremony"
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. rituals-inside-a-muslim-wedding"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black bg-white"
                  >
                    <option value="Bridal & Weddings">Bridal &amp; Weddings</option>
                    <option value="Style Guide">Style Guide</option>
                    <option value="Trends">Trends</option>
                    <option value="Heritage">Heritage</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Sillhouete Editorial"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Estimated Read Time
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="5 min read"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Cover Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Excerpt (Short Summary)
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A compelling 1-2 sentence preview of the article..."
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Article Body Content (Markdown supported) *
                </label>
                <textarea
                  required
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write story paragraphs, use ## for headings, - for bullet lists..."
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Bridal, Trends, Silk, Eid"
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded bg-red-50 p-2.5 text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-md bg-black px-6 py-2 font-bold uppercase tracking-wider text-white hover:bg-gray-800"
                >
                  {formSubmitting ? "Publishing..." : editingBlog ? "Save Story" : "Publish Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
