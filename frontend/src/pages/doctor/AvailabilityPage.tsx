// src/pages/doctor/AvailabilityPage.tsx
import { CalendarDays, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_URL, DAY_NAMES, DEFAULT_DAY, getToken } from "@/lib/constants";
import type { AvailabilityRecord, DayAvailability } from "@/types";

// ── Helper ────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const [availability,      setAvailability]      = useState<DayAvailability[]>(
    Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY })),
  );
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [savingAvailability,  setSavingAvailability]  = useState(false);

  const fetchAvailability = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingAvailability(true);
      const res  = await fetch(`${API_URL}/api/doctor/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load availability");
      const records = (data.availability || []) as AvailabilityRecord[];
      setAvailability((prev) =>
        prev.map((day, index) => {
          const record = records.find((r) => r.day_of_week === index);
          if (record) {
            return {
              enabled:              true,
              start_time:           record.start_time.substring(0, 5),
              end_time:             record.end_time.substring(0, 5),
              slot_duration_minutes: record.slot_duration_minutes,
            };
          }
          return { ...DEFAULT_DAY };
        }),
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleSaveAvailability = async () => {
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }

    const payload = availability
      .map((day, index) => ({
        day_of_week:           index,
        start_time:            day.start_time,
        end_time:              day.end_time,
        slot_duration_minutes: day.slot_duration_minutes,
        enabled:               day.enabled,
      }))
      .filter((d) => d.enabled);

    for (const day of payload) {
      if (day.start_time >= day.end_time) {
        toast.error(`${DAY_NAMES[day.day_of_week]}: Start time must be before end time`);
        return;
      }
    }

    try {
      setSavingAvailability(true);
      const res = await fetch(`${API_URL}/api/doctor/availability`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ availability: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save availability");
      toast.success("Availability saved successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingAvailability(false);
    }
  };

  const updateDay = (
    index: number,
    field: keyof DayAvailability,
    value: string | boolean | number,
  ) => {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day)),
    );
  };

  useEffect(() => {
    fetchAvailability();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <CalendarDays size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Availability</div>
              <div className="page-header-sub">Set your weekly working hours</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <CalendarDays size={18} color="#fff" />
              </div>
              <div>
                <div className="card-title">Weekly Availability</div>
                <div className="card-subtitle">
                  Set your working hours. Patients will see available slots based on this.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-icon"
              onClick={fetchAvailability}
              disabled={loadingAvailability}
            >
              <RefreshCw size={14} className={loadingAvailability ? "animate-spin" : ""} />
            </button>
          </div>

          {loadingAvailability ? (
            <div className="loading-text">Loading availability…</div>
          ) : (
            <>
              <div className="avail-list">
                {DAY_NAMES.map((dayName, index) => {
                  const day = availability[index];
                  return (
                    <div
                      key={dayName}
                      className={`avail-row${day.enabled ? " avail-enabled" : ""}`}
                    >
                      <div className="avail-day-wrap">
                        <button
                          type="button"
                          className={`toggle${day.enabled ? " toggle-on" : ""}`}
                          onClick={() => updateDay(index, "enabled", !day.enabled)}
                        >
                          <span className="toggle-thumb" />
                        </button>
                        <span className={`avail-day-name${day.enabled ? " avail-active" : ""}`}>
                          {dayName}
                        </span>
                      </div>

                      {day.enabled ? (
                        <>
                          <div className="avail-time-wrap">
                            <span className="avail-time-label">From</span>
                            <input
                              type="time"
                              className="avail-time-input"
                              value={day.start_time}
                              onChange={(e) => updateDay(index, "start_time", e.target.value)}
                            />
                          </div>
                          <div className="avail-time-wrap">
                            <span className="avail-time-label">To</span>
                            <input
                              type="time"
                              className="avail-time-input"
                              value={day.end_time}
                              onChange={(e) => updateDay(index, "end_time", e.target.value)}
                            />
                          </div>
                          <div className="avail-time-wrap">
                            <span className="avail-time-label">Slot</span>
                            <select
                              className="avail-slot-select"
                              value={day.slot_duration_minutes}
                              onChange={(e) =>
                                updateDay(index, "slot_duration_minutes", Number(e.target.value))
                              }
                            >
                              {[10, 15, 20, 30, 45, 60].map((m) => (
                                <option key={m} value={m}>{m} min</option>
                              ))}
                            </select>
                          </div>
                          {day.start_time && day.end_time && day.start_time < day.end_time && (
                            <span className="avail-slot-chip">
                              {Math.floor(
                                (timeToMinutes(day.end_time) - timeToMinutes(day.start_time)) /
                                  day.slot_duration_minutes,
                              )}{" "}
                              slots
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="avail-off">Not available</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="avail-footer">
                <button
                  type="button"
                  className="btn btn-primary btn-md"
                  onClick={handleSaveAvailability}
                  disabled={savingAvailability}
                >
                  <Save size={16} />
                  {savingAvailability ? "Saving…" : "Save Availability"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}