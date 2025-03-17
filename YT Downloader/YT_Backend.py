from flask import Flask, request, send_from_directory, jsonify
from pytube import YouTube
import os
import hashlib
import urllib.parse
from flask_cors import CORS  # Import CORS

app = Flask(__name__)

# Enable CORS
CORS(app)

# Create the downloads folder if it doesn't exist
DOWNLOAD_FOLDER = 'downloads'
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

@app.route('/download', methods=['GET'])
def download():
    url = request.args.get('url')
    quality = request.args.get('quality', 'highest')
    format = request.args.get('format', 'mp4')

    if not url:
        return jsonify({'error': 'Missing URL'}), 400

    # Decode the URL to handle special characters properly
    url = urllib.parse.unquote(url)

    try:
        yt = YouTube(url)
        
        # Create a unique hash for caching
        video_hash = hashlib.md5(f"{url}-{quality}-{format}".encode()).hexdigest()
        extension = 'mp3' if format == 'mp3' else 'mp4'
        filename = f"{video_hash}.{extension}"
        filepath = os.path.join(DOWNLOAD_FOLDER, filename)

        # ✅ Check for cache
        if os.path.exists(filepath):
            return send_from_directory(DOWNLOAD_FOLDER, filename, as_attachment=True)

        # ✅ Download if not cached
        if format == 'mp3':
            # Get the first available audio stream
            stream = yt.streams.filter(only_audio=True).first()
        else:
            # Get the video stream for the specified quality (e.g., 720p, 1080p)
            stream = yt.streams.filter(res=quality, file_extension="mp4").first()

        if not stream:
            return jsonify({'error': f'No stream found for {quality}'}), 400

        # Download the stream and save it to the downloads folder
        stream.download(output_path=DOWNLOAD_FOLDER, filename=filename)

        return send_from_directory(DOWNLOAD_FOLDER, filename, as_attachment=True)

    except Exception as e:
        # Catch and return the error if any exception occurs
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
