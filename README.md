# whiteboard
<img width="1309" alt="Screenshot 2025-05-28 at 1 11 30 AM" src="https://github.com/user-attachments/assets/e374309d-1c03-4754-a631-f52972294e15" />

Whiteboard is a collaborative whiteboard application that enables real-time brainstorming and ideation for teams. It provides a digital canvas where multiple users can draw, add text, share images, and collaborate simultaneously.

## Features

### Real-time Collaboration
- Multiple users can work on the same board simultaneously

### Rich Drawing Tools
- Pen tool with adjustable line width and color
- Shape tools including rectangles, circles, and arrows
- Text and sticky notes for adding comments and ideas
- Eraser tool for quick corrections

### Media Support
- Add images from URLs or upload your own
- Insert emojis and stickers from a categorized library
- Create sticky notes for longer text content

### Sharing & Export
- Generate shareable links to invite others
- Invite collaborators via email
- Download your whiteboard as a PNG image

### User Interface
- Clean, intuitive interface with tabbed organization
- Responsive design that works on various screen sizes
- Undo/redo functionality for easy editing

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/brainboard.git
cd brainboard
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

4. Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### Creating a New Board
- Visit the homepage to automatically create a new board
- Start drawing immediately with the default pen tool

### Inviting Collaborators
1. Click the Share button in the toolbar
2. Copy the generated link or enter email addresses to send invitations
3. Recipients can join by clicking the link or accepting the invitation

### Using Drawing Tools
- **Select**: Choose and manipulate existing elements
- **Pen**: Free-hand drawing with customizable color and width
- **Eraser**: Remove parts of your drawing
- **Shapes**: Add rectangles, circles, and arrows
- **Text**: Add text labels and annotations
- **Sticky Notes**: Add resizable notes for longer content
- **Stickers**: Insert emojis and icons
- **Images**: Upload or link to images

### Saving Your Work
- Boards are automatically saved in real-time
- Download a snapshot as a PNG using the Download button

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Real-time Communication**: WebSockets (Socket.io in production)
- **UI Components**: Lucide React icons

## License

This project is licensed under the MIT License - see the LICENSE file for details.
