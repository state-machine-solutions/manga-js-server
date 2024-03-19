# Repository Overview

Welcome to the manga project repository.

## Project Overview

The manga project is a Node.js application designed for manga enthusiasts. It provides a platform for managing and reading manga content. Users can customize various aspects of the application to suit their preferences.

## Features

- Manga management and reading capabilities
- Customizable environment variables for personalization
- HTTP and WebSocket support for communication
- Flexible data storage options
- Automatic data saving functionality
- Panel visibility control for improved performance

## Project Structure

The project follows a standard Node.js application structure:

/
├── src/ # Source code directory
├── public/ # Public files directory
├── Dockerfile # Dockerfile for building Docker image
├── README.md # Project documentation
└── .gitignore # Gitignore file to exclude unnecessary files

csharp
Copy code

## Installation and Usage

To get started with the manga project, follow these steps:

1. Clone the repository:

git clone <repository_url>
cd manga

vbnet
Copy code

2. Customize environment variables:

- **APP_NAME**: Set the name of your application for logging purposes.
- **HTTP_PORT**: Set the HTTP port opened internally in the Docker container. Default is 80.
- **IO_PORT**: Set the port for WebSocket connections. If null, the port is disabled.
- **IO_AUTH_USERNAME**: Set the login for WebSocket connections.
- **IO_AUTH_PASSWORD**: Set the password for WebSocket connections.
- **INITIAL_DATA**: Set the path to the JSON file containing initial data to load into memory.
- **AUTO_SAVE_FREQUENCY**: Set the frequency (in seconds) for automatic data saving.
- **HIDE_PANEL**: Set to false to improve performance by hiding the panel showing client connections.

3. Build the Docker image:

docker build -t manga .

markdown
Copy code

4. Run the Docker container:

docker run -d -p <host_http_port>:<container_http_port> -p <host_io_port>:<container_io_port> -e APP_NAME="<Your_App_Name>" -e HTTP_PORT=<Your_HTTP_Port> -e IO_PORT=<Your_IO_Port> -e IO_AUTH_USERNAME="<Your_Username>" -e IO_AUTH_PASSWORD="<Your_Password>" -e INITIAL_DATA="<Your_Initial_Data_Path>" -e AUTO_SAVE_FREQUENCY=<Your_Auto_Save_Frequency> -e HIDE_PANEL=<Your_Hide_Panel> manga

markdown
Copy code

Replace `<placeholders>` with your desired values.

## Contribution

Contributions to the manga project are welcome! Follow these guidelines to contribute:

- Clone the repository.
- Create a new branch for your feature or bug fix.
- Make your changes and commit them.
- Open a pull request with a clear description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
This overview provides an introduction to the manga project, its features, customization options, installation instructions, contribution guidelines, and licensing information. Users can easily follow these instructions to customize the project according to their preferences and contribute to its development.
