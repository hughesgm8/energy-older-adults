# Energy Usage Dashboard
The Energy Usage Dashboard is a React + TypeScript application designed to provide users with insights into their energy consumption patterns. It visualizes energy usage data, categorizes devices, and offers comparative insights to help users make informed decisions about their energy usage.

***Note: please make use of Copilot (either on Github or within a code editor like VSCode) to explain parts of each file that may be unclear***

## Features
1. Usage Summary
Displays an overview of energy usage for the selected time period (day or week).
Includes a breakdown of energy usage by category or device.
Provides cost estimates based on standard electricity rates.
2. Category and Device Views
Category View: Groups devices by categories (e.g., Kitchen, Lighting) and shows energy usage for each category.
Device View: Displays detailed energy usage for individual devices within a selected category.
3. Energy Usage Patterns
Visualizes energy usage trends over time using charts.
Allows users to toggle between daily and weekly views.
4. Cost Insights
Provides detailed cost breakdowns for energy usage.
Compares current energy usage with previous periods (e.g., previous week).
5. Responsive Design
Optimized for both desktop and mobile devices.

## Installation
1. Clone the repository:
```
git clone <repository-url>
cd energy-dashboard
```

2. Install dependencies:
```
npm install
```

3. Start API client server (contains APIs required for fetching data):
```
python server.py
```

4. Start the development server:
```
npm run dev
```

## Usage
### Navigation
* **Date Navigation**: Use the navigation controls to move between days or weeks.
* **View Toggle**: Switch between daily and weekly views using the toggle buttons.

### Viewing Data
* **Category View**: Click on a category to view devices within that category.
* **Device View**: View detailed energy usage for individual devices.

### Insights
* **Usage Summary**: Provides an overview of energy usage and cost estimates.
* **Energy Chart**: Visualizes energy usage trends over time.
* **Cost Insights**: Offers a detailed breakdown of energy costs.

## Code Structure
### Key Components
* **Dashboard**: The main component that orchestrates the app's functionality.
* **CategoryView**: Displays energy usage grouped by categories.
* **DeviceView**: Shows detailed energy usage for individual devices.
* **UsageSummary**: Provides an overview of energy usage and costs.
* **EnergyChart**: Visualizes energy usage trends. Contains all chart components.
* **CostInsights**: Offers detailed cost breakdowns.

### Hooks
* **useDeviceData**: Fetches and manages device energy data.
* **useHistoricalData**: Retrieves historical energy usage data for comparisons.

### Services
* **ParticipantComparisonService**: Handles comparisons between participants' energy usage.

## Customization
### Adding New Categories
To add a new category:

1. Update the categoryMapping object in the Dashboard component.
2. Add a corresponding color in the colorMap object.

### Adjusting Cost Calculations
Modify the COST_PER_KWH constant in the UsageSummary component to reflect updated electricity rates.

## Future Enhancements
### Social Comparison Feature
The app includes a placeholder for a Social Comparison feature, which is currently disabled. To enable it:

1. Uncomment the `SocialComparison` import and component in the `Dashboard` file.
2. Ensure the `participantComparisonService` is configured with realistic data.

## Troubleshooting
### Common Issues
1. No Device Data Available:
* Ensure the `.env` file is correctly configured with device IPs and credentials.
* Verify that the devices are online and accessible.
2. Error Fetching Data:
* Check the console for error logs.
* Ensure the API client is correctly configured.

# React + TypeScript + Vite Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
