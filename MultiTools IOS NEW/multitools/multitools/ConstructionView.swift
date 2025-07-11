import SwiftUI

struct ConstructionView: View {
    @Environment(\.dismiss) private var dismiss

    let html = """
    <!DOCTYPE html>
    <html lang=\"en\">
    <head>
        <meta charset=\"utf-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
        <link rel=\"shortcut icon\" type=\"image/x-icon\" href=\"Images/CoasterStudiosLogo.png\"/>
        <title>MultiTools</title>
        <link rel=\"icon\" type=\"image/x-icon\" href=\"/MultiTools.jpg\">
        <meta name=\"theme-color\" content=\"#45a049\">
        <link rel=\"manifest\" href=\"/manifest.json\">
        <link rel=\"icon\" type=\"image/x-icon\" href=\"/images/MultiTools.jpg\">
        <style>
            body {
                background-color: black;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif;
                text-align: center;
                margin: 0;
                display: flex;
                justify-content: center; 
                align-items: center;
                height: 100vh;
                flex-direction: column;
            }
            h1 {
                font-size: 2.5em;
                font-weight: bold;
                color: #45a049;
                margin-top: 20px;   
            }
            .container {
                max-width: 400px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);
                text-align: center;
                backdrop-filter: blur(10px);
                left: 0%;
                top: -5%;
                position: relative;
            }
            .icon-large {
                height: 120px;
                width: 120px;
                color: #45a049;
            }
            .description-text {
                font-size: 1.2em;
                color: #ddd;
                margin-top: 15px;
            }
            .footer {
                margin-top: 30px;
            }
            .footer a {
                color: #45a049;
                text-decoration: none;
                font-size: 1em;
                transition: color 0.3s ease-in-out;
            }
            .footer a:hover {
                color: white;
            }
            .animate__animated {
                animation-duration: 1s;
                animation-fill-mode: both;
                color: #45a049;
            }
            .animate__fadeIn {
                animation-name: fadeIn;
            }
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .back-button {
                padding: 12px 20px;
                border-radius: 8px;
                border: none;
                background-color: #4caf50;
                color: white;
                font-size: 16px;
                cursor: pointer;
                width: 120px;
                position: relative;
                transition: all 0.2s ease;
                animation: fadeInUp 1s ease-out;
            }
            @keyframes fadeInUp {
                0% {
                    opacity: 0;
                    transform: translateY(30px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .back-button:hover {
                background-color: #45a049;
                transform: translateY(-2px);
                box-shadow: 0px 4px 12px rgba(0, 255, 0, 0.3);
            }
        </style>
    </head>
    <body>
        <div class=\"container animate__animated animate__fadeIn\">
            <svg class=\"warning icon-large fa-hard-hat\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" style: fill=\"#45a049\">
                <path d=\"M480 288c0-80.25-49.28-148.92-119.19-177.62L320 192V80a16 16 0 0 0-16-16h-96a16 16 0 0 0-16 16v112l-40.81-81.62C81.28 139.08 32 207.75 32 288v64h448zm16 96H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h480a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z\"></path>
            </svg>
            <h1>We're working on it!</h1>
            <div class=\"description-text\">
                <p>This page is currently not available.</p>
                <p>Please come back later.</p>
            </div>        
            <section class=\"footer\">
                <button class=\"back-button\" onclick=\"window.webkit.messageHandlers.navigate.postMessage('ContentView')\">Back</button>
            </section>
        </div>
    </body>
    </html>
    """

    var body: some View {
        NavigationStack {
            HTMLWebView(htmlContent: html, onNavigationRequest: { tool in
                if tool == "ContentView" {
                    dismiss()
                }
            })
            .edgesIgnoringSafeArea(.all)
            .navigationBarBackButtonHidden(true)
            .navigationBarBackButtonHidden(true)
            .navigationBarHidden(true)
        }
    }
}

#Preview {
    ConstructionView()
}

#Preview {
    ContentView()
}
