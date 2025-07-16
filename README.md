# 🧾 Invoice Processing System

An AI-powered invoice processing application that extracts data from PDF invoices using OCR and Google Gemini AI enhancement. Built with React, TypeScript, Supabase, and deployed on Netlify.

## 🚀 Live Demo

**[View Live Demo on Netlify](https://astonishing-travesseiro-93beb0.netlify.app/)**


## ✨ Features

- 📄 **PDF Invoice Processing** - Upload and extract text from PDF invoices
- 🤖 **AI-Powered Enhancement** - Google Gemini integration for improved field extraction
- 🔍 **Smart OCR** - Hybrid approach using OCR.space API and Tesseract.js
- 📊 **Field Extraction** - Automatically extracts invoice numbers, dates, vendors, totals, and line items
- 💾 **Data Persistence** - Supabase backend for storing processed invoices
- 📈 **Processing Logs** - Real-time processing status and detailed logs
- ⚙️ **Configurable AI** - Support for multiple AI providers (Gemini, OpenAI, Azure)
- 📱 **Responsive Design** - Modern UI built with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **OCR**: OCR.space API, Tesseract.js
- **AI**: Google Gemini API
- **Deployment**: Netlify
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project
- Google AI Studio account (for Gemini API key)
- Git installed

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/s-felman/InvoiceProduct.git
cd InvoiceProduct
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Setup

#### Initialize Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g @supabase/cli

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your_project_ref
```

#### Apply Database Migrations

```bash
# Navigate to supabase directory
cd supabase

# Apply all migrations
npx supabase db push

# Deploy edge functions
npx supabase functions deploy extract-pdf
```

### 5. Database Schema

The application uses the following tables:

- `invoices` - Stores processed invoice data
- `ai_settings` - Stores AI provider configurations
- `processing_logs` - Stores processing activity logs

All migrations are included in the `supabase/migrations/` directory.

### 6. Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key (starts with "AIza...")

### 7. Configure AI Provider

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to Settings page
3. Select "Google Gemini" as provider
4. Enter your API key
5. Click "Test Connection" and then "Save Settings"

### 8. Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

### Manual Deployment

```bash
# Build the project
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### AI Enhancement Logic

AI enhancement is triggered when:
- OCR confidence is below 75%
- PDF is detected as image-only
- Basic OCR extraction finds fewer than 3 fields

## 📊 OCR Processing Pipeline

### 1. PDF Processing (Primary)
```
PDF → Supabase Edge Function → OCR.space API → Extracted Text
```

### 2. Image Processing (Fallback)
```
Image → Browser → Tesseract.js → Extracted Text
```

### 3. Field Extraction
```
Raw Text → Regex Patterns → Structured Data → AI Enhancement → Final Result
```

## ⚙️ Configuration Options

### AI Providers
- **Google Gemini** (Recommended) - Free with generous limits
- **OpenAI GPT** - Paid service with high accuracy
- **Azure OpenAI** - Enterprise option
- **None** - Basic OCR only

### OCR Settings
- **OCR.space API** - For PDF processing (free tier)
- **Tesseract.js** - For image processing and fallback

## 🔧 API Endpoints

### Supabase Edge Functions

- `POST /functions/v1/extract-pdf` - Process PDF files

### Database Tables

- `invoices` - Processed invoice data
- `ai_settings` - AI configuration
- `processing_logs` - Activity logs

### Architecture Decisions

1. **Hybrid OCR Approach**
   - **Server-side (OCR.space)**: Better PDF handling, faster processing
   - **Client-side (Tesseract.js)**: Fallback option, works offline
   - **Reasoning**: Reliability through redundancy

2. **Google Gemini over OpenAI**
   - **Cost**: Free tier vs. paid per request
   - **Performance**: Comparable accuracy for document parsing
   - **Scalability**: High rate limits without billing setup

3. **Supabase Backend**
   - **Real-time**: Built-in real-time subscriptions
   - **Edge Functions**: Serverless compute for OCR processing
   - **PostgreSQL**: Robust relational database
   - **Authentication**: Built-in user management (ready for future)

4. **React + TypeScript**
   - **Type Safety**: Reduced runtime errors
   - **Developer Experience**: Better IDE support and refactoring
   - **Maintainability**: Clear interfaces and contracts

5. **Tailwind CSS**
   - **Rapid Development**: Utility-first approach
   - **Consistency**: Design system built-in
   - **Performance**: Purged CSS in production

### Processing Pipeline Design

1. **Progressive Enhancement**
   - Basic OCR → Regex Parsing → AI Enhancement
   - Each step improves data quality
   - Graceful degradation if AI fails

2. **Confidence-Based Processing**
   - High confidence: Skip AI (cost savings)
   - Low confidence: Trigger AI enhancement
   - Smart resource utilization

3. **Comprehensive Logging**
   - Real-time feedback to users
   - Debugging information for developers
   - Processing transparency
