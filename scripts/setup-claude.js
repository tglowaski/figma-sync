#!/usr/bin/env node

/**
 * setup-claude.js
 *
 * Optional setup script that installs Claude Code skills and agents
 * from the Figma Sync plugin to the parent project.
 *
 * Usage: npm run setup-claude
 *
 * This script:
 * 1. Checks if Claude Code is detected in the parent project
 * 2. Creates the .claude directory structure if needed
 * 3. Copies skills and agents without overwriting existing files
 * 4. Prints success message with next steps
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`${colors.blue}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}!${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`${colors.gray}  ${message}${colors.reset}`);
}

/**
 * Check if we're running inside a submodule
 */
function getParentProjectPath() {
  // Start from the figma-plugin directory
  const pluginDir = path.resolve(__dirname, '..');

  // Go up to parent project (figma-plugin is typically at root or in a subdirectory)
  const parentDir = path.resolve(pluginDir, '..');

  // Check if parent has package.json (indicates a project)
  const parentPackageJson = path.join(parentDir, 'package.json');
  if (fs.existsSync(parentPackageJson)) {
    return parentDir;
  }

  // If not found, we might be at root level
  return null;
}

/**
 * Check if Claude Code is detected in a directory
 */
function hasClaudeCode(dir) {
  const claudeDir = path.join(dir, '.claude');
  const claudeMd = path.join(dir, 'CLAUDE.md');

  return fs.existsSync(claudeDir) || fs.existsSync(claudeMd);
}

/**
 * Copy a directory recursively, skipping existing files
 */
function copyDirectory(src, dest, options = {}) {
  const { overwrite = false, dryRun = false } = options;
  const copied = [];
  const skipped = [];

  if (!fs.existsSync(src)) {
    return { copied, skipped, error: `Source not found: ${src}` };
  }

  // Create destination if it doesn't exist
  if (!dryRun && !fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      // Recurse into directory
      const result = copyDirectory(srcPath, destPath, options);
      copied.push(...result.copied);
      skipped.push(...result.skipped);
    } else {
      // Check if file exists
      if (fs.existsSync(destPath) && !overwrite) {
        skipped.push(destPath);
      } else {
        if (!dryRun) {
          // Ensure parent directory exists
          const parentDir = path.dirname(destPath);
          if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
          }
          fs.copyFileSync(srcPath, destPath);
        }
        copied.push(destPath);
      }
    }
  }

  return { copied, skipped };
}

/**
 * Main setup function
 */
function main() {
  console.log('');
  log('╔══════════════════════════════════════════════════╗', colors.blue);
  log('║     Figma Sync - Claude Code Setup               ║', colors.blue);
  log('╚══════════════════════════════════════════════════╝', colors.blue);
  console.log('');

  // Step 1: Find parent project
  logStep('1/4', 'Detecting parent project...');

  const parentDir = getParentProjectPath();

  if (!parentDir) {
    logWarning('Could not detect parent project.');
    logInfo('Make sure figma-sync is installed as a submodule or in a subdirectory.');
    process.exit(1);
  }

  logSuccess(`Found parent project: ${parentDir}`);

  // Step 2: Check for Claude Code
  logStep('2/4', 'Checking for Claude Code...');

  if (!hasClaudeCode(parentDir)) {
    console.log('');
    logWarning('No Claude Code detected in parent project.');
    console.log('');
    log('To use Claude Code skills:', colors.bold);
    logInfo('1. Install Claude Code: https://claude.ai/code');
    logInfo('2. Run: claude in your project to initialize');
    logInfo('3. Run this script again: npm run setup-claude');
    console.log('');
    log('Alternatively, create a .claude directory or CLAUDE.md file manually.', colors.gray);
    console.log('');
    process.exit(0); // Exit cleanly, not an error
  }

  logSuccess('Claude Code detected');

  // Step 3: Define source and destination paths
  const pluginDir = path.resolve(__dirname, '..');
  const sourceClaudeDir = path.join(pluginDir, '.claude');
  const targetClaudeDir = path.join(parentDir, '.claude');

  // Step 4: Copy skills
  logStep('3/4', 'Installing skills and agents...');

  const skillsSource = path.join(sourceClaudeDir, 'skills', 'figma-sync');
  const skillsTarget = path.join(targetClaudeDir, 'skills', 'figma-sync');

  const agentsSource = path.join(sourceClaudeDir, 'agents');
  const agentsTarget = path.join(targetClaudeDir, 'agents');

  // Check if source exists
  if (!fs.existsSync(skillsSource)) {
    logWarning(`Skills source not found: ${skillsSource}`);
    logInfo('Make sure the plugin has been built with skills included.');
    process.exit(1);
  }

  // Copy skills
  const skillsResult = copyDirectory(skillsSource, skillsTarget);

  if (skillsResult.error) {
    logWarning(skillsResult.error);
  } else {
    if (skillsResult.copied.length > 0) {
      logSuccess(`Copied ${skillsResult.copied.length} skill files`);
      for (const file of skillsResult.copied) {
        logInfo(`+ ${path.relative(parentDir, file)}`);
      }
    }
    if (skillsResult.skipped.length > 0) {
      logWarning(`Skipped ${skillsResult.skipped.length} existing files`);
      for (const file of skillsResult.skipped) {
        logInfo(`~ ${path.relative(parentDir, file)} (already exists)`);
      }
    }
  }

  // Copy agents
  if (fs.existsSync(agentsSource)) {
    const agentsResult = copyDirectory(agentsSource, agentsTarget);

    if (agentsResult.copied.length > 0) {
      logSuccess(`Copied ${agentsResult.copied.length} agent files`);
      for (const file of agentsResult.copied) {
        logInfo(`+ ${path.relative(parentDir, file)}`);
      }
    }
    if (agentsResult.skipped.length > 0) {
      logWarning(`Skipped ${agentsResult.skipped.length} existing agent files`);
    }
  }

  // Step 5: Print success message
  logStep('4/4', 'Setup complete!');
  console.log('');
  log('╔══════════════════════════════════════════════════╗', colors.green);
  log('║  Claude Code skills installed successfully!      ║', colors.green);
  log('╚══════════════════════════════════════════════════╝', colors.green);
  console.log('');
  log('What was installed:', colors.bold);
  logInfo('• figma-sync skill - Config generation and reference docs');
  logInfo('• figma-design-system agent - Specialized design system assistant');
  console.log('');
  log('Try these commands in Claude Code:', colors.bold);
  logInfo('• "Generate a Figma Sync config for this project"');
  logInfo('• "How do I create a custom section renderer?"');
  logInfo('• "Debug why my tokens aren\'t importing"');
  console.log('');
  log('Documentation:', colors.bold);
  logInfo(`• ${path.relative(parentDir, skillsTarget)}/SKILL.md`);
  logInfo(`• ${path.relative(parentDir, skillsTarget)}/AGENTS.md`);
  console.log('');
}

// Run main function
try {
  main();
} catch (error) {
  console.error('');
  log(`Error: ${error.message}`, colors.yellow);
  console.error('');
  process.exit(1);
}
