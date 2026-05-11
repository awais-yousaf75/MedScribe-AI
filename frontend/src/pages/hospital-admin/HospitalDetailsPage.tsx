// src/pages/hospital-admin/HospitalDetailsPage.tsx
import { useEffect, useState } from "react";
import {
  Building2, Phone, MapPin, Lock, Save, RefreshCw,
  CheckCircle, AlertCircle, BadgeCheck, Hash,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/constants";

interface HospitalDetails {
  id: string; name: string; registration_number: string;
  license_number: string; hospital_type: string; address: string;
  contact_email: string; contact_phone: string;
  status: string; created_at: string;
}

function SectionCard({
  title, description, icon: Icon, children,
}: {
  title: string; description?: string;
  icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="sp-card-header">
        <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
          <Icon size={15} color="var(--ms-teal)" />
        </div>
        <div>
          <div className="card-title">{title}</div>
          {description && <div className="card-subtitle">{description}</div>}
        </div>
      </div>
      <div className="sp-card-body">{children}</div>
    </div>
  );
}

function LockedField({
  label, value, icon: Icon, tooltip,
}: {
  label: string; value: string;
  icon?: React.ElementType; tooltip?: string;
}) {
  return (
    <div className="field">
      <div className="sp-locked-label-row">
        <label className="field-label">{label}</label>
        <span className="sp-permanent-badge">
          <Lock size={9} /> Permanent
        </span>
      </div>
      <div className="field-input-wrap">
        {Icon && <Icon className="field-icon" size={15} />}
        <input
          readOnly
          value={value || "—"}
          title={tooltip}
          className={`field-input sp-locked-input${Icon ? " field-input-icon" : ""}`}
        />
      </div>
      {tooltip && <div className="field-error" style={{ color: "var(--ms-text-muted)" }}>{tooltip}</div>}
    </div>
  );
}

function SaveBar({
  dirty, saving, onDiscard, onSave,
}: {
  dirty: boolean; saving: boolean;
  onDiscard: () => void; onSave: () => void;
}) {
  return (
    <div className="sp-save-bar">
      <div className={`sp-save-status${dirty ? " sp-status-dirty" : " sp-status-clean"}`}>
        {dirty
          ? <><AlertCircle size={13} /> Unsaved changes</>
          : <><CheckCircle size={13} /> All saved</>
        }
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {dirty && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDiscard}>Discard</button>
        )}
        <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={saving || !dirty}>
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default function HospitalDetailsPage() {
  const token = localStorage.getItem("accessToken");
  const [hospital,  setHospital]  = useState<HospitalDetails>({
    id: "", name: "", registration_number: "", license_number: "",
    hospital_type: "", address: "", contact_email: "", contact_phone: "",
    status: "", created_at: "",
  });
  const [original, setOriginal] = useState<HospitalDetails | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const fetchHospital = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/hospital`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch hospital");
      const h: HospitalDetails = {
        id: data.hospital.id, name: data.hospital.name || "",
        registration_number: data.hospital.registration_number || "",
        license_number: data.hospital.license_number || "",
        hospital_type: data.hospital.hospital_type || "",
        address: data.hospital.address || "",
        contact_email: data.hospital.contact_email || "",
        contact_phone: data.hospital.contact_phone || "",
        status: data.hospital.status || "",
        created_at: data.hospital.created_at || "",
      };
      setHospital(h); setOriginal(h);
    } catch (e: any) { toast.error(e.message || "Failed to load hospital details"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHospital(); }, []);

  const dirty = original !== null && JSON.stringify(hospital) !== JSON.stringify(original);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/hospital-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ address: hospital.address || null, contact_email: hospital.contact_email || null, contact_phone: hospital.contact_phone || null, hospital_type: hospital.hospital_type || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setOriginal(hospital);
      toast.success("Hospital details updated");
    } catch (e: any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="page-main">
        <div className="do-loading-screen" style={{ minHeight: 240 }}>
          <RefreshCw size={28} className="animate-spin do-loading-icon" />
        </div>
      </div>
    );
  }

  if (!hospital.id) {
    return (
      <div className="page-main">
        <div className="page-content">
          <div className="empty-state card">
            <Building2 size={40} className="empty-icon" />
            <div className="empty-title">No Hospital Assigned</div>
            <div className="empty-sub">Contact Super Admin.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-main">
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Building2 size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Hospital Details</div>
              <div className="page-header-sub">Manage hospital contact and address</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="sp-section">
          <div className="sp-hospital-banner">
            <div className="icon-wrap icon-wrap-lg icon-wrap-teal" style={{ flexShrink: 0 }}>
              <Building2 size={24} color="#fff" />
            </div>
            <div className="sp-banner-info">
              <div className="sp-banner-name">{hospital.name}</div>
              <div className="sp-banner-email">
                {hospital.hospital_type ? hospital.hospital_type + " · " : ""}
                Registered {hospital.created_at
                  ? new Date(hospital.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                  : "—"}
              </div>
            </div>
            {dirty && (
              <div className="sp-banner-actions">
                <button type="button" className="sp-banner-discard" onClick={() => original && setHospital(original)}>Discard</button>
                <button type="button" className="sp-banner-save" onClick={handleSave} disabled={saving}>
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  Save
                </button>
              </div>
            )}
          </div>

          <SectionCard title="Permanent Details" description="Cannot be changed after registration" icon={Lock}>
            <div className="form-grid-2">
              <LockedField label="Hospital Name" value={hospital.name} icon={Building2} tooltip="Contact Super Admin for name change." />
              <LockedField label="Registration #" value={hospital.registration_number} icon={Hash} tooltip="Assigned by regulatory authority." />
              <LockedField label="License #" value={hospital.license_number || "Not provided"} icon={BadgeCheck} tooltip="Contact Super Admin if incorrect." />
            </div>
          </SectionCard>

          <SectionCard title="Contact Information" description="Public contact details" icon={Phone}>
            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">Contact Email</label>
                <input type="email" className="field-input" placeholder="contact@hospital.com"
                  value={hospital.contact_email}
                  onChange={(e) => setHospital((h) => ({ ...h, contact_email: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field-label">Contact Phone</label>
                <input className="field-input" placeholder="+92 XXX XXXXXXX"
                  value={hospital.contact_phone}
                  onChange={(e) => setHospital((h) => ({ ...h, contact_phone: e.target.value }))} />
              </div>
              <div className="field form-full">
                <label className="field-label">Hospital Type</label>
                <select className="field-select" value={hospital.hospital_type}
                  onChange={(e) => setHospital((h) => ({ ...h, hospital_type: e.target.value }))}>
                  <option value="">— Select —</option>
                  <option value="general">General Hospital</option>
                  <option value="specialty">Specialty Hospital</option>
                  <option value="teaching">Teaching Hospital</option>
                  <option value="clinic">Clinic / Polyclinic</option>
                  <option value="rehabilitation">Rehabilitation Center</option>
                  <option value="psychiatric">Psychiatric Hospital</option>
                  <option value="children">Children's Hospital</option>
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Physical Address" description="Hospital location" icon={MapPin}>
            <div className="field">
              <label className="field-label">Full Address</label>
              <textarea className="field-textarea" rows={3} placeholder="Street, Area, City, Province, Postal Code"
                value={hospital.address}
                onChange={(e) => setHospital((h) => ({ ...h, address: e.target.value }))} />
              <div className="field-error" style={{ color: "var(--ms-text-muted)" }}>
                Include complete address for patient visibility.
              </div>
            </div>
            <SaveBar dirty={dirty} saving={saving}
              onDiscard={() => original && setHospital(original)}
              onSave={handleSave} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}