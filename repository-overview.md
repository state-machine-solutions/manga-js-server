# Repository Overview

Welcome to the Manga Server project repository.

## Project Overview

The Manga Server project is a Node.js application designed for manga enthusiasts. It provides a platform for managing and reading manga content. Users can customize various aspects of the application to suit their preferences.

## Features

- Manga management and reading capabilities
- Customizable environment variables for personalization
- HTTP and WebSocket support for communication
- Flexible data storage options
- Automatic data saving functionality
- Panel visibility control for improved performance
- Temporary data handling with auto-expiration
- RESTful API support with configurable paths

## Project Structure

The project follows a standard Node.js application structure:

/
├── config/ # Config method to get value from env
├── modules/ # Modules of manga server
├── Dockerfile # Dockerfile for building Docker image
└── README.md # Project documentation

## Installation and Usage

To get started with the Manga Server project, follow these steps:

1. Clone the repository:

   ```bash
   git clone <repository_url>
   cd manga-server
   ```

2. Customize environment variables:

   - **APP_NAME**: Set the name of your application for logging purposes.
   - **HTTP_READ_PORT**: Set the HTTP port opened for reading without write permissions. Default is 80.
   - **HTTP_READ_AUTH_API_TOKEN**: API TOKEN string to be sent in the header for read access.
   - **HTTP_WRITE_PORT**: Set the HTTP port for full read/write access. Default is 81.
   - **HTTP_WRITE_AUTH_API_TOKEN**: API TOKEN string to be sent in the header for full access.
   - **IO_READ_PORT**: Set the WebSocket port for read-only connections. Default is 8000.
   - **IO_READ_AUTH_USERNAME**: Set the username for WebSocket read connections.
   - **IO_READ_AUTH_PASSWORD**: Set the password for WebSocket read connections.
   - **IO_READ_JWT_CHECKER_URL**: URL for checking JWT tokens during read operations.
   - **IO_WRITE_PORT**: Set the WebSocket port for read/write connections. Default is 8001.
   - **IO_WRITE_AUTH_USERNAME**: Set the username for WebSocket write connections.
   - **IO_WRITE_AUTH_PASSWORD**: Set the password for WebSocket write connections.
   - **IO_WRITE_JWT_CHECKER_URL**: URL for checking JWT tokens during write operations.
   - **INITIAL_DATA**: Set the path to the JSON file containing initial data to load into memory.
   - **AUTO_SAVE_FREQUENCY**: Set the frequency (in seconds) for automatic data saving.
   - **HIDE_PANEL**: Set to false to improve performance by hiding the panel showing client connections.
   - **USE_TEMP_DATA**: If set to true, allows temporary data to automatically vanish after a set time.
   - **HTTP_REST_PATH**: Configure the base path for RESTful HTTP methods. For example, if set to "/rest", a GET request to "/rest/aa/bb" would map to the data path `aa.bb`.

3. Build the Docker image:

   ```bash
   docker build -t manga-server .
   ```

4. Run the Docker container:

   ```bash
   docker run -d -p <host_http_read_port>:<container_http_read_port> \
      -p <host_http_write_port>:<container_http_write_port> \
      -p <host_io_read_port>:<container_io_read_port> \
      -p <host_io_write_port>:<container_io_write_port> \
      -e APP_NAME="<Your_App_Name>" \
      -e HTTP_READ_PORT=<Your_HTTP_Read_Port> \
      -e HTTP_READ_AUTH_API_TOKEN=<Your_HTTP_Read_API_Token> \
      -e HTTP_WRITE_PORT=<Your_HTTP_Write_Port> \
      -e HTTP_WRITE_AUTH_API_TOKEN=<Your_HTTP_Write_API_Token> \
      -e IO_READ_PORT=<Your_IO_Read_Port> \
      -e IO_READ_AUTH_USERNAME="<Your_IO_Read_Username>" \
      -e IO_READ_AUTH_PASSWORD="<Your_IO_Read_Password>" \
      -e IO_READ_JWT_CHECKER_URL="<Your_IO_Read_JWT_Checker_URL>" \
      -e IO_WRITE_PORT=<Your_IO_Write_Port> \
      -e IO_WRITE_AUTH_USERNAME="<Your_IO_Write_Username>" \
      -e IO_WRITE_AUTH_PASSWORD="<Your_IO_Write_Password>" \
      -e IO_WRITE_JWT_CHECKER_URL="<Your_IO_Write_JWT_Checker_URL>" \
      -e INITIAL_DATA="<Your_Initial_Data_Path>" \
      -e AUTO_SAVE_FREQUENCY=<Your_Auto_Save_Frequency> \
      -e HIDE_PANEL=<Your_Hide_Panel> \
      -e USE_TEMP_DATA=<Your_Use_Temp_Data> \
      -e HTTP_REST_PATH="<Your_HTTP_Rest_Path>" \
      manga-server
   ```

   Replace `<placeholders>` with your desired values.

## Contribution

Contributions to the Manga Server project are welcome! Follow these guidelines to contribute:

- Clone the repository.
- Create a new branch for your feature or bug fix.
- Make your changes and commit them.
- Open a pull request with a clear description of your changes.

## License

This project is licensed under the Apache 2.0 License.
