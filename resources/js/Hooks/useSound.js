/**
 * useSound — Web Audio API sound effects untuk POS
 * Tidak perlu file audio eksternal, semua di-generate programatik.
 */

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume jika suspended (browser policy)
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * Generate tone sederhana
 * @param {number} freq - Frekuensi Hz
 * @param {number} duration - Durasi ms
 * @param {string} type - oscillator type: sine | square | sawtooth | triangle
 * @param {number} volume - 0-1
 * @param {number} startTime - waktu mulai (dari audioCtx.currentTime)
 */
function playTone(freq, duration, type = "sine", volume = 0.3, startTime = 0) {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        const t = ctx.currentTime + startTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration / 1000);

        osc.start(t);
        osc.stop(t + duration / 1000 + 0.05);
    } catch (_) {
        // Silent fail — tidak break app jika audio tidak tersedia
    }
}

/**
 * Suara saat produk ditambah ke keranjang
 * Pop pendek yang menyenangkan
 */
export function playAddToCart() {
    try {
        playTone(880, 60, "sine", 0.25, 0);
        playTone(1100, 50, "sine", 0.15, 0.05);
    } catch (_) {}
}

/**
 * Suara saat item dihapus dari keranjang
 * Soft thud menurun
 */
export function playRemoveItem() {
    try {
        playTone(300, 80, "sine", 0.2, 0);
        playTone(200, 60, "sine", 0.1, 0.06);
    } catch (_) {}
}

/**
 * Suara saat qty item diubah (naik)
 * Tick kecil
 */
export function playQtyUp() {
    try {
        playTone(660, 40, "sine", 0.15, 0);
    } catch (_) {}
}

/**
 * Suara saat qty item diubah (turun)
 */
export function playQtyDown() {
    try {
        playTone(440, 40, "sine", 0.12, 0);
    } catch (_) {}
}

/**
 * Suara saat pembayaran berhasil
 * Chime 3-tone naik — celebratory
 */
export function playPaymentSuccess() {
    try {
        playTone(523, 120, "sine", 0.3, 0);      // C5
        playTone(659, 120, "sine", 0.3, 0.13);   // E5
        playTone(784, 200, "sine", 0.35, 0.26);  // G5
    } catch (_) {}
}

/**
 * Suara error / gagal
 */
export function playError() {
    try {
        playTone(220, 150, "square", 0.15, 0);
        playTone(185, 150, "square", 0.12, 0.16);
    } catch (_) {}
}

/**
 * Hook untuk dipakai di komponen React
 */
export default function useSound() {
    return {
        playAddToCart,
        playRemoveItem,
        playQtyUp,
        playQtyDown,
        playPaymentSuccess,
        playError,
    };
}
