#!/bin/sh
set -e

mkdir -p storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

if [ -n "$DB_HOST" ]; then
  echo "Waiting for database at ${DB_HOST}:${DB_PORT:-3306}..."
  until php -r "\$host=getenv('DB_HOST'); \$port=(int)(getenv('DB_PORT') ?: 3306); exit(@fsockopen(\$host, \$port) ? 0 : 1);"; do
    sleep 2
  done
fi

if [ -z "$APP_KEY" ] && [ -f .env ]; then
  php artisan key:generate --force --no-interaction
fi

php artisan storage:link || true
php artisan migrate --force || true
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

exec "$@"
