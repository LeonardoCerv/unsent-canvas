> 📖 🇪🇸 También disponible en español: [README.es.md](README.es.md)


# Unsent Canvas

[Live Demo](https://unsent-canvas.vercel.app/) Try it now and add your own note to the canvas!

![Unsent Canvas](/public/icon.svg)

![Typescript](https://img.shields.io/badge/Typescript-3178C6?logo=Typescript&logoColor=white)
![React](https://img.shields.io/badge/React-38bdf8?logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?logo=Supabase&logoColor=white)
![Field](https://img.shields.io/badge/Web%20Development-white)
![License](https://img.shields.io/badge/MIT%20License-brown)


Unsent Canvas is an anonymous, real-time collaborative note canvas. Users can place short notes anywhere on an infinite shared space. The project is inspired by The Unsent Project, but reimagined as a spatial, interactive canvas for open expression.

> PLEASE visit the live demo and contribute a note. Your words help shape the canvas and the community. [Live Demo](https://unsent-canvas.vercel.app/)

I created Unsent Canvas because I truly love the idea of giving people a space to share thoughts, feelings, and messages without barriers. The concept of anonymous, public notes, where anyone can contribute and see the collective story unfold. This project is a labor of love, built to make that dream a reality.

## Features

- Infinite canvas: Click anywhere to create a note. Pan and zoom freely.
- Real-time collaboration: See new notes appear instantly as others write.
- Anonymous and public: No login required. All notes are visible to everyone.
- Customizable notes: Choose colors, position, and recipient for each note.
- Rate limiting and cooldown: Prevents spam with client-side and server-side controls.
- Content moderation: Automated filtering for profanity, spam, and inappropriate content.
- Reporting system: Users can report notes for review.
- Accessibility: Keyboard navigation, screen reader announcements, and responsive UI.
- Modern UI: Built with Next.js, Tailwind CSS, Radix UI, and Sonner for notifications.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Supabase project (for database and real-time backend)

### 1. Clone and Install

```bash
git clone https://github.com/LeonardoCerv/unsent-canvas.git
cd unsent-canvas
npm install
```

### 2. Configure Environment

Create a `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_API_KEY=your_secure_admin_key
```

### 3. Set Up Database

Run the SQL script in `database-setup.sql` using Supabase SQL Editor. This will:

- Create the `notes` table with secure Row Level Security (RLS)
- Enable public read, server-only write
- Add rate limiting and moderation infrastructure

### 4. Start the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use Unsent Canvas.

## Usage

- Create a note: Click any empty spot on the canvas.
- Pan/Zoom: Drag, scroll, or use arrow keys. Zoom with `Ctrl/Cmd + Scroll`.
- Report: Click a note and use the "Report" button for inappropriate content.
- Hotkeys:
  - Pan: Drag, scroll, or arrow keys
  - Zoom: `Ctrl/Cmd + Scroll`
  - Reset Zoom: `Ctrl/Cmd + 0`
  - Add Note: Click empty grid cell
  - Select Note: Click or use `Tab`
  - Horizontal Pan: `Shift + Scroll`

## Moderation and Security

- Rate limiting: Limits per user (client and server) to prevent spam.
- Content moderation: Filters for profanity, spam, and inappropriate content.
- Reporting: Notes can be reported and flagged for admin review.
- Row Level Security: Only server can write/delete; public can read.

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS, Radix UI, Sonner
- Backend: Supabase (Postgres, Realtime, RLS)
- Other: ESLint, TypeScript

## Contributing

Pull requests and issues are welcome. Please open an issue to discuss major changes.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Credits

Inspired by The Unsent Project. Built by Leonardo Cerv.