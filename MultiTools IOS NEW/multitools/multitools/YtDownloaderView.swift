import SwiftUI

struct YtDownloaderView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("YT Downloader")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("YT Downloader\nThis Downloader is currently offline. More updates coming soon.\n\n\n\n\n\nHighest Quality\n1080p\n720p\n480p\n\nDownload\n\n\n\n\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("YT Downloader")
    }
}
