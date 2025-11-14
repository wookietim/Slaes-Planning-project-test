# IKEA Sales Planning Application

A TypeScript React application for managing sales planning data with workflow management.

## Features

- **Sales Data Entry**: Enter sales data including country, HFB, turnover, profit, quantity, and gross margin
- **Workflow Management**: Built-in approval workflow (Draft → Review → Approved → Published)
- **Data Validation**: Form validation ensures all required fields are completed before submission
- **Responsive Design**: Mobile-friendly interface
- **TypeScript**: Full type safety throughout the application

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   ├── SalesPlanningForm.tsx    # Main form component
│   └── WorkflowControls.tsx     # Workflow status and controls
├── types.ts                     # TypeScript type definitions
├── App.tsx                      # Main application component
├── App.css                      # Application styles
├── main.tsx                     # Application entry point
└── index.css                    # Global styles
```

## Workflow States

1. **Draft** - Initial state for new entries
2. **Review** - Submitted for review and approval
3. **Approved** - Approved by reviewer
4. **Published** - Final published state
5. **Versioning** - Option to create new version from published state

## Usage

1. Enter the country name in the country field
2. Fill in the sales data for Q1 (HFB, turnover, profit, quantity, gross margin)
3. Click "Send for review, assign reviewer" to move to review state
4. Use "Approved" button to approve the data
5. Use "Publish" button to publish the final data
6. Use "versioning" to create a new version from published state

## Technologies Used

- React 18
- TypeScript
- Vite
- ESLint
- CSS3 with Grid Layout