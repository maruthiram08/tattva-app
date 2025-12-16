# Technical Documentation: Ramayana Explorer

## AI Title Generation Pipeline

To improve the user experience of the Sarga (Chapter) list, we generate short, evocative titles for each Sarga using AI. The raw dataset only provides long summaries, which are often truncated in the UI.

### Workflow

1.  **Source Data**: `lib/data/ramayana.ts` reads from `Valmiki_Ramayan_Dataset/data/Valmiki_Ramayan_Shlokas.json`.
2.  **Generation Script**: `scripts/generate_title_comparison.ts`
    *   Reads the full dataset.
    *   Extracts unique Sargas and their summaries.
    *   Queries **Claude** and **OpenAI** (if configured) to generate a 2-6 word title.
    *   Outputs a comparison table to `projectdocs/sarga_title_comparison.md`.
3.  **Manual Review**:
    *   A human reviewer checks `projectdocs/sarga_title_comparison.md`.
    *   They select the best title or write a custom one in the "Final Selection" column.
4.  **Integration**:
    *   (Future Step) A script parses the completed Markdown table.
    *   Generates `lib/data/sarga_titles.json`.
    *   The application reads this JSON to display titles.

### Environment Variables

The following API keys are required in `.env.local` for the generation script:

-   `ANTHROPIC_API_KEY`: For Claude generation.
-   `OPENAI_API_KEY`: For OpenAI generation.
