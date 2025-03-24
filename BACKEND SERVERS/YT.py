from flask import Flask, request, send_file, jsonify
from pytube import YouTube
import os

app = Flask(__name__)

DOWNLOAD_FOLDER = "downloads"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

@app.route('/download', methods=['GET'])
def download_video():
    url = request.args.get('url')
    quality = request.args.get('quality')

    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    try:
        yt = YouTube(url)
        stream = None

        # Select stream based on requested quality
        if quality == 'highest':
            stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
        elif quality == '1080p':
            stream = yt.streams.filter(res="1080p", file_extension='mp4', progressive=True).first()
        elif quality == '720p':
            stream = yt.streams.filter(res="720p", file_extension='mp4', progressive=True).first()
        elif quality == '480p':
            stream = yt.streams.filter(res="480p", file_extension='mp4', progressive=True).first()

        if stream is None:
            return jsonify({'error': f'{quality} quality not available'}), 400

        # Generate the file path
        filename = f"{yt.title.replace(' ', '_').replace('/', '_')}.mp4"
        filepath = os.path.join(DOWNLOAD_FOLDER, filename)

        # Download the file
        stream.download(output_path=DOWNLOAD_FOLDER, filename=filename)

        # Send the file to the user
        return send_file(filepath, as_attachment=True)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
