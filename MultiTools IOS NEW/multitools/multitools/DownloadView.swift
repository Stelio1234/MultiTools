import SwiftUI

struct DownloadView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Download")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("App Store\nWe are curently trying to get a Apple Developer account so we can publish the app to the App Store.\n\n📲 Add to Home Screen\niPhone & iPad (Safari):\n\n Tap the Share icon at the bottom (iPhone) or top (iPad) of Safari.\n Scroll down and select \"Add to Home Screen\".\n Tap Add in the top-right corner.\n\niPhone & iPad (Chrome):\n\n Tap the Share icon (square with arrow) in the top-right corner.\n Scroll down and choose \"Add to Home Screen\".\n Tap Add to confirm.\n\nAndroid (Chrome):\n\n Tap the 3-dot menu in the top-right corner.\n Choose \"Add to Home screen\".\n Tap Add when prompted.\n\n\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Download")
    }
}
