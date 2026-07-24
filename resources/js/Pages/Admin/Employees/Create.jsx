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
                <div className="leading-tight"
            
            backUrl={route("admin.employees.index")}>
                    <div className="text-sm font-semibold text-foreground">
                        Karyawan
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Tambah
                    </div>
                </div>
            }>
            <PageHeader
                title={`Tambah ${pageLabel}`}
                breadcrumbs={["Admin", "Karyawan", "Tambah"]}
                heading={
                    <>
                        Tambah{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {pageLabel.toLowerCase()} baru
                        </span>{" "}
                        ke tim
                    </>
                }
                description="Lengkapi identitas, cabang, jabatan, dan opsi akun login. Data ini dipakai di POS, shift, dan laporan."
                
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
                    submitLabel={`Simpan ${pageLabel}`}
                    cancelHref={route("admin.employees.index")}
                    storeType={storeType}
                    showCommission={showCommission}
                />
            </div>
        </AuthenticatedLayout>
    );
}
