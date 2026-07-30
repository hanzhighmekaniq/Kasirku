import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, useForm } from "@inertiajs/react";
import MembershipForm, { buildPayload } from "./MembershipForm";

export default function Create({
    benefitTypes = [],
    products = [],
    customerTiers = [],
}) {
    const { data, setData, post, processing, errors, transform } = useForm({
        code: "",
        name: "",
        description: "",
        duration_type: "month",
        duration_value: 1,
        price: "",
        maps_to_tier_id: "",
        is_sellable_at_pos: false,
        auto_tier_min_spend: "",
        auto_tier_window_type: "",
        auto_tier_window_value: "",
        benefits: [],
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();

        // transform() dipakai karena useForm mengabaikan opsi `data` pada post().
        transform((form) => buildPayload(form, customerTiers));

        post(route("admin.memberships.store"));
    };

    return (
        <AuthenticatedLayout
            backUrl={route("admin.memberships.index")}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Membership
                    </div>
                    <div className="text-[11px] text-muted-foreground">Tambah</div>
                </div>
            }
        >
            <Head title="Tambah Membership" />
            <PageHeader
                title="Tambah Membership"
                breadcrumbs={["Admin", "Membership", "Tambah"]}
                heading={
                    <>
                        Tambah <span className="text-primary">Membership</span>
                    </>
                }
                description="Atur durasi, harga, tier, dan benefit paket membership."
                backUrl={route("admin.memberships.index")}
            />

            <MembershipForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={submit}
                submitLabel="Buat Membership"
                cancelHref={route("admin.memberships.index")}
                benefitTypes={benefitTypes}
                products={products}
                customerTiers={customerTiers}
            />
        </AuthenticatedLayout>
    );
}
