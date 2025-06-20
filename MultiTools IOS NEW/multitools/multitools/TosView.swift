import SwiftUI

struct TosView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Terms of Service")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Terms of Service\nBasic Terms\n\nYou may not redistribute, sell, or modify this project.\nAdvertising is allowed but must be authorized by the site owner.\nUnauthorized use may result in legal action.\nThe project is provided \"as is\" with no warranties.\nWe are not responsible if you get in trouble for misusing any tools provided.\n\nYT and TikTok Downloaders\n\nWhen downloading the videos, it does not become your property.\nIf you download a video and plan to repost it, credit the creator of the video.\nIf you are downloading a copyrighted video, do NOT repost without permission.\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Terms of Service")
    }
}
