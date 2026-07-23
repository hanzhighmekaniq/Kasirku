import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import EmployeeForm from "./EmployeeForm";

const PAGE_LABEL = {
    retail: "Karyawan",
    fnb: "Karyawan",
    service: "Terapis / Staf",
    rental: "Staf",
    ticket: "Staf & Operator",
    hospitality: "Staf Hotel",
    parking: "Petugas Parkir",
    session: "Operator",
};

export default function Create({
    branches,
    suggestedCode,
    roles = [],
    storeType = "retail",
}) {
    const { currentBranch = null } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        employee_code: suggestedCode || "",
        branch_id: "",
        name: "",
        phone: "",
        email: "",
        position: "",
        commission_type: "none",
        commission_value: 0,
        status: "active",
        create_account: true,
        role: "kasir",
        password: "",
        password_confirmation: "",
    });

    const pageLabel = PAGE_LABEL[storeType] ?? "Karyawan";
    const showCommission = ["service", "ticket"].includes(storeType);

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.employees.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Manajemen {pageLabel}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Tambah
                    </div>
                </div>
            }
        >
            <Head title={`Tambah ${pageLabel}`} />

            {/* Hero */}
            <section className="mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                {pageLabel} baru
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span>Tim</span>
                            {currentBranch && (
                                <>
                                    <span className="text-muted-foreground">
                                        ·
                                    </span>
                                    <span>{currentBranch.name}</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-lg font-bold tracking-tighter text-foreground sm:text-3xl">
                            Tambah{" "}
                            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                                {pageLabel.toLowerCase()} baru
                            </span>{" "}
                            ke tim
                        </h1>
                        <p className="mt-2 max-w-xl text-xs text-muted-foreground">
                            Lengkapi identitas, cabang, jabatan, dan opsi akun
                            login. Data ini dipakai di POS, shift, dan laporan.
                        </p>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-3xl pb-10">
                <EmployeeForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={submit}
                    branches={branches}
                    roles={roles}
                    submitLabel={`Simpan ${pageLabel}`}
                    cancelHref={route("admin.employees.index")}
                    storeType={storeType}
                    showCommission={showCommission}
                />
            </div>
        </AuthenticatedLayout>
    );
}
