import SwiftUI

struct ContentView: View {
    @State private var navigateTo: String?

    let html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Multi Tools Hub</title>
          <link rel="icon" type="image/x-icon" href="/images/MultiTools.jpg">
          <meta name="theme-color" content="#45a049">
          <link rel="manifest" href="/manifest.json">
          <link rel="stylesheet" href="css/footer.css">
          <script src='https://kit.fontawesome.com/a076d05399.js' crossorigin='anonymous'></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
          <meta name="description" content="Multi Tools is a free website offering many useful online tools like YouTube downloader, QR code generator, unit converter, and more – all in one place!">
          <style>

        :root {
          --padding-container: 40px;
          --font-h1: 32px;
          --font-p: 18px;
          --button-padding: 15px;
          --grid-columns: repeat(2, 1fr);
          --tooltip-font: 14px;
          --max-container-width: 600px;
        }

        @media (max-width: 575.98px) {
          :root {
            --padding-container: 16px;
            --font-h1: 24px;
            --font-p: 14px;
            --button-padding: 12px;
            --grid-columns: 1fr;
            --tooltip-font: 12px;
            --max-container-width: 100%;
          }
        }

        @media (min-width: 576px) and (max-width: 767.98px) {
          :root {
            --padding-container: 20px;
            --font-h1: 26px;
            --font-p: 16px;
            --button-padding: 13px;
          }
        }

        @media (min-width: 768px) and (max-width: 991.98px) {
          :root {
            --padding-container: 28px;
          }
        }

        @media (min-width: 992px) and (max-width: 1199.98px) {
          :root {
            --padding-container: 32px;
          }
        }

        @media (min-width: 1200px) and (max-width: 1399.98px) {
          :root {
            --padding-container: 36px;
          }
        }

        @media (min-width: 1400px) {
          :root {
            --padding-container: 40px;
          }
        }

        html, body {
          height: auto;
          margin: auto;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
          background-color: #121212;
          color: #ffffff;
        }

        body {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: var(--padding-container);
          height: 100vh;
          box-sizing: border-box;
          height: auto;
          margin: auto;
        }

        .container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          background-color: #1e1e1e;
          padding: var(--padding-container);
          border-radius: 16px;
          box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: var(--max-container-width);
          text-align: center;
        }

        h1 {
          font-size: var(--font-h1);
          font-weight: bold;
          color: #ffffff;
          margin: 0;
        }

        p, .p1 {
          font-size: var(--font-p);
          color: #cccccc;
          margin-bottom: 20px;
          text-align: center;
        }

        .badge-new {
          color: #ff4;
          font-weight: bold;
          margin-left: 6px;
        }

        .grid-container {
          display: grid;
          grid-template-columns: var(--grid-columns);
          gap: 15px;
          justify-content: center;
          align-items: center;
        }

        .grid-item {
          position: relative;
        }

        .tooltip {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          background-color: #333;
          color: #fff;
          padding: 10px 14px;
          border-radius: 6px;
          visibility: hidden;
          opacity: 0;
          transition: opacity 0.4s ease, transform 0.4s ease;
          font-size: var(--tooltip-font);
          z-index: 1;
          white-space: normal;
          text-align: left;
          max-width: 220px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          line-height: 1.4;
        }

        .grid-item:hover .tooltip {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .grid-item button {
          width: 100%;
          padding: var(--button-padding);
          border-radius: 8px;
          background-color: #4caf50;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .grid-item button:hover {
          background-color: #45a049;
          transform: translateY(-2px);
          box-shadow: 0px 4px 12px rgba(0, 255, 0, 0.3);
        }

        .login-btn, .download-btn {
          position: absolute;
          padding: 10px 20px;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .login-btn {
          top: 70px;
          right: 20px;
        }

        .download-btn {
          top: 20px;
          right: 20px;
        }

        .login-btn:hover, .download-btn:hover {
          background-color: #45a049;
          transform: translateY(-2px);
          box-shadow: 0px 4px 12px rgba(0, 255, 0, 0.3);
        }

        footer {
          color: #ffffff;
          height: 50px;
          text-align: center;
        }

        .popup-container {
          width: 20px;
          height: 40px;
          border-radius: 8px;
          transition: opacity 0.4s ease, transform 0.4s ease;

        }
            #myPopup {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 0;
              width: 300px;
              padding: 20px;
              background-color: #222;
              color: #fff;
              border-radius: 8px;
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
              transition: opacity 0.4s ease, transform 0.4s ease;
              z-index: 999;
              pointer-events: none;
            }

            #myPopup.show {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
              pointer-events: auto;
            }

            #button {
              position: fixed;
              padding: 10px 10px;
              background-color: #4caf50;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.2s ease;
              position: relative;

            }
            </style>
        </head>
        <body>
                  <div class=\"container\">
                    <h1>MultiTools</h1>
                    <p1>The App with Many Tools</p1>
                    <p id=\"welcome\"></p>

                    <h1>Common Tools</h1>
                    <div class=\"grid-container\">
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Set a countdown for tasks</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('TimerView')\">Timer</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Convert units of measure</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('UnitConverterView')\">Unit Converter</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Estimate pet ages</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('PetAgeCalculatorView')\">Pet Age Calculator</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Calculates your tip</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('TipCalculatorView')\">Tip Calculator</button>
                      </div>
                    </div>

                    <h1>Downloaders</h1>
                    <div class=\"grid-container\">
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Download YouTube videos</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('YTDownloaderView')\">YT Downloader</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Download TikTok videos</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('TikTokDownloaderView')\">TikTok Downloader</button>
                      </div>
                    </div>

                    <h1>Dev Tools</h1>
                    <div class=\"grid-container\">
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Encrypt and decrypt text</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('EncryptDecryptView')\">Text Encrypter & Decrypter</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Generate a webpage clip</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('WebClipView')\">WebClip Generator</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Install IPA files</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('IPAInstallerView')\">IPA Installer</button>
                      </div>
                    </div>

                    <h1>Image Tools</h1>
                    <div class=\"grid-container\">
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Reduce image size</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('ImageCompressorView')\">Image Compressor</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Convert image format</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('ImageConverterView')\">Image Converter</button>
                      </div>
                    </div>

                    <h1>Generators</h1>
                    <div class=\"grid-container\">
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Generate random gamertags</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('GamertagGenView')\">Gamertag Generator</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Generate a QR Code</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('QrCodeView')\">QR Code Generator</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Generate secure passwords</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('PasswordGeneratorView')\">Password Generator</button>
                      </div>
                    </div>

                    <h1>Site Info</h1>
                    <div class=\"grid-container\">
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Patch Notes</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('PatchNotesView')\">Patch Notes</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Terms Of Service</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('TOSView')\">Terms of Service</button>
                      </div>
                      <div class=\"grid-item\">
                        <div class=\"tooltip\">Settings</div>
                        <button onclick=\"window.webkit.messageHandlers.navigate.postMessage('SettingsView')\">Settings</button>
                      </div>
                    </div>
                  </div>
                </body>
        </html>
    """ // Truncated for readability

    var body: some View {
            NavigationView {
                ZStack {
                    HTMLWebView(htmlContent: html, onNavigationRequest: { tool in
                        navigateTo = tool
                    })
                    .edgesIgnoringSafeArea(.all)
                    .navigationBarHidden(true)

                    NavigationLink(destination: QrCodeGenView(), tag: "QrCodeView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: TipcalculatorView(), tag: "TipCalculatorView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: UnitconverterView(), tag: "UnitConverterView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: EncryptedView(), tag: "EncryptDecryptView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: SettingsView(), tag: "SettingsView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: PatchnotesView(), tag: "PatchNotesView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: WebclipView(), tag: "WebClipView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: PasswordGenView(), tag: "PasswordGeneratorView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: GamertagGenView(), tag: "GamertagGenView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: TimerView(), tag: "TimerView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: ConstructionView(), tag: "ImageCompressorView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: ConstructionView(), tag: "ImageConverterView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: ConstructionView(), tag: "TikTokDownloaderView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: ConstructionView(), tag: "YTDownloaderView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: ConstructionView(), tag: "IPAInstallerView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: ConstructionView(), tag: "PetAgeCalculatorView", selection: $navigateTo) { EmptyView() }
                    NavigationLink(destination: ConstructionView(), tag: "TOSView", selection: $navigateTo) { EmptyView() }
                }
            }
            .navigationViewStyle(StackNavigationViewStyle())
        }
    }

#Preview {
    ContentView()
}

