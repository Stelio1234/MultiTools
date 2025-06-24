import SwiftUI
import WebKit
import UIKit

struct HTMLWebView: UIViewRepresentable {
    let htmlContent: String
    var onNavigationRequest: ((String) -> Void)?

    func makeCoordinator() -> Coordinator {
        Coordinator(onNavigationRequest: onNavigationRequest)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        contentController.add(context.coordinator, name: "navigate")
        contentController.add(context.coordinator, name: "downloadHandler")
        config.userContentController = contentController

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.isScrollEnabled = true
        webView.scrollView.bounces = true
        webView.navigationDelegate = context.coordinator
        webView.loadHTMLString(htmlContent, baseURL: nil)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        var onNavigationRequest: ((String) -> Void)?

        init(onNavigationRequest: ((String) -> Void)?) {
            self.onNavigationRequest = onNavigationRequest
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            switch message.name {
            case "navigate":
                if let tool = message.body as? String {
                    onNavigationRequest?(tool)
                }
            case "downloadHandler":
                if let base64String = message.body as? String,
                   let base64Data = Data(base64Encoded: base64String.components(separatedBy: ",").last ?? ""),
                   let image = UIImage(data: base64Data) {
                    UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
                }
            default:
                break
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url?.absoluteString {
                if url.contains("index.html") {
                    onNavigationRequest?("ContentView")
                    decisionHandler(.cancel)
                    return
                }
            }
            decisionHandler(.allow)
        }
    }
}
