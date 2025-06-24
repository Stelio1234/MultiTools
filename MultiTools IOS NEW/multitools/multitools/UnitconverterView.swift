import SwiftUI

struct UnitconverterView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Manage Account")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Back")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Manage Account")
    }
}
