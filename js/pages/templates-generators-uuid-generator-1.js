function generateUUID() {
        const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        const uuid = template.replace(/[xy]/g, char => {
            const rand = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
            const val = char === "x" ? rand : (rand & 0x3 | 0x8); // RFC 4122 variant
            return val.toString(16);
        });

        const uuidInput = document.getElementById("uuidInput");
        if (uuidInput) {
            uuidInput.value = uuid;
        }
    }
