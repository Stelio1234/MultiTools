import SwiftUI

struct TiktokDownloaderView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("TikTok Downloader")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("TikTok Downloader\n\n\nDownload\n\n\n\n\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("TikTok Downloader")
    }
}
