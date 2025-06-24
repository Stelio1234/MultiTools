import SwiftUI

struct PatchnotesView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Manage Account")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Patch Notes\nVersion 1.3  5/30\n\nAccounts Added\n\nVersion 1.3  5/30\n\nTip Calculator has been added.\n\nVersion 1.2  5/25\n\nAny Bug mentioned in the discord as of 5/25 have been fixed\n\nVersion 1.1  5/23\n\nMobile ui fixes\nRemoved None Button\nOTA ipa installer button added. but the tool is currently not functional\nAdded Download instructions\nTemporarily removed AES Encrypter option.\n\nVersion 1  5/21\n\nAdded All tools\nMost Tools are not fully completed\n\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Manage Account")
    }
}
