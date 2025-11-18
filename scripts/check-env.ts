#!/usr/bin/env tsx

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const requiredEnvVars = [
  'DATABASE_URL',
  'ANTHROPIC_API_KEY',
  'PORT',
  'HOST',
  'NODE_ENV',
];

const optionalEnvVars = [
  'SESSION_TIMEOUT_MINUTES',
  'MAX_MESSAGE_LENGTH',
];

function checkEnv() {
  console.log('🔍 Checking environment configuration...\n');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('\n💡 Copy .env.example to .env and fill in the values:');
    console.log('   cp .env.example .env\n');
    process.exit(1);
  }

  // Load .env file
  require('dotenv').config();

  let hasErrors = false;

  // Check required variables
  console.log('Required environment variables:');
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`  ❌ ${varName} - Missing`);
      hasErrors = true;
    } else {
      const displayValue = varName.includes('KEY') || varName.includes('PASSWORD')
        ? '***hidden***'
        : value;
      console.log(`  ✅ ${varName} - ${displayValue}`);
    }
  }

  // Check optional variables
  console.log('\nOptional environment variables:');
  for (const varName of optionalEnvVars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`  ⚠️  ${varName} - Not set (will use default)`);
    } else {
      console.log(`  ✅ ${varName} - ${value}`);
    }
  }

  if (hasErrors) {
    console.log('\n❌ Environment configuration is incomplete!');
    console.log('Please set all required environment variables in your .env file.\n');
    process.exit(1);
  }

  console.log('\n✅ Environment configuration is valid!\n');
}

checkEnv();
