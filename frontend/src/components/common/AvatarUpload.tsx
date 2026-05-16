// src/components/common/AvatarUpload.tsx
import { useRef, useState } from "react";
import { Camera, Loader2, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { API_URL, getToken } from "@/lib/constants";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  /** Called with new URL (or null on remove) */
  onChange?: (newUrl: string | null) => void;
  /** Display size: 'lg' for profile, 'md' for sidebar */
  size?: "lg" | "md";
}

export default function AvatarUpload({
  currentAvatarUrl,
  userName,
  onChange,
  size = "lg",
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("") || "U";

  // ── Upload handler ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setPreview(data.avatar_url);
      onChange?.(data.avatar_url);
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Remove handler ──
  const handleRemove = async () => {
    if (!preview) return;
    const confirmed = window.confirm("Remove profile picture?");
    if (!confirmed) return;

    const token = getToken();
    if (!token) return;

    try {
      setRemoving(true);
      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remove failed");

      setPreview(null);
      onChange?.(null);
      toast.success("Profile picture removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove");
    } finally {
      setRemoving(false);
    }
  };

  const sizeClass = size === "lg" ? "av-upload-lg" : "av-upload-md";

  return (
    <div className={`av-upload ${sizeClass}`}>
      <div className="av-upload-image-wrap">
        {preview ? (
          <img
            src={preview}
            alt={userName}
            className="av-upload-image"
            onError={() => setPreview(null)}
          />
        ) : (
          <div className="av-upload-initials">{initials}</div>
        )}

        {(uploading || removing) && (
          <div className="av-upload-overlay">
            <Loader2 size={size === "lg" ? 28 : 16} className="animate-spin" />
          </div>
        )}

        {/* Camera badge — only on large variant */}
        {size === "lg" && (
          <button
            type="button"
            className="av-upload-camera-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || removing}
            title="Change picture"
          >
            <Camera size={14} />
          </button>
        )}
      </div>

      {/* Action buttons — only for LG (profile page) */}
      {size === "lg" && (
        <div className="av-upload-actions">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || removing}
          >
            <Upload size={13} />
            {preview ? "Change Picture" : "Upload Picture"}
          </button>
          {preview && (
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleRemove}
              disabled={uploading || removing}
            >
              <Trash2 size={13} />
              Remove
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="av-upload-input"
        onChange={handleFileSelect}
      />

      {size === "lg" && (
        <div className="av-upload-hint">
          JPG, PNG or WEBP · Max 5MB
        </div>
      )}
    </div>
  );
}

/**
 * Display-only avatar component (for sidebars, headers, lists)
 * No upload functionality
 */
export function AvatarDisplay({
  url,
  name,
  size = 38,
}: {
  url?: string | null;
  name: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() || "")
      .join("") || "U";

  const showImage = url && !errored;

  return (
    <div
      className="av-display"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {showImage ? (
        <img
          src={url!}
          alt={name}
          className="av-display-image"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}