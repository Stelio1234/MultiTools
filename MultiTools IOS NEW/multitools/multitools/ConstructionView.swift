import SwiftUI

struct ConstructionView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("MultiTools")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("We're working on it!\n\nThis page is currently not available.\nPlease come back later.\n\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("MultiTools")
    }
}
