import { useMemo, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Check,
    Sparkles,
} from "lucide-react";

/**
 * Halaman onboarding — buat toko pertama setelah registrasi.
 *
 * User yang baru registrasi (belum punya toko) diarahkan ke sini.
 * 3 langkah:
 *   1. Pilih plan (Free / Trial / Bayar)
 *   2. Pilih jenis usaha + template bisnis (opsional)
 *   3. Nama toko → Submit
 *
 * Menggunakan tema `.dv-auth` yang sama dengan Register & Login.
 */

const STEPS = [
    { key: "plan", label: "Plan" },
    { key: "business", label: "Jenis usaha" },
    { key: "store", label: "Buat toko" },
];

export default function OnboardingIndex({
    storeTypes = [],
    plans = [],
}) {
    const [step, setStep] = useState(0);
    const [activeStoreTypeId, setActiveStoreTypeId] = useState(
        storeTypes[0]?.id ?? null,
    );

    const { data, setData, post, processing, errors } = useForm({
        plan_id: null,
        store_type_id: storeTypes[0]?.id ?? "",
        business_template_code: "",
        store_name: "",
    });

    const activeStoreType = useMemo(
        () => storeTypes.find((t) => t.id === activeStoreTypeId) ?? null,
        [storeTypes, activeStoreTypeId],
    );

    const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
    const goBack = () => setStep((s) => Math.max(s - 1, 0));

    const selectStoreType = (type) => {
        setActiveStoreTypeId(type.id);
        setData("store_type_id", type.id);
        setData("business_template_code", "");
    };

    const selectTemplate = (code) => {
        setData(
            "business_template_code",
            code === data.business_template_code ? "" : code,
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("onboarding.store"));
    };

    const year = new Date().getFullYear();

    const canContinueFromPlan = !!data.plan_id;
    const canContinueFromBusiness = !!data.store_type_id;
    const canSubmit = data.store_name.trim() && data.store_type_id;

    return (
        <>
            <Head title="Siapkan Toko" />

            <div className="dv-auth grid min-h-screen lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.35fr_1fr]">
                {/* ── Band gelap ── */}
                <div className="dv-band hidden flex-col justify-between p-10 xl:p-14 lg:flex">
                    <span className="dv-wordmark text-[1.375rem]">
                        DEVus<span className="dv-wordmark__dot">.</span>id
                    </span>

                    <div className="max-w-xl space-y-6 py-10">
                        <p className="dv-flag">
                            <Check size={13} strokeWidth={2.5} />
                            Akun sudah siap
                        </p>

                        <h1 className="dv-display">
                            Saatnya buat
                            <br />
                            tokomu sendiri.
                        </h1>

                        <p className="dv-lead">
                            Pilih jenis usaha dan plan yang sesuai. Kamu bisa
                            mulai dengan plan Gratis dan upgrade kapan saja dari
                            dashboard.
                        </p>
                    </div>

                    <p className="dv-label">
                        &copy; {year} DEVus.id — Seluruh hak dilindungi
                    </p>
                </div>

                {/* ── Panel form ── */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
                    <div className="mx-auto w-full max-w-[30rem]">
                        <span className="dv-wordmark mb-8 text-[1.375rem] lg:hidden">
                            DEVus
                            <span className="dv-wordmark__dot">.</span>id
                        </span>

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
                                            <Check
                                                size={12}
                                                strokeWidth={3}
                                            />
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
                                    <PlanStep
                                        plans={plans}
                                        selectedPlanId={data.plan_id}
                                        onSelect={(id) =>
                                            setData("plan_id", id)
                                        }
                                        error={errors.plan_id}
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
                                    <StoreNameStep
                                        storeName={data.store_name}
                                        onChange={(val) =>
                                            setData("store_name", val)
                                        }
                                        error={errors.store_name}
                                        errors={errors}
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
                                    <span />
                                )}

                                {step < 2 ? (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        disabled={
                                            (step === 0 &&
                                                !canContinueFromPlan) ||
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
                                        disabled={processing || !canSubmit}
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
            <AlertTriangle
                size={13}
                strokeWidth={2.5}
                className="mt-0.5 shrink-0"
            />
            <span>{message}</span>
        </p>
    );
}

function PlanStep({ plans, selectedPlanId, onSelect, error }) {
    return (
        <div>
            <p className="dv-label">Langkah 1 dari 3</p>
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
                    // Ensure type consistency - convert both to numbers for comparison
                    const isActive = Number(selectedPlanId) === Number(plan.id);
                    
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
                                    onClick={() =>
                                        onSelectTemplate(tpl.code)
                                    }
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

                        {activeStoreType.business_templates.length ===
                            0 && (
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

function StoreNameStep({ storeName, onChange, error, errors }) {
    return (
        <div>
            <p className="dv-label">Langkah 3 dari 3</p>
            <h2 className="dv-title mt-3">Beri nama tokomu</h2>
            <p
                className="mt-2 text-[0.9375rem] leading-relaxed"
                style={{ color: "var(--dv-muted)" }}
            >
                Nama ini yang akan terlihat di dashboard dan struk. Bisa
                diubah nanti.
            </p>

            <div className="mt-7 space-y-5">
                <div className="space-y-1.5">
                    <label htmlFor="store_name" className="dv-field-label">
                        Nama toko
                    </label>
                    <input
                        id="store_name"
                        type="text"
                        value={storeName}
                        autoFocus
                        aria-invalid={error ? "true" : undefined}
                        aria-describedby={
                            error ? "store_name-error" : undefined
                        }
                        onChange={(e) => onChange(e.target.value)}
                        className="dv-input"
                        placeholder="Contoh: Minimarket Sejahtera"
                    />
                    <FieldError id="store_name-error" message={error} />
                </div>
            </div>

            <FieldError message={errors.store_type_id} />
            <FieldError message={errors.plan_id} />
        </div>
    );
}
