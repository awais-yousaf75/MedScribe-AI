import { UserCog, Stethoscope, Building2 } from "lucide-react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import type { AssistantMeResponse } from "../../components/AssistantDashboard";

interface Props {
  assistantInfo: AssistantMeResponse | null;
}

const getStatusBadge = (status?: string | null) => {
  if (!status) return <span className="list-item-sub">—</span>;
  const map: Record<string, { cls: string; icon: typeof CheckCircle }> = {
    approved: { cls: "badge badge-success", icon: CheckCircle },
    pending:  { cls: "badge badge-warning", icon: Clock       },
    rejected: { cls: "badge badge-error",   icon: XCircle     },
  };
  const { cls, icon: Icon } = map[status] || map.pending;
  return (
    <span className={cls}>
      <Icon size={11} /> {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export function AssistantProfileCard({ assistantInfo }: Props) {
  const doctor   = assistantInfo?.doctor;
  const hospital = assistantInfo?.hospital;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="icon-wrap icon-wrap-md icon-wrap-teal">
            <UserCog size={18} color="#fff" />
          </div>
          <div>
            <div className="card-title">
              {assistantInfo?.profile.full_name || "Assistant"}
            </div>
            <div className="card-subtitle">Doctor Assistant</div>
          </div>
        </div>
        {getStatusBadge(assistantInfo?.profile.approval_status)}
      </div>

      <div className="list-grid-2">
        {/* Doctor */}
        <div className="info-item">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Stethoscope size={14} color="var(--ms-teal)" />
            <div className="info-label" style={{ marginBottom: 0 }}>Assigned Doctor</div>
          </div>
          {doctor ? (
            <>
              <div className="list-item-title">{doctor.full_name}</div>
              <div className="list-item-sub">{doctor.phone || "No phone"}</div>
            </>
          ) : (
            <div className="list-item-sub">No doctor assigned</div>
          )}
        </div>

        {/* Hospital */}
        <div className="info-item">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Building2 size={14} color="var(--ms-teal)" />
            <div className="info-label" style={{ marginBottom: 0 }}>Hospital</div>
          </div>
          {hospital ? (
            <>
              <div className="list-item-title">{hospital.name}</div>
              <div className="list-item-sub">{hospital.address || "No address"}</div>
            </>
          ) : (
            <div className="list-item-sub">No hospital linked</div>
          )}
        </div>
      </div>
    </div>
  );
}