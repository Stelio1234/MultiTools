import SwiftUI

struct TimerView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Timer Tool")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Timer\n\n\n\n\n\n\nStart\nStop\n\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Timer Tool")
    }
}
