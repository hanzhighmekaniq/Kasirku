import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, useForm } from "@inertiajs/react";
import MembershipForm, { buildPayload, emptyBenefit } from "./MembershipForm";

export default function Edit({
    membership,
    benefitTypes = [],
    products = [],
    customerTiers = [],
}) {
    const rawBenefits = membership.benefits || [];
    const tierRow = rawBenefits.find((b) => b.type === "maps_to_tier");

    const { data, setData, patch, processing, errors, transform } = useForm({
        code: membership.code || "",
        name: membership.name || "",
        description: membership.description || "",
        duration_type: membership.duration_type || "month",
        duration_value: membership.duration_value || 1,
        price: membership.price ?? "",
        maps_to_tier_id: tierRow?.tier_id || membership.maps_to_tier_id || "",
        is_sellable_at_pos: membership.is_sellable_at_pos ?? false,
        auto_tier_min_spend: membership.auto_tier_min_spend ?? "",
        auto_tier_window_type: membership.auto_tier_window_type || "",
        auto_tier_window_value: membership.auto_tier_window_value ?? "",
        // `maps_to_tier` dipisah dari daftar benefit biasa karena punya dropdown
        // khusus di atas form.
        benefits: rawBenefits
            .filter((b) => b.type !== "maps_to_tier")
            .map((b) => ({
                ...emptyBenefit(),
                ...b,
                value: b.value ?? "",
                tier_id: b.tier_id ?? "",
                product_id: b.product_id ?? "",
                quantity: b.quantity ?? "",
                min_purchase: b.min_purchase ?? "",
                max_amount: b.max_amount ?? "",
            })),
        is_active: membership.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();

        transform((form) => buildPayload(form, customerTiers));

        patch(route("admin.memberships.update", membership.id));
    };

    return (
        <AuthenticatedLayout
            backUrl={route("admin.memberships.show", membership.id)}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        {membership.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Edit</div>
                </div>
            }
        >
            <Head title={`Edit ${membership.name}`} />
            <PageHeader
                title={`Edit ${membership.name}`}
                breadcrumbs={["Admin", "Membership", membership.name, "Edit"]}
                heading={
                    <>
                        Edit <span className="text-primary">{membership.name}</span>
                    </>
                }
                description="Ubah durasi, harga, tier, dan benefit paket membership."
                backUrl={route("admin.memberships.show", membership.id)}
            />

            <MembershipForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={submit}
                submitLabel="Simpan Perubahan"
                cancelHref={route("admin.memberships.show", membership.id)}
                benefitTypes={benefitTypes}
                products={products}
                customerTiers={customerTiers}
            />
        </AuthenticatedLayout>
    );
}
