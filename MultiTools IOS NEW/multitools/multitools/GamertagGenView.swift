import SwiftUI

struct GamertagGenView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Advanced Gamer Tag Generator")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Advanced Gamer Tag Generator\nAnswer a few questions to create a unique gamer tag!\nWhat is your favorite color?\n\nWhat is your favorite animal?\n\nWhat is your favorite hobby?\n\nWhat is your favorite game?\n\nChoose a symbol for your tag:\n\nNone\n_\n-\n.\nx\n@\n\nGenerate Gamer Tag\nYour generated gamer tag will appear here\nCopy Gamer Tag\n\n← Back")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Advanced Gamer Tag Generator")
    }
}
