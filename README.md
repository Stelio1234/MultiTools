<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Multi Tools Hub</title>
    <style>
        body {
            background-color: #121212;
            color: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        .container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            background-color: #1e1e1e;
            padding: 130px;
            border-radius: 16px;
            box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.5);
            width: 100%;
            max-width: 500px;
            text-align: center;
            height: 100%;
        }

        h1 {
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
            margin: 0; /* Removed margin to eliminate space */
        }

        p {
            font-size: 18px;
            color: #cccccc;
            margin: 0; /* Removed margin to eliminate space */
        }

        .navbar {
            display: flex;
            justify-content: center;
            gap: 15px;
        }

        .navbar a {
            padding: 12px 20px;
            border-radius: 8px;
            text-decoration: none;
            color: #ffffff;
            background-color: #2c2c2c;
            font-size: 18px;
            transition: all 0.2s ease;
        }

        .navbar a:hover {
            background-color: #4caf50;
            transform: translateY(-2px);
            box-shadow: 0px 4px 12px rgba(0, 255, 0, 0.3);
        }

        .tool-card {
            background-color: #2c2c2c;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
        }

        .tool-card h2 {
            font-size: 24px;
            margin-bottom: 10px;
        }

        .tool-card p {
            font-size: 16px;
            margin-bottom: 20px;
        }

        .tool-card button {
            padding: 12px;
            border-radius: 8px;
            background-color: #4caf50;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s ease;
        }

        .tool-card button:hover {
            background-color: #45a049;
            transform: translateY(-2px);
            box-shadow: 0px 4px 12px rgba(0, 255, 0, 0.3);
        }
    </style>
</head>
<body>

<div class="container">
    <h1>MultiTools</h1>
    <p>The Site with many tools</p>

    <div class="tool-card">
        <h2>YouTube Downloader</h2>
        <p>Download YouTube videos with ease in various qualities and formats.</p>
        <button onclick="window.location.href='YT Downloader\\YT Downloader.html'">Go to YouTube Downloader</button>
    </div>

    <div class="tool-card">
        <h2>TikTok Downloader</h2>
        <p>Download TikTok videos without watermarks.</p>
        <button onclick="window.location.href='TikTok Downloader\\TikTok Downloader.html'">Go to TikTok Downloader</button>
    </div>

    <div class="tool-card">
        <h2>IOS Web clip Generator</h2>
        <p>Generates an IOS webclip.</p>
        <button onclick="window.location.href='WebClip.html'">Go to Web Clip Generator</button>
    </div>
</div>

</body>
</html>
