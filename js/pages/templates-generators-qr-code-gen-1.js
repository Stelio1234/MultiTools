let useGradient = true;
    let logoData = "";

    // Initialize the QR Code instance
    const qrCode = new QRCodeStyling({
        width: 300,
        height: 300,
        type: "canvas",
        data: "Hello World",
        dotsOptions: {
            color: "#000000",
            type: "square"
        },
        backgroundOptions: {
            color: "#ffffff"
        },
    });

    qrCode.append(document.getElementById("qr-code"));

    function updateQRCode() {
        const type = $('#Qr-Type').val();
        let finalData = "";

        // Visibility Logic
        $('#text-group, #wifi-group, #phone-group, #email-group').hide();
        if (type === 'wifi') {
            $('#wifi-group').show();
            finalData = `WIFI:S:${$('#wifi-ssid').val()};T:${$('#wifi-type').val()};P:${$('#wifi-pass').val()};;`;
        } else if (type === 'phone') {
            $('#phone-group').show();
            finalData = `tel:${$('#phone-num').val()}`;
        } else if (type === 'email') {
            $('#email-group').show();
            finalData = `mailto:${$('#email-addr').val()}`;
        } else {
            $('#text-group').show();
            finalData = $('#content').val() || "Hello World";
        }

        // Sizing Logic
        const preset = $('#size-preset').val();
        let size = 300;
        if (preset === 'custom') {
            $('#manual-size-group').show();
            size = Math.min(2000, Math.max(50, parseInt($('#qr-size').val()) || 300));
        } else {
            $('#manual-size-group').hide();
            size = parseInt(preset);
        }

        let dotsOptions = {
            type: $('#shape').val()
        };

        if (useGradient) {

            dotsOptions.gradient = {
                type: $('#gradient-type').val(),
                rotation: 0,
                colorStops: [
                    { offset: 0, color: $('#gradient-from').val() },
                    { offset: 1, color: $('#gradient-to').val() }
                ]
            };
            delete dotsOptions.color; 
        } else {
            dotsOptions.color = $('#gradient-from').val();
            dotsOptions.gradient = null; 
}

        // Apply Updates
        qrCode.update({
            width: size,
            height: size,
            data: finalData,
            dotsOptions: dotsOptions,
            backgroundOptions: {
                color: $('#transparent-bg').is(":checked") ? "transparent" : $('#bg-color').val()
            },
            image: logoData || null,
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 5
            }
        });
    }

    $(document).ready(function () {
        // Universal listener for inputs
        $('input, select').on('input change', updateQRCode);

        // Fixed Gradient Toggle: Moved outside of updateQRCode to prevent recursion
        $('#gradient-toggle-btn').on('click', function () {
            useGradient = !useGradient;
            $(this).text(`Use Gradient: ${useGradient ? "On" : "Off"}`);
            updateQRCode();
        });

        // Logo Upload Logic
        $('#logo').change(function () {
            const file = this.files[0];
            if (file) {
                if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return alert('Choose a PNG, JPEG, or WebP image up to 2 MB.');
                const reader = new FileReader();
                reader.onload = e => {
                    logoData = e.target.result;
                    updateQRCode();
                };
                reader.readAsDataURL(file);
            }
        });

        // Download Logic
        $('#download').click(function () {
            qrCode.download({
                name: $('#qrcode-name').val() || "qr-code",
                extension: "png"
            });
        });

        // Reset Logic
        $('#reset').click(function () {
            location.reload();
        });

        // Initial Run
        updateQRCode();
    });
