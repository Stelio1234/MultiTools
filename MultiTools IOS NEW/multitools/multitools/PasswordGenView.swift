import SwiftUI

struct PasswordGenView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Password Generator")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Password Generator\nPassword Length:\n\nInclude Numbers?\n\nYes\nNo\n\nInclude Special Characters?\n\nYes\nNo\n\nInclude Uppercase Letters?\n\nYes\nNo\n\nGenerate Password\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Password Generator")
    }
}
