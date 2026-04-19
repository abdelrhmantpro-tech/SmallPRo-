import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Card, SectionTitle, Badge, Modal } from '../components/UI';
import { useApp } from '../context/AppContext';

const stages = ['New Lead', 'Interested', 'Opportunity', 'Won', 'Lost'];
const blankLead = { name: '', email: '', phone: '', company: '', address: '', value: 0, tags: '' };
const blankInteraction = { type: 'Call', description: '' };

export default function CRMPage() {
  const { scoped, addCustomer, updateCustomer, updateCustomerStage, addInteraction } = useApp();
  const [draggedId, setDraggedId] = useState(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [leadForm, setLeadForm] = useState(blankLead);
  const [interactionForm, setInteractionForm] = useState(blankInteraction);
  const [selectedLead, setSelectedLead] = useState(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.customers.filter((customer) => {
      const matchesText = !q || [customer.id, customer.name, customer.company, customer.email, customer.phone, customer.stage].filter(Boolean).join(' ').toLowerCase().includes(q);
      const matchesStage = stageFilter === 'All' || customer.stage === stageFilter;
      return matchesText && matchesStage;
    });
  }, [scoped.customers, search, stageFilter]);

  const selectedInteractions = useMemo(
    () => scoped.interactions.filter((item) => item.customerId === selectedLead?.id),
    [scoped.interactions, selectedLead],
  );

  const openLead = (lead) => {
    setSelectedLead({ ...lead, tags: Array.isArray(lead.tags) ? lead.tags.join(', ') : lead.tags || '' });
    setDetailOpen(true);
  };

  const createLead = () => {
    addCustomer({ ...leadForm, tags: leadForm.tags ? leadForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [] });
    setLeadForm(blankLead);
    setLeadOpen(false);
  };

  const saveLead = () => {
    if (!selectedLead) return;
    updateCustomer(selectedLead.id, { ...selectedLead, tags: typeof selectedLead.tags === 'string' ? selectedLead.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : selectedLead.tags });
    setDetailOpen(false);
  };

  const saveInteraction = () => {
    if (!selectedLead) return;
    addInteraction({ customerId: selectedLead.id, userId: 3, ...interactionForm });
    setInteractionForm(blankInteraction);
    setInteractionOpen(false);
  };

  return (
    <Layout title="CRM" actions={<button className="btn primary" onClick={() => setLeadOpen(true)}>Add new lead</button>}>
      <Card className="large-card full-width-card">
        <SectionTitle title="Lead flow" subtitle="Search leads by ID, name, company, email, phone, or stage. Then drag and drop across the exact stages." />
        <div className="module-filters">
          <label className="filter-field">Lead search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by lead ID, name, company, email, phone..." /></label>
          <label className="filter-field">Stage<select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}><option>All</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
        </div>
        <div className="kanban wide-kanban full-bleed-kanban">
          {stages.map((stage) => {
            const stageItems = filteredCustomers.filter((item) => item.stage === stage);
            return (
              <div
                className="kanban-col"
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedId) updateCustomerStage(draggedId, stage);
                  setDraggedId(null);
                }}
              >
                <div className="row spread"><h4>{stage}</h4><Badge>{stageItems.length}</Badge></div>
                {stageItems.map((customer) => (
                  <div className="kanban-card" key={customer.id} draggable onDragStart={() => setDraggedId(customer.id)} onClick={() => openLead(customer)}>
                    <div className="row spread"><strong>{customer.name}</strong><Badge>{customer.id}</Badge></div>
                    <p>{customer.company}</p>
                    <small>{customer.phone}</small>
                    <div className="row spread"><small>Potential</small><strong>{Number(customer.value || 0).toLocaleString()} EGP</strong></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid two mt24 balanced-grid">
        <Card>
          <SectionTitle title="CRM summary" subtitle="Quick counts for presentation" />
          <div className="grid two balanced-grid compact-metrics">
            {stages.map((stage) => (
              <div className="mini-summary" key={stage}>
                <small>{stage}</small>
                <strong>{filteredCustomers.filter((item) => item.stage === stage).length}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="Recent customer interactions" subtitle="Calls, meetings, WhatsApp and notes" />
          <div className="stack">
            {scoped.interactions.slice(0, 6).map((item) => (
              <div key={item.id} className="list-item emphasis-item">
                <div>
                  <strong>{scoped.customers.find((customer) => customer.id === item.customerId)?.name}</strong>
                  <p>{item.description}</p>
                </div>
                <div className="right-meta"><Badge>{item.type}</Badge></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={leadOpen} onClose={() => setLeadOpen(false)} title="Add new lead" subtitle="Every create action opens as a popup for a cleaner experience." footer={<button className="btn primary" onClick={createLead}>Create lead</button>}>
        <div className="grid two balanced-grid">
          <label>Name<input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} /></label>
          <label>Email<input value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} /></label>
          <label>Phone<input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} /></label>
          <label>Company<input value={leadForm.company} onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })} /></label>
          <label>Potential value<input type="number" value={leadForm.value} onChange={(e) => setLeadForm({ ...leadForm, value: e.target.value })} /></label>
          <label>Tags<input value={leadForm.tags} onChange={(e) => setLeadForm({ ...leadForm, tags: e.target.value })} placeholder="Retail, VIP" /></label>
          <label className="span-2">Address<input value={leadForm.address} onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })} /></label>
        </div>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={selectedLead?.name || 'Lead details'} subtitle="Review full lead profile, edit details, or log a new interaction." footer={<div className="row gap"><button className="btn ghost" onClick={() => setInteractionOpen(true)}>Add interaction</button><button className="btn primary" onClick={saveLead}>Save changes</button></div>}>
        {selectedLead ? (
          <div className="stack">
            <div className="grid two balanced-grid">
              <label>Name<input value={selectedLead.name} onChange={(e) => setSelectedLead({ ...selectedLead, name: e.target.value })} /></label>
              <label>Email<input value={selectedLead.email} onChange={(e) => setSelectedLead({ ...selectedLead, email: e.target.value })} /></label>
              <label>Phone<input value={selectedLead.phone} onChange={(e) => setSelectedLead({ ...selectedLead, phone: e.target.value })} /></label>
              <label>Company<input value={selectedLead.company} onChange={(e) => setSelectedLead({ ...selectedLead, company: e.target.value })} /></label>
              <label>Stage<select value={selectedLead.stage} onChange={(e) => setSelectedLead({ ...selectedLead, stage: e.target.value })}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
              <label>Potential value<input type="number" value={selectedLead.value || 0} onChange={(e) => setSelectedLead({ ...selectedLead, value: e.target.value })} /></label>
              <label className="span-2">Tags<input value={selectedLead.tags || ''} onChange={(e) => setSelectedLead({ ...selectedLead, tags: e.target.value })} /></label>
              <label className="span-2">Address<input value={selectedLead.address || ''} onChange={(e) => setSelectedLead({ ...selectedLead, address: e.target.value })} /></label>
            </div>
            <div className="inline-panel">
              <div className="section-title"><div><h3>Interaction history</h3><p>All recent communication for this lead</p></div></div>
              <div className="stack">
                {selectedInteractions.length ? selectedInteractions.map((item) => (
                  <div key={item.id} className="list-item emphasis-item">
                    <div><strong>{item.type}</strong><p>{item.description}</p></div>
                    <div className="right-meta"><small>{item.interactionDate}</small></div>
                  </div>
                )) : <div className="empty">No interactions yet for this lead.</div>}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={interactionOpen} onClose={() => setInteractionOpen(false)} title="Add interaction" subtitle={selectedLead ? `Log communication for ${selectedLead.name}` : ''} footer={<button className="btn primary" onClick={saveInteraction}>Save interaction</button>}>
        <div className="stack">
          <label>Type<select value={interactionForm.type} onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}><option>Call</option><option>Email</option><option>Note</option><option>WhatsApp</option><option>Meeting</option></select></label>
          <label>Description<textarea rows="5" value={interactionForm.description} onChange={(e) => setInteractionForm({ ...interactionForm, description: e.target.value })} /></label>
        </div>
      </Modal>
    </Layout>
  );
}
