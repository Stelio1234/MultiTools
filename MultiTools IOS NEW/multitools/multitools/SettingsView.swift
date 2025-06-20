import SwiftUI

struct SettingsView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Settings")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Settings\n\nLog Out\nDelete Account\n\n\nEmail: Loading...\nSign-in Method: Loading...\n\n\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Settings")
    }
}
