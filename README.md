# Invoice AI Mini Product

A modern React application for intelligent invoice processing using OCR and AI technology.

## Features

- **PDF Upload**: Drag-and-drop interface for uploading PDF invoices
- **OCR Processing**: Extract text from invoices using Tesseract.js
- **AI Enhancement**: Improve parsing accuracy with OpenAI or Azure OpenAI
- **Confidence Indicators**: Show extraction confidence levels for each field
- **Settings Management**: Configure AI providers and API keys
- **Processing History**: View and manage all processed invoices
- **Real-time Logs**: Monitor processing activity and system messages

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **OCR**: Tesseract.js
- **AI**: OpenAI / Azure OpenAI
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 16+
- A Supabase project
- (Optional) OpenAI or Azure OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd invoice-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
Connect to your Supabase project and run the SQL migrations in `/supabase/migrations/` to create the required tables.

5. Start the development server:
```bash
npm run dev
```

### Supabase Setup

You'll need to create these tables in your Supabase database:

1. **invoices** - Store invoice processing results
2. **ai_settings** - Store AI provider configurations
3. **processing_logs** - Store processing activity logs

Run the migration files in order to set up the database schema.

### AI Configuration

1. Go to the Settings page
2. Choose your preferred AI provider (OpenAI or Azure OpenAI)
3. Enter your API credentials
4. Test the connection
5. Save settings

## Usage

1. **Upload Invoice**: Drag and drop a PDF invoice on the upload page
2. **Processing**: The system will extract text using OCR and enhance with AI
3. **Results**: View extracted fields with confidence indicators
4. **History**: Review all processed invoices in the history page
5. **Settings**: Configure AI providers for better accuracy

## Deployment

### Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify:
- Connect your GitHub repository
- Set build command: `npm run build`
- Set publish directory: `dist`
- Add environment variables in Netlify dashboard

### Environment Variables for Production

Set these in your Netlify dashboard:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Integration

### OpenAI
- Get API key from [OpenAI Dashboard](https://platform.openai.com/api-keys)
- Uses GPT-3.5-turbo model for invoice parsing

### Azure OpenAI
- Set up Azure OpenAI service
- Get API key, endpoint, and deployment name
- Configure in the settings page

## Development Notes

- Uses Tesseract.js for OCR processing
- Implements confidence scoring for extracted fields
- Supports both OpenAI and Azure OpenAI for AI enhancement
- Responsive design with Tailwind CSS
- Type-safe with TypeScript
- Context-based state management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.