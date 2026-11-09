document.getElementById('upscale').addEventListener('click', () => {
            const fileInput = document.getElementById('image-upload');
            const scaleFactor = parseInt(document.getElementById('scale').value);
            const resultDiv = document.getElementById('result');
            const downloadBtn = document.getElementById('download');

            if (!fileInput.files.length) {
                alert('Please upload an image first.');
                return;
            }

            const file = fileInput.files[0];
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return alert('Choose a PNG, JPEG, or WebP image up to 5 MB.');
            const reader = new FileReader();

            reader.onload = function (event) {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    if (![2, 4].includes(scaleFactor) || img.width * img.height * scaleFactor * scaleFactor > 32000000) return alert('The output exceeds the 32 megapixel limit. Choose a smaller image.');
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width * scaleFactor;
                    canvas.height = img.height * scaleFactor;

                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    const dataURL = canvas.toDataURL('image/png');
                    resultDiv.innerHTML = `
                        <p>Original: ${img.width}x${img.height}px<br>Upscaled: ${canvas.width}x${canvas.height}px</p>
                        <img alt="Upscaled image preview" src="${dataURL}" style="max-width:100%; border-radius:8px;" />`;

                    downloadBtn.style.display = 'inline-block';
                    downloadBtn.onclick = () => {
                        const link = document.createElement('a');
                        link.href = dataURL;
                        link.download = `upscaled-${scaleFactor}x.png`;
                        link.click();
                    };
                };
            };

            reader.readAsDataURL(file);
        });
