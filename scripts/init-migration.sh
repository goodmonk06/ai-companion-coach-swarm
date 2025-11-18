#!/bin/bash

# Initialize first Prisma migration
echo "🔄 Creating initial Prisma migration..."

npx prisma migrate dev --name init

echo "✅ Initial migration created!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run db:seed' to populate initial data"
echo "  2. Run 'npm run dev' to start the development server"
