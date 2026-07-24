import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
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
                <div className="leading-tight"
            
            backUrl={route("admin.employees.index")}>
                    <div className="text-sm font-semibold text-foreground">
                        Karyawan
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Edit
                    </div>
                </div>
            }>
            <PageHeader
                title={`Edit ${pageLabel}`}
                breadcrumbs={["Admin", "Karyawan", "Edit"]}
                heading={
                    <>
                        Perbarui{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {employee.name}
                        </span>
                    </>
                }
                description="Ubah identitas, cabang, jabatan, status, dan akun login. Perubahan langsung mempengaruhi akses POS."
                
            />

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
