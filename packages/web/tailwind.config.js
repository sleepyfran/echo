/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,tsx}"],
  theme: {
    extend: {
      colors: {
        backgroundColor: "#f4f4f9",
        backgroundSelectedColor: "#d1d1dc",
        backgroundMutedColor: "#e9e9f3",
        borderColor: "#e9e9f3",
        borderProminentColor: "#007bff",
        disabledBackgroundColor: "#cccccc",
        primaryTextColor: "#280505",
        secondaryTextColor: "#555555",
        accentColor: "#ff6f61",
        errorColor: "#dc3545",
        warningColor: "#ffc107",
        buttonBackgroundColor: "#007bff",
        buttonTextColor: "#ffffff",
        buttonHoverBackgroundColor: "#0056b3",
        buttonSecondaryBackgroundColor: "transparent",
        buttonSecondaryTextColor: "#333333",
        buttonSecondaryHoverBackgroundColor: "#007bff",

        /* Dark mode colors */
        darkBackgroundColor: "#2e2e2e",
        darkBackgroundSelectedColor: "#434343",
        darkBackgroundMutedColor: "#3c3c3c",
        darkBorderColor: "#3c3c3c",
        darkWarningColor: "#91731b",
        darkDisabledBackgroundColor: "#666666",
        darkPrimaryTextColor: "#f4f4f9",
        darkSecondaryTextColor: "#cccccc",
        darkButtonBackgroundColor: "#375a7f",
        darkButtonTextColor: "#ffffff",
        darkButtonHoverBackgroundColor: "#2c3e50",
        darkButtonSecondaryTextColor: "#f4f4f9",
      },
    },
  },
  plugins: [],
};
