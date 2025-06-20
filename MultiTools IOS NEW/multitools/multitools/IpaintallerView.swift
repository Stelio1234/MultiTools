import SwiftUI

struct IpaintallerView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("IPA OTA Installer")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("IPA OTA Installer\nUpload your .ipa file to install over-the-air on iOS\n\nUpload & Install")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("IPA OTA Installer")
    }
}
