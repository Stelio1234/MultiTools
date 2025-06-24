import SwiftUI

struct TipcalculatorView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Tip Calculator")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Tip Calculator\nBill Amount ($):\n\nTip Percentage (%):\n\nNumber of People:\n\nEach person pays: $0.00\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Tip Calculator")
    }
}
