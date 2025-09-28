using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace MultiToolsApp
{
    public sealed partial class MainWindow : Window
    {
        public MainWindow()
        {
            this.InitializeComponent();
            ContentFrame.Navigate(typeof(Pages.DashboardPage)); // default page
            NavView.SelectionChanged += NavView_SelectionChanged;
        }

        private void NavView_SelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
        {
            string tag = args.SelectedItemContainer.Tag.ToString();
            switch (tag)
            {
                case "dashboard":
                    ContentFrame.Navigate(typeof(Pages.DashboardPage));
                    break;
                case "timer":
                    ContentFrame.Navigate(typeof(Pages.TimerPage));
                    break;
                case "unitconverter":
                    ContentFrame.Navigate(typeof(Pages.UnitConverterPage));
                    break;
                case "tipcalculator":
                    ContentFrame.Navigate(typeof(Pages.TipCalculatorPage));
                    break;
                case "qrcode":
                    ContentFrame.Navigate(typeof(Pages.QRCodePage));
                    break;
            }
        }
    }
}
