// Minimal wrapper over genuine Web Crypto API for ECDH key exchange and AES-GCM encryption
export async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true, // extractable
        ["deriveKey", "deriveBits"]
    );
}

export async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(b64) {
    const binaryDer = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return await window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
    );
}

export async function deriveSharedSecret(privateKey, publicKey) {
    return await window.crypto.subtle.deriveKey(
        { name: "ECDH", public: publicKey },
        privateKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptMessage(sharedKey, messageText) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(messageText);

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        sharedKey,
        encoded
    );

    // Return iv and ciphertext concatenated as base64
    const ivArr = Array.from(iv);
    const cipherArr = Array.from(new Uint8Array(ciphertext));
    return btoa(JSON.stringify({ iv: ivArr, ct: cipherArr }));
}

export async function decryptMessage(sharedKey, encryptedJSONB64) {
    const { iv, ct } = JSON.parse(atob(encryptedJSONB64));
    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        sharedKey,
        new Uint8Array(ct)
    );

    return new TextDecoder().decode(decrypted);
}
