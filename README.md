# whiteboard

Whiteboard is a collaborative whiteboard application that enables real-time brainstorming and ideation for teams. It provides a digital canvas where multiple users can draw, add text, share images, and collaborate simultaneously.

## Features

### Real-time Collaboration
- Multiple users can work on the same board simultaneously
- See other users' cursors and changes in real-time
- User presence indicators show who's currently active

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

## Roadmap

- [ ] User authentication and personal board management
- [ ] Persistent storage with database integration
- [ ] Advanced shape tools and drawing options
- [ ] Templates for common brainstorming activities
- [ ] Presentation mode
- [ ] Mobile app support
- [ ] Voice and video chat integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by collaborative tools like Miro, FigJam, and Google Jamboard
- Built with Next.js and React
- UI components from shadcn/ui
- Icons from Lucide React
