import { Head, useForm } from "@inertiajs/react";
import StoreForm from "./StoreForm";

export default function Edit({ store, storeTypes, plans = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        code: store.code ?? "",
        name: store.name ?? "",
        store_type: store.store_type ?? "retail",
        phone: store.phone ?? "",
        email: store.email ?? "",
        address: store.address ?? "",
        is_active: store.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("developer.stores.update", store.id));
    };

    return (
        <>
            <Head title={`Edit — ${store.name}`} />
            <StoreForm
                title={`Edit Toko — ${store.name}`}
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={submit}
                cancelHref={route("developer.stores.show", store.id)}
                isEdit
                store={store}
                plans={plans}
            />
        </>
    );
}
