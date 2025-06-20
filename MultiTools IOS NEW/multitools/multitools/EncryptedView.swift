import SwiftUI

struct EncryptedView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Text Encrypter/Decrypter")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Select Tool\nEncrypt\nDecrypt\nBack\n\n\nEncrypt Text\n\n\n\n\n\n\n\n\nBase64\n\n\n\nEncrypt\n\n\nBack\n\n\nDecrypt Text\n\n\n\n\n\n\n\n\nBase64\n\n\n\nDecrypt\n\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Text Encrypter/Decrypter")
    }
}
