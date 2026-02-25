# GameLog

Track your gaming journey - log games you've played and plan to play.

<img width="1467" height="839" alt="image" src="https://github.com/user-attachments/assets/cd0e6ea0-d32c-46f9-be8d-23d7a0209447" />

## Features

- **Game Tracking**: Search and log games from the RAWG database
- **Status Management**: Track progress (Plan to Play, Playing, Completed)
- **Ratings & Notes**: Rate your games and keep personal notes
- **Platform Tracking**: Log which platform you played on (PC, PS5, Switch, etc.)
- **Easy Self-hosting**: Docker-ready with SQLite database
- **RAWG Integration**: Access metadata for over 500,000+ games

## Quick Start: Self-host

```bash
docker pull horlesq/gamelog:latest
docker run -d --name gamelog --restart unless-stopped -p 3000:3000 -v data:/app/data horlesq/gamelog:latest
```

After running

- Open `http://YOUR_SERVER_IP:3000`
- Login with `admin@email.com` / `changeme`

Port busy?

- If 3000 is in use on your host, change only the left side of the mapping (keep container port 3000):

```bash
docker run -d --name gamelog --restart unless-stopped -p 9000:3000 -v data:/app/data horlesq/gamelog:latest
```

## Alternative Quick Start: Docker Compose (build locally)

1. Clone the repository

```bash
git clone https://github.com/horlesq/gamelog.git
cd gamelog
```

2. Start the app

```bash
docker compose up -d
```

3. Access the app

- http://localhost:3000
- Login: admin@email.com / changeme (or check .env)

## Development in Docker

If you want to run the development server with hot-reloading using Docker:

1. Start the dev container:

```bash
docker compose -f docker-compose.dev.yml up
```

2. Access the app at http://localhost:3000
3. Any changes you make to the source code will be reflected immediately.

---

## Useful Commands

```bash
# Start application
docker compose up -d

# Stop application
docker compose down

# View logs
docker compose logs -f

# Update to latest version
git pull
docker compose build --no-cache
docker compose up -d

# Backup database (SQLite)
cp data/gamelog.db backup-$(date +%Y%m%d).db
```

## Troubleshooting

### Port Already in Use

Change the external port in `docker-compose.yml`:

```yaml
ports:
    - "8082:3000" # Use port 8082 instead
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

If you want to run from source code:

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The app will auto-generate a `.env` file with all necessary settings on first startup.

**Access the app**

- Open http://localhost:3000
- Login with admin@email.com / changeme

## Configuration

### Environment Variables

| Variable       | Description               | Default                   |
| -------------- | ------------------------- | ------------------------- |
| `JWT_SECRET`   | Secret key for JWT tokens | Auto-generated on startup |
| `DATABASE_URL` | Database file path        | `file:./data/gamelog.db`  |
| `RAWG_API_KEY` | RAWG API Key              | Required for game search  |

**Note**: JWT_SECRET and DATABASE_URL variables are auto-configured on first startup. You can customize them by editing the generated `.env` file.

## Default Admin Account

On first startup, an admin account is automatically created:

- **Email**: `admin@email.com`
- **Password**: `changeme`

⚠️ **Important**: Change the admin password after first login!

## Security Notes

- JWT secrets are auto-generated securely on startup
- Change the default admin password after first login
- Use HTTPS in production with a reverse proxy
- Regular database backups recommended

### Can't Access from Other Devices

- Use your server's IP address instead of localhost
- Ensure port 3000 is open in your firewall
- Check Docker port binding: `docker compose ps`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you find this project useful, please consider giving it a star! ⭐

For issues and feature requests, please use the GitHub Issues tab.

---

**Built with**: Next.js, TypeScript, Tailwind CSS, Prisma, SQLite
