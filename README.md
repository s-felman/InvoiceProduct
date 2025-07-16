# 🧾 Invoice Processing System

An AI-powered invoice processing application that extracts data from PDF invoices using OCR and Google Gemini AI enhancement. Built with React, TypeScript, Supabase, and deployed on Netlify.

## 🚀 Live Demo

**[View Live Demo on Netlify](https://astonishing-travesseiro-93beb0.netlify.app/)**


## ✨ Features

- 📄 **PDF Invoice Processing** - Upload and extract text from PDF invoices
- 🤖 **AI-Powered Enhancement** - Google Gemini, OpenAI and Azure OpenAI  integration for improved field extraction
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
- **AI**: OpenAI, Azure OpenAI, Google Gemini API
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

### 6. Development Server

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
- OCR confidence is below 90%
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

## 🔧 Development Challenges & Solutions

### Performance Optimization Challenge
**Problem:** Initial implementation with Tesseract.js was extremely slow for PDF processing, creating poor user experience with long wait times (sometimes 30+ seconds per invoice).

**Solution:** Migrated OCR processing to Supabase Edge Functions with OCR.space API integration:
- Moved heavy processing from client-side to server-side
- Leveraged external OCR APIs for faster, more accurate results
- Reduced processing time from 30+ seconds to 2-3 seconds
- Maintained Tesseract.js as fallback for image processing

### OCR Configuration & Accuracy Tuning
**Problem:** Spent significant time fine-tuning OCR extraction settings to achieve reliable results across different invoice formats and quality levels.

**Solution:** Through iterative testing and adjustment:
- Experimented with different preprocessing techniques
- Calibrated confidence thresholds for optimal accuracy (90% trigger for AI enhancement)
- Implemented fallback mechanisms for edge cases
- Created regex patterns specific to invoice data extraction
- Added validation rules for common invoice formats

### AI Integration & Cost Considerations
**Problem:** Initially planned to use OpenAI/Azure OpenAI APIs but encountered cost constraints during development and testing phases.

**Solution:** Pivoted to Google Gemini API for AI enhancement:
- Gemini offers free tier with generous limits (15 requests/minute)
- Maintained modular architecture to support multiple AI providers
- Implemented same functionality with cost-effective solution
- Kept settings flexible to allow future provider changes
- Added provider switching capability in settings

### Additional Technical Hurdles
- **PDF Format Variations:** Handled different PDF structures (text-based vs image-based)
- **Error Handling:** Created comprehensive error boundaries for failed OCR attempts
- **State Management:** Managed complex application state during multi-step processing
- **API Integration:** Coordinated multiple external services (OCR, AI, Database) seamlessly
- **Processing Pipeline:** Designed confidence-based processing to optimize resource usage

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

Thank you for the opportunity to work on this project.