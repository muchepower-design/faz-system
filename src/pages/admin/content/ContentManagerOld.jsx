// frontend/src/pages/admin/content/ContentManager.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { adminContentAPI } from '../../../api';
import { Card, Button, Input, Modal, ModalFooter, Spinner, EmptyState } from '../../../components/ui';
import ImageInput from '../../../components/ImageInput';
import { resolveAssetUrl } from '../../../utils/assets';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function ContentManager() {
  const [tab, setTab] = useState('hero');
  const tabs = [
    { id: 'hero', label: 'Hero Slides' },
    { id: 'partners', label: 'Partners' },
    { id: 'governance', label: 'Governance' },
    { id: 'pages', label: 'Pages' },
  ];

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Content Manager</h1>
        <p className="text-gray-500">
          Manage hero slides, partners, governance, and page content across the site.
        </p>
      </div>

      <div className="flex border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium transition ${
              tab === t.id
                ? 'text-faz-orange border-b-2 border-faz-orange'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && <HeroSlidesTab />}
      {tab === 'partners' && <PartnersTab />}
      {tab === 'governance' && <GovernanceTab />}
      {tab === 'pages' && <PagesTab />}
    </div>
  );
}

/* =========================================================
 * HERO SLIDES
 * ========================================================= */
function HeroSlidesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyHero());
  const [submitting, setSubmitting] = useState(false);

  function emptyHero() {
    return { title: '', subtitle: '', image_url: '', cta_text: '', cta_link: '', slide_order: 0, is_active: true };
  }

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminContentAPI.listHero();
      setItems(res.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyHero()); setShowForm(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await adminContentAPI.updateHero(editing.id, form);
        toast.success('Slide updated');
      } else {
        await adminContentAPI.createHero(form);
        toast.success('Slide created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSubmitting(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this slide?')) return;
    try {
      await adminContentAPI.deleteHero(id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  return (
    <Card padding="lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-gray-800">Hero Slides ({items.length})</h2>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Slide</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🖼️" title="No slides" description="Add your first hero slide." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="h-40 bg-gray-100">
                <img
                  src={resolveAssetUrl(s.image_url)}
                  alt={s.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                />
              </div>
              <div className="p-3">
                <p className="font-semibold text-gray-800">{s.title}</p>
                <p className="text-xs text-gray-500">{s.subtitle}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className={s.is_active ? 'text-green-600' : 'text-gray-400'}>
                    {s.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <span className="text-gray-400">• order {s.slide_order}</span>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Slide' : 'New Slide'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />

          <ImageInput
            label="Hero Image"
            category="hero"
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="CTA Text" value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} />
            <Input label="CTA Link" value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="Order" value={form.slide_order} onChange={(e) => setForm({ ...form, slide_order: parseInt(e.target.value) || 0 })} />
            <label className="flex items-center gap-2 mt-6 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
          </div>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Card>
  );
}

/* =========================================================
 * PARTNERS
 * ========================================================= */
function PartnersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPartner());
  const [submitting, setSubmitting] = useState(false);

  function emptyPartner() {
    return { name: '', logo_url: '', website_url: '', tier: '', partner_order: 0, is_active: true };
  }

  const load = async () => {
    setLoading(true);
    try { setItems((await adminContentAPI.listPartners()).data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyPartner()); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) { await adminContentAPI.updatePartner(editing.id, form); toast.success('Updated'); }
      else { await adminContentAPI.createPartner(form); toast.success('Created'); }
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSubmitting(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this partner?')) return;
    try { await adminContentAPI.deletePartner(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  return (
    <Card padding="lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-gray-800">Partners ({items.length})</h2>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Partner</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🤝" title="No partners" description="Add partner logos to display on the home page." />
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-xl p-3 text-center">
              <div className="h-24 flex items-center justify-center bg-gray-50 rounded-lg mb-3">
                <img
                  src={resolveAssetUrl(p.logo_url)}
                  alt={p.name}
                  className="max-h-20 object-contain"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                />
              </div>
              <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
              {p.tier && <p className="text-xs text-gray-500 capitalize">{p.tier}</p>}
              <div className="flex justify-center gap-2 mt-3">
                <button onClick={() => openEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Partner' : 'New Partner'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

          <ImageInput
            label="Partner Logo"
            category="partners"
            value={form.logo_url}
            onChange={(url) => setForm({ ...form, logo_url: url })}
            required
            hint="Transparent PNG or SVG works best. Landscape logos display cleanly."
          />

          <Input label="Website" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} placeholder="platinum, gold, silver" />
            <Input type="number" label="Order" value={form.partner_order} onChange={(e) => setForm({ ...form, partner_order: parseInt(e.target.value) || 0 })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Card>
  );
}

/* =========================================================
 * GOVERNANCE MEMBERS
 * ========================================================= */
function GovernanceTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyMember());
  const [submitting, setSubmitting] = useState(false);

  function emptyMember() {
    return {
      name: '', position: '', category: 'national', province: '', image_url: '',
      bio: '', email: '', term_start: '', term_end: '', member_order: 0, is_active: true,
    };
  }

  const load = async () => {
    setLoading(true);
    try { setItems((await adminContentAPI.listMembers()).data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyMember()); setShowForm(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...m }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) { await adminContentAPI.updateMember(editing.id, form); toast.success('Updated'); }
      else { await adminContentAPI.createMember(form); toast.success('Created'); }
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSubmitting(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this member?')) return;
    try { await adminContentAPI.deleteMember(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  const national = items.filter((m) => m.category === 'national');
  const provincial = items.filter((m) => m.category === 'provincial');

  return (
    <Card padding="lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-gray-800">
          Governance Members ({national.length} national, {provincial.length} provincial)
        </h2>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Member</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="⚖️" title="No members" description="Add national officers and provincial representatives." />
      ) : (
        <div className="space-y-6">
          {[{ label: 'National Executive Committee', list: national },
            { label: 'Provincial Representatives', list: provincial }].map((section) => (
            section.list.length > 0 && (
              <div key={section.label}>
                <h3 className="font-semibold text-gray-700 mb-3">{section.label}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {section.list.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {m.image_url ? (
                          <img
                            src={resolveAssetUrl(m.image_url)}
                            alt={m.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {m.position}{m.province ? ` • ${m.province}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => openEdit(m)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(m.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Member' : 'New Member'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="national">National</option>
                <option value="provincial">Provincial</option>
              </select>
            </div>
            {form.category === 'provincial' && (
              <Input label="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
            )}
          </div>

          <ImageInput
            label="Portrait"
            category="governance"
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            hint="Square or portrait orientation works best (e.g. 400×400)."
          />

          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio / Notes (line breaks and lists preserved)
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder={"Line breaks are preserved.\n- Bullet items work\n- Just like this\n1. Or numbered lists\n2. Like this"}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Term Start" value={form.term_start} onChange={(e) => setForm({ ...form, term_start: e.target.value })} placeholder="2025" />
            <Input label="Term End" value={form.term_end} onChange={(e) => setForm({ ...form, term_end: e.target.value })} placeholder="2029" />
            <Input type="number" label="Order" value={form.member_order} onChange={(e) => setForm({ ...form, member_order: parseInt(e.target.value) || 0 })} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Card>
  );
}

/* =========================================================
 * PAGES
 * ========================================================= */
function PagesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPage());
  const [submitting, setSubmitting] = useState(false);

  function emptyPage() {
    return {
      path: '', title: '', subtitle: '', excerpt: '', content: '',
      hero_image_url: '', category: 'about', meta_title: '', meta_description: '',
      is_published: true, page_order: 0,
    };
  }

  const load = async () => {
    setLoading(true);
    try { setItems((await adminContentAPI.listPages()).data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyPage()); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) { await adminContentAPI.updatePage(editing.id, form); toast.success('Updated'); }
      else { await adminContentAPI.createPage(form); toast.success('Created'); }
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSubmitting(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this page?')) return;
    try { await adminContentAPI.deletePage(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  return (
    <Card padding="lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-gray-800">Pages ({items.length})</h2>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Page</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No pages"
          description="Create content for any placeholder route on the site."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-gray-700">Path</th>
                <th className="px-3 py-2 text-left text-gray-700">Title</th>
                <th className="px-3 py-2 text-left text-gray-700">Category</th>
                <th className="px-3 py-2 text-left text-gray-700">Status</th>
                <th className="px-3 py-2 text-right text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">/{p.path}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{p.title}</td>
                  <td className="px-3 py-2 text-gray-500">{p.category || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => openEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Page' : 'New Page'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Path (e.g. about/history, documents/faq)"
              value={form.path}
              onChange={(e) => setForm({ ...form, path: e.target.value })}
              required
            />
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="about, documents, media, development" />
          </div>

          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <Input label="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />

          <ImageInput
            label="Hero Image"
            category="pages"
            value={form.hero_image_url}
            onChange={(url) => setForm({ ...form, hero_image_url: url })}
            hint="Wide landscape image (e.g. 1600×600) works best for the page banner."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content (line breaks and lists are preserved exactly as typed)
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={14}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono leading-relaxed"
              placeholder={"Write your content here.\n\nLeave blank lines for new paragraphs.\n\n- Start a line with a dash for a bullet\n- Another bullet\n\n1. Or use numbers\n2. For an ordered list"}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: use <code>- item</code> for bullets, <code>1. item</code> for numbered lists, blank lines for paragraphs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Meta Title (SEO)" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
            <Input type="number" label="Order" value={form.page_order} onChange={(e) => setForm({ ...form, page_order: parseInt(e.target.value) || 0 })} />
          </div>
          <Input label="Meta Description (SEO)" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Published
          </label>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Card>
  );
}