import { Check, X } from "lucide-react";

/**
 * Kriteria wajib untuk password: minimal 8 karakter, huruf besar,
 * huruf kecil, dan angka. Simbol tidak wajib.
 */
export function getPasswordChecks(password) {
    return [
        { key: "length", label: "Minimal 8 karakter", met: password.length >= 8 },
        { key: "upper", label: "Huruf besar (A-Z)", met: /[A-Z]/.test(password) },
        { key: "lower", label: "Huruf kecil (a-z)", met: /[a-z]/.test(password) },
        { key: "number", label: "Angka (0-9)", met: /\d/.test(password) },
    ];
}

export function isPasswordValid(password) {
    return getPasswordChecks(password).every((c) => c.met);
}

const LEVELS = {
    empty: { label: "", color: "var(--dv-rule-2)", width: "0%" },
    weak: { label: "Lemah", color: "var(--dv-danger)", width: "33%" },
    medium: { label: "Cukup", color: "var(--dv-warning)", width: "66%" },
    strong: { label: "Kuat", color: "var(--dv-ok)", width: "100%" },
};

function getLevel(password, metCount) {
    if (!password) return LEVELS.empty;
    if (metCount <= 1) return LEVELS.weak;
    if (metCount <= 3) return LEVELS.medium;
    return LEVELS.strong;
}

/**
 * Indikator kekuatan password: bar warna merah/kuning/hijau +
 * checklist kriteria wajib. Dipakai di halaman registrasi.
 */
export default function PasswordStrengthMeter({ password }) {
    const checks = getPasswordChecks(password);
    const metCount = checks.filter((c) => c.met).length;
    const level = getLevel(password, metCount);

    return (
        <div className="space-y-2.5">
            <div className="space-y-1">
                <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--dv-paper-3)" }}
                    role="progressbar"
                    aria-valuenow={metCount}
                    aria-valuemin={0}
                    aria-valuemax={checks.length}
                    aria-label="Kekuatan password"
                >
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: level.width,
                            background: level.color,
                        }}
                    />
                </div>
                {password && (
                    <p
                        className="text-[0.75rem] font-medium"
                        style={{ color: level.color }}
                    >
                        Kekuatan password: {level.label}
                    </p>
                )}
            </div>

            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {checks.map((check) => (
                    <li
                        key={check.key}
                        className="flex items-center gap-1.5 text-[0.75rem]"
                        style={{
                            color: check.met
                                ? "var(--dv-ok)"
                                : "var(--dv-muted)",
                        }}
                    >
                        {check.met ? (
                            <Check size={13} strokeWidth={2.5} className="shrink-0" />
                        ) : (
                            <X size={13} strokeWidth={2.5} className="shrink-0" />
                        )}
                        <span>{check.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
