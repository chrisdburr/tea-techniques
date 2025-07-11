# TEA Techniques

![An illustration showing different techniques for assurance](https://alan-turing-institute.github.io/turing-commons/assets/images/illustrations/trust-yellow.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

An interactive database for exploring techniques for evidencing claims about responsible AI design, development, and deployment. This repository has been designed to work in conjunction with the [Trustworthy and Ethical Assurance (TEA) platform](https://assuranceplatform.azurewebsites.net/) as a core plugin to enable practitioners to identify and implement appropriate assurance methods.

## 🛠️ Development Setup

> [!WARNING]
> These instructions assume you are using Docker and Docker Compose. They have been tested on MacOS and Linux. If you are using Windows, you may need to adjust some commands.

1.  **Prerequisites:** Ensure you have Docker and Docker Compose installed ([Docker Desktop](https://www.docker.com/products/docker-desktop/) is recommended).
2.  **Clone the repository:**
    ```bash
    git clone https://github.com/chrisdburr/tea-techniques.git
    cd tea-techniques
    ```
3.  **Setup Environment Variables:**
    ```bash
    cp .env.example .env
    ```
    - Review the `.env` file. For development, the default database credentials used by Docker Compose should work fine, but you can customize them if needed.
4.  **Build and Start Services:**
    ```bash
    # Use the development compose file
    docker-compose -f docker-compose.development.yml up -d --build
    ```
5.  **Access the Application:**
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:8000/api/
    - Django Admin: http://localhost:8000/admin/ (Login with user: `admin`, password: `admin`)
6.  **Stopping the Services:**
    ```bash
    docker-compose -f docker-compose.development.yml down
    ```
7.  **Viewing Logs:**

    ```bash
    # View logs for all services
    docker-compose -f docker-compose.development.yml logs

    # View logs for a specific service (e.g., backend)
    docker-compose -f docker-compose.development.yml logs backend

    # Follow logs in real-time
    docker-compose -f docker-compose.development.yml logs -f backend
    ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
