# Sci-Cast - AI-Powered Podcast Generator

Transform research papers into engaging podcasts using AI-powered script generation and voice synthesis.

## Features

- 🤖 **AI Script Generation** - Convert research papers to podcast scripts using Cerebras AI
- 🎙️ **Voice Synthesis** - Generate professional audio using ElevenLabs
- 🔐 **Authentication** - Secure user accounts with Supabase
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Dark/Light Mode** - Theme switching support
- 📄 **File Support** - PDF, DOCX, and TXT file processing

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- ElevenLabs API account
- Cerebras API account

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo-url>
   cd sci-cast
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. **Configure your environment variables** in `.env.local`:

   #### Supabase Setup
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project or select existing one
   - Go to Settings > API
   - Copy your Project URL and anon/public key
   
   #### ElevenLabs Setup
   - Go to [ElevenLabs](https://elevenlabs.io/app/speech-synthesis)
   - Sign up/login and go to your profile
   - Generate an API key
   
   #### Cerebras Setup
   - Go to [Cerebras Cloud](https://cloud.cerebras.ai/)
   - Sign up/login and create an API key

5. **Set up Supabase Authentication**
   
   In your Supabase dashboard:
   - Go to Authentication > Settings
   - Configure your site URL: `http://localhost:3000`
   - Add redirect URLs: `http://localhost:3000/auth/confirm`
   - Enable email authentication

6. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   \`\`\`

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required | Where to get it |
|----------|-------------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ | Supabase Dashboard > Settings > API |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice synthesis | ✅ | ElevenLabs Profile > API Keys |
| `CEREBRAS_API_KEY` | Cerebras API key for AI text generation | ✅ | Cerebras Cloud > API Keys |

## Usage

### Creating a Podcast

1. **Sign up/Login** - Create an account or sign in
2. **Upload Document** - Upload a PDF, DOCX, or TXT research paper
3. **Review Text** - Edit the extracted text if needed
4. **Generate Script** - AI creates an engaging podcast script
5. **Select Voice** - Choose from professional ElevenLabs voices
6. **Generate Audio** - Create your podcast MP3 file
7. **Download/Save** - Download or save to your library

### Supported File Types

- **PDF** - Research papers, articles
- **DOCX** - Word documents
- **TXT** - Plain text files
- **Size limit** - 10MB maximum

## API Endpoints

- `POST /api/extract-text` - Extract text from uploaded files
- `POST /api/generate-script` - Generate podcast script using AI
- `POST /api/generate-audio` - Generate audio using ElevenLabs
- `GET /api/voices` - Get available ElevenLabs voices

## Tech Stack

- **Framework** - Next.js 14 with App Router
- **Styling** - Tailwind CSS + shadcn/ui
- **Authentication** - Supabase Auth
- **Database** - Supabase PostgreSQL
- **AI Text Generation** - Cerebras (Llama 3.1-8B)
- **Voice Synthesis** - ElevenLabs
- **Deployment** - Vercel

## Development

### Project Structure

\`\`\`
sci-cast/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── create/            # Podcast creation page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── theme-provider.tsx
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase configuration
│   ├── cerebras.ts       # Cerebras AI setup
│   └── elevenlabs.ts     # ElevenLabs integration
├── hooks/                 # Custom React hooks
└── public/               # Static assets
\`\`\`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Supabase URL and keys
   - Verify redirect URLs in Supabase dashboard
   - Ensure site URL is configured correctly

2. **Audio generation fails**
   - Verify ElevenLabs API key
   - Check API quota/limits
   - Ensure script length is reasonable

3. **Script generation fails**
   - Verify Cerebras API key
   - Check API quota/limits
   - Ensure extracted text is not empty

### Getting Help

- Check the browser console for errors
- Verify all environment variables are set
- Check API key permissions and quotas
- Review Supabase logs in dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
