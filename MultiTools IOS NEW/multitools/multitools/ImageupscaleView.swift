import SwiftUI

struct ImageupscaleView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Image Upscaler")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.primary)

                Text("Image Upscaler\n\n\n\n\n\n2x Upscale\n4x Upscale\n\n\n\nUpscale\nDownload\n\n\n\nBack")
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Image Upscaler")
    }
}
