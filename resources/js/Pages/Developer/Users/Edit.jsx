import { Head, useForm } from '@inertiajs/react';
import UserForm from './UserForm';

export default function Edit({ user, stores, storeRoles }) {
    const { data, setData, put, processing, errors } = useForm({
        name:                  user.name  ?? '',
        email:                 user.email ?? '',
        password:              '',
        password_confirmation: '',
        is_developer:          user.is_developer ?? false,
        // storeRoles dari controller: [{ store_id, role }]
        store_roles:           storeRoles ?? [],
    });

    const submit = (e) => { e.preventDefault(); put(route('developer.users.update', user.id)); };

    return (
        <>
            <Head title={`Edit — ${user.name}`} />
            <UserForm
                title={`Edit User — ${user.name}`}
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                cancelHref={route('developer.users.show', user.id)}
                isEdit user={user} stores={stores}
                storeRoles={storeRoles}
            />
        </>
    );
}
