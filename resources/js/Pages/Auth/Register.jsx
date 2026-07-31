import { useMemo, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Check,
    Eye,
    EyeOff,
    Sparkles,
} from "lucide-react";

/**
 * Halaman registrasi mandiri (self-service), 3 langkah:
 *   1. Data akun (nama, email, password)
 *   2. Jenis usaha + template bisnis (kategori/produk contoh, opsional)
 *   3. Plan (dengan badge trial bila plan punya trial_days)
 *
 * Palet & bahasa visualnya PATEN mengikuti Login.jsx (tema `.dv-auth`,
 * bukan theme engine user) — jangan pakai utility yang terikat tema di
 * file ini, pakai kelas `dv-*` atau nilai eksplisit.
 */

const STEPS = [
    { key: "account", label: "Akun" },
    { key: "business", label: "Jenis usaha" },
    { key: "plan", label: "Plan" },
];

export default function Register({ storeTypes = [], plans = [] }) {
    const [step, setStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);
    const [activeStoreTypeId, setActiveStoreTypeId] = useState(
        storeTypes[0]?.id ?? null,
    );

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        store_type_id: storeTypes[0]?.id ?? "",
        business_template_code: "",
        plan_id: "",
    });

    const activeStoreType = useMemo(
        () => storeTypes.find((t) => t.id === activeStoreTypeId) ?? null,
        [storeTypes, activeStoreTypeId],
    );

    const canContinueFromAccount =
        data.name.trim() &&
        data.email.trim() &&
        data.password &&
        data.password_confirmation;

    const canContinueFromBusiness = !!data.store_type_id;

    const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
    const goBack = () => setStep((s) => Math.max(s - 1, 0));

    const selectStoreType = (type) => {
        setActiveStoreTypeId(type.id);
        setData("store_type_id", type.id);
        setData("business_template_code", "");
    };

    const selectTemplate = (code) => {
        setData("business_template_code", code === data.business_template_code ? "" : code);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Daftar" />

            <div className="dv-auth grid min-h-screen lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.35fr_1fr]">
                {/* ── Band gelap ── */}
                <div className="dv-band hidden flex-col justify-between p-10 xl:p-14 lg:flex">
                    <a
                        href="https://devus.id"
                        className="dv-wordmark text-[1.375rem]"
                        aria-label="DEVus.id, beranda"
                    >
                        DEVus<span className="dv-wordmark__dot">.</span>id
                    </a>

                    <div className="max-w-xl space-y-6 py-10">
                        <p className="dv-flag">
                            <Check size={13} strokeWidth={2.5} />
                            Gratis untuk 1 kasir, selamanya
                        </p>

                        <h1 className="dv-display">
                            Toko baru,
                            <br />
                            siap jualan dalam 3 langkah.
                        </h1>

                        <p className="dv-lead">
                            Pilih jenis usahamu, kami siapkan kategori dan
                            produk contoh secara otomatis. Kamu bisa ubah
                            semuanya nanti dari dashboard.
                        </p>
                    </div>

                    <p className="dv-label">
                        &copy; {year} DEVus.id — Seluruh hak dilindungi
                    </p>
                </div>

                {/* ── Panel form ── */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
                    <div className="mx-auto w-full max-w-[30rem]">
                        <a
                            href="https://devus.id"
                            className="dv-wordmark mb-8 text-[1.375rem] lg:hidden"
                            aria-label="DEVus.id, beranda"
                        >
                            DEVus<span className="dv-wordmark__dot">.</span>id
                        </a>

                        {/* Step indicator */}
                        <ol className="mb-6 flex items-center gap-2">
                            {STEPS.map((s, index) => (
                                <li
                                    key={s.key}
                                    className="flex flex-1 items-center gap-2"
                                >
                                    <span
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold"
                                        style={{
                                            background:
                                                index <= step
                                                    ? "var(--dv-accent)"
                                                    : "var(--dv-paper-3)",
                                            color:
                                                index <= step
                                                    ? "var(--dv-accent-ink)"
                                                    : "var(--dv-muted)",
                                        }}
                                    >
                                        {index < step ? (
                                            <Check size={12} strokeWidth={3} />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    <span
                                        className="text-[0.8125rem] font-medium"
                                        style={{
                                            color:
                                                index <= step
                                                    ? "var(--dv-ink)"
                                                    : "var(--dv-muted)",
                                        }}
                                    >
                                        {s.label}
                                    </span>
                                    {index < STEPS.length - 1 && (
                                        <span
                                            className="h-px flex-1"
                                            style={{
                                                background: "var(--dv-rule)",
                                            }}
                                        />
                                    )}
                                </li>
                            ))}
                        </ol>

                        <form onSubmit={submit}>
                            <div className="dv-card p-7 sm:p-8">
                                {step === 0 && (
                                    <AccountStep
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                        showPassword={showPassword}
                                        setShowPassword={setShowPassword}
                                        showPasswordConfirmation={
                                            showPasswordConfirmation
                                        }
                                        setShowPasswordConfirmation={
                                            setShowPasswordConfirmation
                                        }
                                    />
                                )}

                                {step === 1 && (
                                    <BusinessStep
                                        storeTypes={storeTypes}
                                        activeStoreType={activeStoreType}
                                        selectedTemplateCode={
                                            data.business_template_code
                                        }
                                        onSelectStoreType={selectStoreType}
                                        onSelectTemplate={selectTemplate}
                                        error={errors.store_type_id}
                                    />
                                )}

                                {step === 2 && (
                                    <PlanStep
                                        plans={plans}
                                        selectedPlanId={data.plan_id}
                                        onSelect={(id) =>
                                            setData("plan_id", id)
                                        }
                                        error={errors.plan_id}
                                    />
                                )}
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-3">
                                {step > 0 ? (
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="dv-btn"
                                        style={{
                                            color: "var(--dv-ink)",
                                            background: "var(--dv-paper)",
                                            borderColor: "var(--dv-rule-2)",
                                        }}
                                    >
                                        <ArrowLeft
                                            size={16}
                                            strokeWidth={2.5}
                                        />
                                        Kembali
                                    </button>
                                ) : (
                                    <Link href={route("login")} className="dv-tlink">
                                        Sudah punya akun? Masuk
                                    </Link>
                                )}

                                {step < STEPS.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        disabled={
                                            (step === 0 &&
                                                !canContinueFromAccount) ||
                                            (step === 1 &&
                                                !canContinueFromBusiness)
                                        }
                                        className="dv-btn dv-btn--accent"
                                    >
                                        Lanjut
                                        <ArrowRight
                                            size={16}
                                            strokeWidth={2.5}
                                        />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={processing || !data.plan_id}
                                        className="dv-btn dv-btn--accent"
                                    >
                                        {processing
                                            ? "Membuat toko…"
                                            : "Buat toko"}
                                        {!processing && (
                                            <ArrowRight
                                                size={16}
                                                strokeWidth={2.5}
                                            />
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>

                        <p className="dv-label mt-10 lg:hidden">
                            &copy; {year} DEVus.id
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

function FieldError({ id, message }) {
    if (!message) return null;
    return (
        <p id={id} className="dv-error">
            <AlertTriangle size={13} strokeWidth={2.5} className="mt-0.5 shrink-0" />
            <span>{message}</span>
        </p>
    );
}

function AccountStep({
    data,
    setData,
    errors,
    showPassword,
    setShowPassword,
    showPasswordConfirmation,
    setShowPasswordConfirmation,
}) {
    return (
        <div>
            <p className="dv-label">Langkah 1 dari 3</p>
            <h2 className="dv-title mt-3">Buat akunmu</h2>
            <p
                className="mt-2 text-[0.9375rem] leading-relaxed"
                style={{ color: "var(--dv-muted)" }}
            >
                Ini akun yang akan jadi pemilik (owner) toko barumu.
            </p>

            <div className="mt-7 space-y-5">
                <div className="space-y-1.5">
                    <label htmlFor="name" className="dv-field-label">
                        Nama
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        autoComplete="name"
                        autoFocus
                        aria-invalid={errors.name ? "true" : undefined}
                        aria-describedby={errors.name ? "name-error" : undefined}
                        onChange={(e) => setData("name", e.target.value)}
                        className="dv-input"
                        placeholder="Nama lengkap"
                    />
                    <FieldError id="name-error" message={errors.name} />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="email" className="dv-field-label">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        autoComplete="username"
                        aria-invalid={errors.email ? "true" : undefined}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        onChange={(e) => setData("email", e.target.value)}
                        className="dv-input"
                        placeholder="nama@email.com"
                    />
                    <FieldError id="email-error" message={errors.email} />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="password" className="dv-field-label">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={data.password}
                            autoComplete="new-password"
                            aria-invalid={errors.password ? "true" : undefined}
                            aria-describedby={
                                errors.password ? "password-error" : undefined
                            }
                            onChange={(e) => setData("password", e.target.value)}
                            className="dv-input dv-input--action"
                            placeholder="Minimal 8 karakter"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="dv-input-action"
                            aria-label={
                                showPassword
                                    ? "Sembunyikan password"
                                    : "Tampilkan password"
                            }
                            aria-pressed={showPassword}
                        >
                            {showPassword ? (
                                <EyeOff size={16} />
                            ) : (
                                <Eye size={16} />
                            )}
                        </button>
                    </div>
                    <FieldError id="password-error" message={errors.password} />
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="password_confirmation"
                        className="dv-field-label"
                    >
                        Konfirmasi password
                    </label>
                    <div className="relative">
                        <input
                            id="password_confirmation"
                            type={
                                showPasswordConfirmation ? "text" : "password"
                            }
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData(
                                    "password_confirmation",
                                    e.target.value,
                                )
                            }
                            className="dv-input dv-input--action"
                            placeholder="Ulangi password"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPasswordConfirmation((v) => !v)
                            }
                            className="dv-input-action"
                            aria-label={
                                showPasswordConfirmation
                                    ? "Sembunyikan password"
                                    : "Tampilkan password"
                            }
                            aria-pressed={showPasswordConfirmation}
                        >
                            {showPasswordConfirmation ? (
                                <EyeOff size={16} />
                            ) : (
                                <Eye size={16} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BusinessStep({
    storeTypes,
    activeStoreType,
    selectedTemplateCode,
    onSelectStoreType,
    onSelectTemplate,
    error,
}) {
    return (
        <div>
            <p className="dv-label">Langkah 2 dari 3</p>
            <h2 className="dv-title mt-3">Jenis usahamu apa?</h2>
            <p
                className="mt-2 text-[0.9375rem] leading-relaxed"
                style={{ color: "var(--dv-muted)" }}
            >
                Tampilan dan fitur toko menyesuaikan pilihanmu.
            </p>

            <FieldError message={error} />

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {storeTypes.map((type) => {
                    const isActive = activeStoreType?.id === type.id;
                    return (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => onSelectStoreType(type)}
                            className={`dv-option flex-col items-start gap-1 ${isActive ? "dv-option--active" : ""}`}
                        >
                            <span className="text-lg" aria-hidden="true">
                                {type.icon}
                            </span>
                            <span className="dv-option__name">
                                {type.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {activeStoreType && (
                <div className="mt-6">
                    <p className="dv-field-label mb-2">
                        Template bisnis (opsional)
                    </p>
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => onSelectTemplate("")}
                            className={`dv-option ${!selectedTemplateCode ? "dv-option--active" : ""}`}
                        >
                            <span className="dv-option__icon">
                                <Sparkles size={16} strokeWidth={2} />
                            </span>
                            <span className="dv-option__body">
                                <span className="dv-option__name">
                                    Mulai kosong
                                </span>
                                <span className="dv-option__meta">
                                    Tanpa kategori & produk contoh
                                </span>
                            </span>
                        </button>

                        {activeStoreType.business_templates.map((tpl) => {
                            const isActive =
                                selectedTemplateCode === tpl.code;
                            return (
                                <button
                                    key={tpl.code}
                                    type="button"
                                    onClick={() => onSelectTemplate(tpl.code)}
                                    className={`dv-option ${isActive ? "dv-option--active" : ""}`}
                                >
                                    <span
                                        className="dv-option__icon"
                                        aria-hidden="true"
                                    >
                                        {tpl.icon}
                                    </span>
                                    <span className="dv-option__body">
                                        <span className="dv-option__name">
                                            {tpl.label}
                                        </span>
                                        <span className="dv-option__meta">
                                            Kategori & produk contoh siap
                                            pakai
                                        </span>
                                    </span>
                                </button>
                            );
                        })}

                        {activeStoreType.business_templates.length === 0 && (
                            <p
                                className="text-[0.8125rem]"
                                style={{ color: "var(--dv-muted)" }}
                            >
                                Belum ada template siap untuk jenis usaha
                                ini — toko akan dimulai kosong, tetap bisa
                                ditambah manual nanti.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function PlanStep({ plans, selectedPlanId, onSelect, error }) {
    return (
        <div>
            <p className="dv-label">Langkah 3 dari 3</p>
            <h2 className="dv-title mt-3">Pilih plan</h2>
            <p
                className="mt-2 text-[0.9375rem] leading-relaxed"
                style={{ color: "var(--dv-muted)" }}
            >
                Bisa upgrade atau downgrade kapan saja dari dashboard.
            </p>

            <FieldError message={error} />

            <div className="mt-6 space-y-2">
                {plans.map((plan) => {
                    const isActive = String(selectedPlanId) === String(plan.id);
                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => onSelect(plan.id)}
                            className={`dv-option items-start ${isActive ? "dv-option--active" : ""}`}
                        >
                            <span className="dv-option__body">
                                <span className="flex items-center gap-2">
                                    <span className="dv-option__name">
                                        {plan.label}
                                    </span>
                                    {plan.trial_days > 0 && (
                                        <span className="dv-flag">
                                            Trial {plan.trial_days} hari
                                        </span>
                                    )}
                                </span>
                                <span className="dv-option__meta">
                                    {plan.price > 0
                                        ? `Rp ${Number(plan.price).toLocaleString("id-ID")}/bulan`
                                        : "Gratis"}
                                </span>
                            </span>
                            {isActive && (
                                <Check
                                    size={16}
                                    strokeWidth={2.5}
                                    className="dv-option__arrow"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
