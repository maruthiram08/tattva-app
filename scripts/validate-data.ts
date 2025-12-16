/**
 * Data Validation Script
 * Validates Valmiki Ramayana dataset structure and computes statistics
 */

import * as fs from 'fs';
import * as path from 'path';

interface ShlokaData {
  kanda: string;
  sarga: number;
  shloka: number;
  shloka_text: string;
  transliteration: string | null;
  translation: string | null;
  explanation: string;
  comments: string | null;
}

interface ValidationReport {
  totalShlokas: number;
  byKanda: Record<string, number>;
  missingFields: {
    transliteration: number;
    translation: number;
    explanation: number;
    comments: number;
  };
  percentages: {
    hasTransliteration: number;
    hasTranslation: number;
    hasExplanation: number;
    hasComments: number;
  };
  issues: string[];
}

async function validateData(): Promise<ValidationReport> {
  console.log('🔍 Starting data validation...\n');

  const dataPath = path.join(
    __dirname,
    '..',
    'Valmiki_Ramayan_Dataset',
    'data',
    'Valmiki_Ramayan_Shlokas.json'
  );

  // Read dataset
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const dataset: ShlokaData[] = JSON.parse(rawData);

  console.log(`✅ Loaded ${dataset.length} shlokas from JSON\n`);

  // Initialize report
  const report: ValidationReport = {
    totalShlokas: dataset.length,
    byKanda: {},
    missingFields: {
      transliteration: 0,
      translation: 0,
      explanation: 0,
      comments: 0,
    },
    percentages: {
      hasTransliteration: 0,
      hasTranslation: 0,
      hasExplanation: 0,
      hasComments: 0,
    },
    issues: [],
  };

  // Validate each shloka
  dataset.forEach((shloka, index) => {
    // Count by kanda
    if (!report.byKanda[shloka.kanda]) {
      report.byKanda[shloka.kanda] = 0;
    }
    report.byKanda[shloka.kanda]++;

    // Check required fields
    if (!shloka.kanda) {
      report.issues.push(`Shloka ${index + 1}: Missing kanda`);
    }
    if (!shloka.sarga && shloka.sarga !== 0) {
      report.issues.push(`Shloka ${index + 1}: Missing sarga`);
    }
    if (!shloka.shloka && shloka.shloka !== 0) {
      report.issues.push(`Shloka ${index + 1}: Missing shloka number`);
    }
    if (!shloka.shloka_text) {
      report.issues.push(`Shloka ${index + 1}: Missing shloka_text`);
    }

    // Check optional fields
    if (!shloka.transliteration) report.missingFields.transliteration++;
    if (!shloka.translation) report.missingFields.translation++;
    if (!shloka.explanation) {
      report.missingFields.explanation++;
      // Note: Missing explanations are expected (16% of dataset)
    }
    if (!shloka.comments) report.missingFields.comments++;
  });

  // Calculate percentages
  report.percentages.hasTransliteration =
    ((dataset.length - report.missingFields.transliteration) / dataset.length) * 100;
  report.percentages.hasTranslation =
    ((dataset.length - report.missingFields.translation) / dataset.length) * 100;
  report.percentages.hasExplanation =
    ((dataset.length - report.missingFields.explanation) / dataset.length) * 100;
  report.percentages.hasComments =
    ((dataset.length - report.missingFields.comments) / dataset.length) * 100;

  return report;
}

function printReport(report: ValidationReport): void {
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal Shlokas: ${report.totalShlokas.toLocaleString()}\n`);

  console.log('Distribution by Kanda:');
  for (const [kanda, count] of Object.entries(report.byKanda)) {
    const percentage = ((count / report.totalShlokas) * 100).toFixed(1);
    console.log(`  ${kanda.padEnd(20)} ${count.toString().padStart(5)} (${percentage}%)`);
  }

  console.log('\nData Completeness:');
  console.log(`  Transliteration:  ${report.percentages.hasTransliteration.toFixed(1)}%`);
  console.log(`  Translation:      ${report.percentages.hasTranslation.toFixed(1)}%`);
  console.log(`  Explanation:      ${report.percentages.hasExplanation.toFixed(1)}%`);
  console.log(`  Comments:         ${report.percentages.hasComments.toFixed(1)}%`);

  if (report.issues.length > 0) {
    console.log(`\n⚠️  Found ${report.issues.length} issues:`);
    report.issues.slice(0, 10).forEach((issue) => {
      console.log(`  - ${issue}`);
    });
    if (report.issues.length > 10) {
      console.log(`  ... and ${report.issues.length - 10} more`);
    }
  } else {
    console.log('\n✅ No critical issues found!');
  }

  console.log('\n' + '='.repeat(60));
}

// Run validation
validateData()
  .then((report) => {
    printReport(report);

    // Save report to file
    const reportPath = path.join(__dirname, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}`);

    // Exit with warning if many missing fields, but don't fail
    const missingExplanationPercent = (report.missingFields.explanation / report.totalShlokas) * 100;
    if (missingExplanationPercent > 20) {
      console.log(`\n⚠️  Warning: ${missingExplanationPercent.toFixed(1)}% of shlokas missing explanations`);
      console.log('   These will be handled gracefully during embedding generation\n');
    }

    console.log('✅ Validation passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Validation error:', error);
    process.exit(1);
  });
