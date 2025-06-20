import SwiftUI

struct LoginView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Login")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Login\nPlease note that accounts are online but are not fully compleated and are as on now for testing\n\n\nLogin\nLogin With Google\nDon't have an account? Sign Up\n\n\n\nSign Up\nPlease note that accounts are online but are not fully compleated and are as on now for testing\n\n\nRegister\nSign Up With Google\nAlready have an account? Login")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Login")
    }
}
