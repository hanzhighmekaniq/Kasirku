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

export default function Edit({
    employee,
    branches,
    roles = [],
    storeType = "retail",
}) {
    const { currentBranch = null } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        employee_code: employee.employee_code || "",
        branch_id: employee.branch_id || "",
        name: employee.name || "",
        phone: employee.phone || "",
        email: employee.email || employee.user?.email || "",
        position: employee.position || "",
        commission_type: employee.commission_type || "none",
        commission_value: employee.commission_value || 0,
        status: employee.status || "active",
        create_account: !!employee.user,
        role: employee.user_roles?.[0] || "kasir",
        password: "",
        password_confirmation: "",
    });

    const pageLabel = PAGE_LABEL[storeType] ?? "Karyawan";
    const showCommission = ["service", "ticket"].includes(storeType);

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.employees.update", employee.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Manajemen {pageLabel}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Edit
                    </div>
                </div>
            }
        >
            <Head title={`Edit ${pageLabel}`} />

            {/* Hero */}
            <section className="mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Edit {pageLabel.toLowerCase()}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="font-mono">
                                {employee.employee_code}
                            </span>
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
                            Perbarui{" "}
                            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                                {employee.name}
                            </span>
                        </h1>
                        <p className="mt-2 max-w-xl text-xs text-muted-foreground">
                            Ubah identitas, cabang, jabatan, status, dan akun
                            login. Perubahan langsung mempengaruhi akses POS.
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
                    submitLabel="Simpan Perubahan"
                    cancelHref={route("admin.employees.index")}
                    editing
                    storeType={storeType}
                    showCommission={showCommission}
                />
            </div>
        </AuthenticatedLayout>
    );
}
