import { usePage } from "@inertiajs/react";
import { useState, useCallback } from "react";

/**
 * Hook untuk cek verifikasi email sebelum eksekusi aksi.
 *
 * Jika email belum diverifikasi, tampilkan VerificationRequiredModal
 * dan batalkan aksi. Jika sudah verified, jalankan callback.
 *
 * Usage:
 *   const { checkVerification, VerificationModal } = useVerificationGuard();
 *
 *   const handleSave = () => {
 *     if (!checkVerification()) return;
 *     // ... proceed with save
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleSave}>Save</button>
 *       <VerificationModal />
 *     </>
 *   );
 */

export function useVerificationGuard() {
    const { auth } = usePage().props;
    const [showModal, setShowModal] = useState(false);

    const isVerified = auth?.emailVerified ?? false;

    const checkVerification = useCallback(() => {
        if (isVerified) {
            return true;
        }
        setShowModal(true);
        return false;
    }, [isVerified]);

    const closeModal = useCallback(() => {
        setShowModal(false);
    }, []);

    return {
        isVerified,
        checkVerification,
        showModal,
        closeModal,
    };
}
