# Unsent Canvas

[Demo en vivo](https://unsent-canvas.vercel.app/) ¡Pruébalo ahora y agrega tu propia nota!

![Unsent Canvas](/public/icon.svg)

![Typescript](https://img.shields.io/badge/Typescript-3178C6?logo=Typescript&logoColor=white)
![React](https://img.shields.io/badge/React-38bdf8?logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?logo=Supabase&logoColor=white)
![Field](https://img.shields.io/badge/Web%20Development-white)
![License](https://img.shields.io/badge/MIT%20License-brown)

Unsent Canvas es un lienzo colaborativo de notas anónimas en tiempo real. Los usuarios pueden colocar notas cortas en cualquier parte de un espacio compartido infinito. El proyecto está inspirado en The Unsent Project, pero reinventado como un lienzo espacial e interactivo para la expresión abierta.

> POR FAVOR visita el demo en vivo y contribuye con una nota. Tus palabras ayudan a formar la comunidad. [Demo en vivo](https://unsent-canvas.vercel.app/)

Creé Unsent Canvas porque realmente me encanta la idea de dar a las personas un espacio para compartir pensamientos, sentimientos y mensajes sin barreras. El concepto de notas públicas y anónimas, donde cualquiera puede contribuir y ver cómo se desarrolla la historia colectiva. Este proyecto es un trabajo de amor, construido para hacer realidad ese sueño.

## Características

- Lienzo infinito: Haz clic en cualquier parte para crear una nota. Desplázate y haz zoom libremente.
- Colaboración en tiempo real: Ve nuevas notas aparecer instantáneamente mientras otros escriben.
- Anónimo y público: No se requiere inicio de sesión. Todas las notas son visibles para todos.
- Notas personalizables: Elige colores, posición y destinatario para cada nota.
- Limitación de frecuencia y enfriamiento: Previene el spam con controles en el cliente y el servidor.
- Moderación de contenido: Filtrado automático de lenguaje ofensivo, spam y contenido inapropiado.
- Sistema de reportes: Los usuarios pueden reportar notas para revisión.
- Accesibilidad: Navegación por teclado, anuncios para lectores de pantalla y UI responsiva.
- UI moderna: Construido con Next.js, Tailwind CSS, Radix UI y Sonner para notificaciones.

## Comenzando

### Prerrequisitos

- Node.js (v18+ recomendado)
- Proyecto Supabase (para base de datos y backend en tiempo real)

### 1. Clona e instala

```bash
git clone https://github.com/LeonardoCerv/unsent-canvas.git
cd unsent-canvas
npm install
```

### 2. Configura el entorno

Crea un archivo `.env.local` con tus credenciales de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
ADMIN_API_KEY=tu_admin_key_seguro
```

### 3. Configura la base de datos

Ejecuta el script SQL en `database-setup.sql` usando el Editor SQL de Supabase. Esto:

- Creará la tabla `notes` con seguridad de nivel de fila (RLS)
- Habilitará lectura pública, escritura solo desde el servidor
- Agregará infraestructura de limitación de frecuencia y moderación

### 4. Inicia la aplicación

```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000) para usar Unsent Canvas.

## Uso

- Crear una nota: Haz clic en cualquier espacio vacío del lienzo.
- Desplazar/Zoom: Arrastra, desplaza o usa las flechas. Haz zoom con `Ctrl/Cmd + Scroll`.
- Reportar: Haz clic en una nota y usa el botón "Reportar" para contenido inapropiado.
- Atajos de teclado:
  - Desplazar: Arrastrar, desplazar o flechas
  - Zoom: `Ctrl/Cmd + Scroll`
  - Restablecer zoom: `Ctrl/Cmd + 0`
  - Agregar nota: Haz clic en una celda vacía
  - Seleccionar nota: Haz clic o usa `Tab`
  - Desplazamiento horizontal: `Shift + Scroll`

## Moderación y Seguridad

- Limitación de frecuencia: Límites por usuario (cliente y servidor) para prevenir spam.
- Moderación de contenido: Filtra lenguaje ofensivo, spam y contenido inapropiado.
- Reportes: Las notas pueden ser reportadas y marcadas para revisión de administrador.
- Seguridad de nivel de fila: Solo el servidor puede escribir/eliminar; el público puede leer.

## Stack Tecnológico

- Frontend: Next.js, React, Tailwind CSS, Radix UI, Sonner
- Backend: Supabase (Postgres, Realtime, RLS)
- Otros: ESLint, TypeScript

## Contribuir

Se aceptan pull requests y issues. Por favor abre un issue para discutir cambios importantes.

## Licencia

Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## Créditos

Inspirado por The Unsent Project. Construido por Leonardo Cerv.
