function generatePassword() {
        const length = Number(document.getElementById("length").value);
        if (!Number.isInteger(length) || length < 6 || length > 32) return alert("Choose a length from 6 to 32.");
        let includeNumbers = document.getElementById("includeNumbers").value === "yes";
        let includeSpecial = document.getElementById("includeSpecial").value === "yes";
        let includeUppercase = document.getElementById("includeUppercase").value === "yes";

        let lowerChars = "abcdefghijklmnopqrstuvwxyz";
        let upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let numberChars = "0123456789";
        let specialChars = "!@#$%^&*()-_=+[]{}|;:'\",.<>?/";

        let charSet = lowerChars;
        if (includeUppercase) charSet += upperChars;
        if (includeNumbers) charSet += numberChars;
        if (includeSpecial) charSet += specialChars;

        let password = "";
        for (let i = 0; i < length; i++) {
            let random;
            const limit = 256 - 256 % charSet.length;
            do { random = crypto.getRandomValues(new Uint8Array(1))[0]; } while (random >= limit);
            const randomIndex = random % charSet.length;
            password += charSet[randomIndex];
        }

        document.getElementById("password").textContent = "Generated Password: " + password;
    }
