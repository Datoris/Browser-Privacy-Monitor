const initializationVector = window.crypto.getRandomValues(new Uint8Array(12));

// encryption function using AES specification with Galois/Counter mode
async function encrypt(data, key) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const cipher = await window.crypto.subtle.encrypt({
    name: "AES-GCM",
    iv: initializationVector
  }, key, encoded);
  return cipher;
}

async function decrypt(cipher, key, initializationVector) {
  if (cipher.byteLength) {
    const decoder = new TextDecoder();
    try {
      const encoded = await window.crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: initializationVector,
      }, key, cipher);
      return decoder.decode(encoded);
    } catch (err) {};
  }
  return "";
}

// packing function for transforming the ArrayBuffer type ciphertext returned by encryption into base64 string
function pack(buffer) {
  return window.btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

function unpack(packed) {
  const string = window.atob(packed);
  const buffer = new ArrayBuffer(string.length);
  const bufferView = new Uint8Array(buffer);
  for (let i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }
  return buffer;
}

async function generateKey() {
  return window.crypto.subtle.generateKey({
    name: "AES-GCM",
    length: 256,
  }, true, ["encrypt", "decrypt"]);
}

export {
  initializationVector,
  encrypt,
  decrypt,
  pack,
  unpack,
  generateKey,
}