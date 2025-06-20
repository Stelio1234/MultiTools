import SwiftUI

struct SubscriptionsView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Purchace Optios")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("MultiTools Free\n\n\n\n\n\n\n\n\n\nMultiTools Pro\nEverything In MultiTools Free\nAcsess to TikTok Downloader\n4K YT Downloads\nAcsess to Snaphchat Downloader\nAcsess to MultiTools Ai\nAcsess to MultiTools Discord\n\n\nMultiTools Pro\nEverything In MultiTools Free\nAcsess to TikTok Downloader\n4K YT Downloads\nAcsess to Snaphchat Downloader\nAcsess to MultiTools Ai\nAcsess to MultiTools Discord\n\nFree\n$2.99 / month\n$20.99 / year")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Purchace Optios")
    }
}
