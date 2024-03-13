# Fetch

This project is designed to fetch web pages, parse them for metadata, and optionally mirror them for offline browsing. It leverages Node.js for backend processing, Puppeteer for web page interaction, and Cheerio for lightweight HTML parsing.

## High-Level Design

The application operates in two main modes:

1. **Fetch and Parse**: Downloads web pages, extracts metadata (e.g., number of links and images, last fetch time), and displays this information to the user.
2. **Mirror Mode**: In addition to fetching and parsing, this mode saves a complete copy of the web page and its assets for offline viewing.

The project is structured to allow easy expansion for additional parsing capabilities and is designed with modularity in mind to facilitate maintenance and future enhancements.

## Libraries and Tools Used

- **Node.js**: The runtime environment for executing JavaScript code server-side.
- **Puppeteer**: A Node library to control headless Chrome or Chromium over the DevTools Protocol, used for web page navigation and interaction.
- **Cheerio**: A fast, flexible, and lean implementation of core jQuery designed specifically for the server, used for parsing HTML content.
- **TypeScript**: A superset of JavaScript that adds static types, used for writing clearer and more maintainable code.

## Setup and Installation

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build the Project (TypeScript compilation)**

   ```bash
   npm run build
   ```

   This command compiles the TypeScript source files in the src directory to JavaScript in the dist directory.

## Running the Application

### Via npm Script

    ```bash
    npm run dev http://autify.com https://www.google.com -- --metadata --mirror
    ```

### Direct Execution

    ```bash
    ./dist/fetch http://autify.com https://www.google.com --metadata --mirror
    ```

### Via Docker

1. **Build the Docker Image**

   ```bash
   docker build -t <image-name> .
   ```

2. **Run the Container**

   ```bash
   docker run <image-name> <options>
   ```

## Command-Line Options

- `--metadata`: Fetches and displays metadata for the specified URLs.
- `--mirror`: This mode saves a complete copy of the web page and its assets for offline viewing.

## Docker Support

The project includes a Dockerfile for containerization, allowing it to be built and run inside a Docker container. This ensures compatibility across different environments and simplifies deployment.
