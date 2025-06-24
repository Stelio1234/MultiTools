import SwiftUI

struct UsefulToolsView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Useful links")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Useful Tools\nThese Tools are not mine But they are trusted tools\n\nVirus Total\n7zip\nWinRar\nCloudflare VPN\nChat GPT\nVisual Code Studio")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Useful links")
    }
}
