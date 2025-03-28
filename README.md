# Talkify - Red Social de Blogs

Este es un proyecto de red social de blogs donde los usuarios pueden ver publicaciones sin necesidad de iniciar sesión. Sin embargo, al autenticarse con Google, pueden crear publicaciones, darles like y comentarlas.

## Tecnologías Utilizadas

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend
- Flask
- Python

## Instalación y Ejecución

### Requisitos Previos
- Node.js y npm instalados
- Python y virtualenv instalados

### Instalación y ejecución del Frontend
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/ChrisUBS/talkify
   cd frontend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Instalación y ejecución del Backend
1. Navegar al directorio del backend:
   ```bash
   cd backend
   ```
2. Crear y activar un entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows usar `venv\Scripts\activate`
   ```
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Ejecutar el servidor:
   ```bash
   python server.py
   ```

## Características
- **Exploración pública**: Cualquier usuario puede ver publicaciones sin necesidad de iniciar sesión.
- **Autenticación con Google**: Para crear posts, comentar y dar like, se debe iniciar sesión con Google.
- **Creación de posts**: Los usuarios autenticados pueden publicar contenido.
- **Likes y comentarios**: Interacción con publicaciones mediante likes y comentarios.

## Contribución
Si deseas contribuir a este proyecto, por favor, sigue los siguientes pasos:
1. Realiza un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature-nueva`).
3. Realiza tus modificaciones y haz commit (`git commit -m 'Agrega nueva funcionalidad'`).
4. Sube tus cambios (`git push origin feature-nueva`).
5. Abre un Pull Request en GitHub.

## Licencia
Este proyecto está bajo la licencia GNU GPL (General Public License).

