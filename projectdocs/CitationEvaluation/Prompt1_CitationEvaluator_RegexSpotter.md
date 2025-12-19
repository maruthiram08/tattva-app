
You are tasked with analyzing citation patterns in a system and generating a comprehensive evaluation report. Your goal is to identify all citation formats that exist, evaluate the current regex pattern coverage, and document your findings.

Here is the existing code with citation patterns:

<code>
{{CODE}}
</code>

Here are examples of known citation formats:

<examples>
{{EXAMPLES}}
</examples>

Your task is to:
1. Analyze the existing regex patterns in the code to understand what citation formats they capture
2. Review the example citation formats provided
3. Identify any citation formats in the examples that may not be fully covered by the existing patterns
4. Consider additional citation format variations that might exist in the system (e.g., different separators, abbreviations, Roman numerals, alternative spellings)
5. Generate a detailed markdown report documenting your findings

Before writing your report, use the scratchpad to think through your analysis:

<scratchpad>
- Test each example format against each regex pattern
- Identify which patterns match which formats
- Note any gaps in coverage
- Consider edge cases and variations
- Plan the structure of your report
</scratchpad>

Your report should be in markdown format and include the following sections:

1. **Executive Summary** - Brief overview of findings
2. **Current Citation Patterns** - List and explain each regex pattern in the code
3. **Example Format Analysis** - For each example format, indicate:
   - The format structure
   - Which regex pattern(s) capture it
   - Whether it's fully covered or has gaps
4. **Coverage Gaps** - Identify any formats from examples not captured by current patterns
5. **Additional Format Variations** - Suggest other possible citation formats that might exist in the system (consider: Roman numerals for Kanda numbers, abbreviated forms, alternative punctuation, spacing variations, etc.)
6. **Recommendations** - Suggest new regex patterns or modifications to improve coverage
7. **Test Cases** - Provide specific test strings for each identified format

Write your complete markdown report inside <report> tags.

After generating the report, specify that it should be saved to:
<output_path>
{{OUTPUT_PATH}}
</output_path>

Begin your analysis now.